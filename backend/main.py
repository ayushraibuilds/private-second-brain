import json
import os

import chromadb
from chromadb.config import Settings
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from langchain_community.document_loaders import PyPDFLoader
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.tools import tool
from langchain_ollama import ChatOllama
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langgraph.graph import START, MessagesState, StateGraph
from langgraph.prebuilt import ToolNode, tools_condition

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VAULT_DIR = os.path.join(BASE_DIR, "..", "vault")
DOCS_DIR = os.path.join(VAULT_DIR, "documents")
CHROMA_DIR = os.path.join(VAULT_DIR, ".chroma")

os.makedirs(VAULT_DIR, exist_ok=True)
os.makedirs(DOCS_DIR, exist_ok=True)

print("Loading Local Nomic Embeddings...")
embeddings = OllamaEmbeddings(model="nomic-embed-text")

print("Initializing Local ChromaDB...")
chroma_client = chromadb.PersistentClient(
    path=CHROMA_DIR,
    settings=Settings(anonymized_telemetry=False),
)
vector_store = Chroma(
    client=chroma_client,
    collection_name="langchain",
    persist_directory=CHROMA_DIR,
    embedding_function=embeddings,
)

print("Connecting to Local Llama 3.2...")
llm = ChatOllama(model="llama3.2", keep_alive=0)


class NoteRequest(BaseModel):
    title: str
    content: str


class ChatRequest(BaseModel):
    query: str


def sse_event(payload):
    return f"data: {json.dumps(payload)}\n\n"


def chunk_to_text(chunk):
    content = getattr(chunk, "content", "")
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict) and item.get("type") == "text":
                parts.append(item.get("text", ""))
        return "".join(parts)
    return ""


@tool
def search_vault(query: str) -> str:
    """Search the local markdown vault and uploaded documents for relevant context."""
    docs = vector_store.similarity_search(query, k=3)

    if not docs:
        return "No relevant notes found in the vault."

    return "\n\n".join(
        [
            f"Source ({doc.metadata.get('source', 'unknown')}): {doc.page_content}"
            for doc in docs
        ]
    )


tools = [search_vault]
tool_node = ToolNode(tools)
llm_with_tools = llm.bind_tools(tools)


async def call_model(state: MessagesState):
    system_message = SystemMessage(
        content=(
            "You are a helpful assistant. "
            "ONLY use the search_vault tool if the user explicitly asks about their notes, "
            "documents, or vault. "
            "For all other general questions, conversational topics, or creative requests, "
            "answer directly without tools."
        )
    )
    response = await llm_with_tools.ainvoke([system_message, *state["messages"]])
    return {"messages": [response]}


graph_builder = StateGraph(MessagesState)
graph_builder.add_node("agent", call_model)
graph_builder.add_node("tools", tool_node)
graph_builder.add_edge(START, "agent")
graph_builder.add_conditional_edges("agent", tools_condition)
graph_builder.add_edge("tools", "agent")
graph = graph_builder.compile()


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "engine": "online"}


@app.get("/api/notes")
async def list_notes():
    notes = []
    if os.path.exists(VAULT_DIR):
        for filename in os.listdir(VAULT_DIR):
            if filename.endswith(".md"):
                file_path = os.path.join(VAULT_DIR, filename)
                stats = os.stat(file_path)
                notes.append(
                    {
                        "filename": filename,
                        "title": filename.replace(".md", "").replace("_", " ").title(),
                        "size_bytes": stats.st_size,
                        "created_at": stats.st_ctime,
                    }
                )
    return {"notes": sorted(notes, key=lambda x: x["created_at"], reverse=True)}


@app.delete("/api/notes/{filename}")
async def delete_note(filename: str):
    if not filename.endswith(".md"):
        filename += ".md"

    file_path = os.path.join(VAULT_DIR, filename)

    existing_docs = vector_store.get(where={"source": filename})
    existing_ids = existing_docs.get("ids", []) if existing_docs else []
    if existing_ids:
        vector_store.delete(ids=existing_ids)

    if os.path.exists(file_path):
        os.remove(file_path)
        return {
            "status": "success",
            "message": f"Deleted {filename} and removed associated vectors.",
        }

    raise HTTPException(status_code=404, detail="File not found.")


@app.post("/api/notes/save")
async def save_note(note: NoteRequest):
    safe_title = note.title.replace(" ", "_").lower()
    file_path = os.path.join(VAULT_DIR, f"{safe_title}.md")

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(note.content)

    existing_docs = vector_store.get(where={"source": f"{safe_title}.md"})
    existing_ids = existing_docs.get("ids", []) if existing_docs else []
    if existing_ids:
        vector_store.delete(ids=existing_ids)

    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.split_text(note.content)
    docs = [
        Document(page_content=chunk, metadata={"source": f"{safe_title}.md"})
        for chunk in chunks
    ]

    vector_store.add_documents(docs)

    return {
        "status": "success",
        "file": f"{safe_title}.md",
        "chunks_embedded": len(docs),
    }


@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename.")

    filename = os.path.basename(file.filename)
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF uploads are supported.")

    file_path = os.path.join(DOCS_DIR, filename)

    try:
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)

        loader = PyPDFLoader(file_path)
        pages = loader.load()

        existing_docs = vector_store.get(where={"source": filename})
        existing_ids = existing_docs.get("ids", []) if existing_docs else []
        if existing_ids:
            vector_store.delete(ids=existing_ids)

        splitter = RecursiveCharacterTextSplitter(chunk_size=1200, chunk_overlap=300)
        docs = splitter.split_documents(pages)

        for chunk in docs:
            chunk.metadata = {"source": filename}

        vector_store.add_documents(docs)

        return {"status": "success", "file": filename, "chunks": len(docs)}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to ingest PDF: {exc}")
    finally:
        await file.close()


@app.post("/api/chat")
async def chat(req: ChatRequest):
    async def generate():
        try:
            try:
                async for event in graph.astream_events(
                    {"messages": [HumanMessage(content=req.query)]},
                    version="v2",
                ):
                    event_name = event.get("event")

                    if (
                        event_name == "on_tool_start"
                        and event.get("name") == "search_vault"
                    ):
                        yield sse_event(
                            {"type": "status", "message": "Searching vault..."}
                        )

                    if event_name == "on_chat_model_stream":
                        chunk = event.get("data", {}).get("chunk")
                        token = chunk_to_text(chunk)
                        if token:
                            yield sse_event({"type": "token", "token": token})
            except Exception:
                yield sse_event(
                    {
                        "type": "token",
                        "token": "\n\n[Backend Graph Error] Tool execution failed.",
                    }
                )
        except Exception as exc:
            yield sse_event({"type": "error", "message": str(exc)})
        finally:
            yield sse_event({"type": "done"})

    return StreamingResponse(generate(), media_type="text/event-stream")
