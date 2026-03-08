import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.llms import Ollama
from langchain_community.vectorstores import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

app = FastAPI()

# Allow Next.js frontend to talk to this local server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Absolute paths to keep vault and database strictly local
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VAULT_DIR = os.path.join(BASE_DIR, "..", "vault")
CHROMA_DIR = os.path.join(VAULT_DIR, ".chroma")

# Ensure the vault exists
os.makedirs(VAULT_DIR, exist_ok=True)

# Initialize ZERO-CLOUD Local Models
print("Loading Local Nomic Embeddings...")
embeddings = OllamaEmbeddings(model="nomic-embed-text")

print("Initializing Local ChromaDB...")
vector_store = Chroma(persist_directory=CHROMA_DIR, embedding_function=embeddings)

print("Connecting to Local Llama 3.2...")
llm = Ollama(model="llama3.2") 

# --- API MODELS ---
class NoteRequest(BaseModel):
    title: str
    content: str

class ChatRequest(BaseModel):
    query: str

# --- ENDPOINTS ---
@app.post("/api/notes/save")
async def save_note(note: NoteRequest):
    # 1. Save raw Markdown file to the Vault
    safe_title = note.title.replace(" ", "_").lower()
    file_path = os.path.join(VAULT_DIR, f"{safe_title}.md")
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(note.content)

    # 2. Chunk the text for the Vector Database
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = splitter.split_text(note.content)
    
    # 3. Create LangChain Documents with metadata
    docs = [Document(page_content=chunk, metadata={"source": note.title}) for chunk in chunks]

    # 4. Embed and store locally in ChromaDB
    vector_store.add_documents(docs)

    return {"status": "success", "file": f"{safe_title}.md", "chunks_embedded": len(docs)}

@app.post("/api/chat")
async def chat(req: ChatRequest):
    # 1. Perform Local RAG Search
    docs = vector_store.similarity_search(req.query, k=3)
    
    if not docs:
        context = "No relevant notes found in the vault."
    else:
        context = "\n\n".join([f"Source ({d.metadata.get('source')}): {d.page_content}" for d in docs])

    # 2. Construct the strict local prompt (Vanilla Administrative Persona)
    prompt = f"""You are a helpful personal assistant reading from the user's private journal.
Answer the user's question accurately using ONLY the text provided in the Context below. 
Do not add any outside information.

Context:
{context}

User Question: {req.query}
Assistant: """

    # 3. Stream the response directly from local RAM
    def generate():
        for chunk in llm.stream(prompt):
            yield chunk

    return StreamingResponse(generate(), media_type="text/event-stream")
