# Multi-Agent Routing Pipeline: Architectural Blueprint

**Role:** System Architect & Lead AI Researcher
**Project:** Private Second Brain (Life OS)
**Phase:** 6 (Multi-Agent Tool Calling)

---

## 1. Architectural Challenge Context
Currently, the `/api/chat` endpoint is a static, single-path pipeline:
*(User Query)* -> *(ChromaDB RAG)* -> *(Llama 3.2 Context Prompt)* -> *(SSE Response)*.

This works perfectly for retrieving vault notes, but fails entirely if the user asks a conversational question ("Hello!"), a mathematical question ("Calculate my taxes"), or requests live data ("Search the web for news"). We need a dynamically routing "Agent" that can decide *when* to use RAG, *when* to use generic knowledge, and *when* to execute Python tools.

---

## 2. Framework Integration Choices

### 2.1 Standard LangChain vs. LangGraph
For a production-grade multi-agent system, **LangGraph** is the undeniable choice.
*   **Why not Standard LangChain Tools/Agents?** Standard `create_react_agent` loops running locally on smaller models like `Llama 3.2 (3B)` are notoriously brittle. They often get stuck in endless thought loops or hallucinate tool schemas.
*   **The LangGraph Advantage:** LangGraph allows us to define rigid, stateful graphs (Nodes and Edges). We can explicitly map a clear entry point, a "Tool Node" that safely executes Python functions, and a "Routing Edge" that forces the LLM to either respond or call a tool deterministically.

### 2.2 Local Model Tool Support
Fortunately, **Llama 3.2** natively supports tool calling (function calling). We will leverage LangChain's `ChatOllama` wrapper (using `bind_tools`) which maps Python functions using `@tool` decorators directly into the JSON schema that Llama expects.

---

## 3. Proposed Architecture (LangGraph Setup)

### 3.1 The Agent State
We will define a state object that carries the conversation history:
```python
from langgraph.graph.message import add_messages
from typing import Annotated, TypedDict

class State(TypedDict):
    messages: Annotated[list, add_messages]
```

### 3.2 The Nodes (The Workers)
1.  **The LLM Node**: This node receives the `State`. It calls `llm.bind_tools(tools).invoke(messages)`. It returns a message. If the LLM decides to use a tool, this message will contain a `.tool_calls` attribute.
2.  **The Tool Node**: A pre-built LangGraph `ToolNode` that intercepts any message carrying `.tool_calls`. It securely executes the corresponding Python function (e.g., searching ChromaDB, searching duckduckgo) and appends the raw tool output back to the `State` as a `ToolMessage`.

### 3.3 The Routing Logic (The Edges)
1.  We start at the **LLM Node**.
2.  A conditional edge looks at the LLM's output:
    *   If `output.tool_calls` exists -> Route to **Tool Node**.
    *   If no tool calls -> Route to **__END__** (stream to user).
3.  The **Tool Node** always routes back to the **LLM Node** so the LLM can see the tool's output and summarize an answer.

### 3.4 Refactoring RAG into a Tool
We will rip the ChromaDB similarity search out of the main request path and wrap it in a LangChain `@tool`.
```python
@tool
def search_vault(query: str) -> str:
    """Use this tool to search the user's private documents, notes, and PDFs."""
    docs = vector_store.similarity_search(query, k=3)
    return "\n\n".join([f"Source ({d.metadata.get('source')}): {d.page_content}" for d in docs])
```
Now, the LLM will actively *decide* to search the vault only if the user's query requires personal knowledge!

---

## 4. Tool Execution & Streaming to Next.js

### 4.1 Backend Parsing
LangGraph operates asynchronously via `graph.astream_events()`. As the graph runs, it emits events representing different states (LLM thinking, Tool executing, Final answer streaming).

### 4.2 SSE Payload Schema
We must update our FastAPI SSE generator to stream distinct event types so the Next.js UI knows what is happening:
*   `{"type": "status", "message": "Searching vault..."}` -> Emitted when a tool executes.
*   `{"type": "token", "token": "..."}` -> Emitted as the LLM streams its final summary.
*   `{"type": "sources", "sources": [...]}` -> Emitted natively by the `search_vault` tool when it finds matches.

### 4.3 Frontend UX Handling
*   The Next.js `ChatInterface` will be upgraded so when it receives a `"status"` event, it displays a beautiful pulsing UI badge (e.g., "*🧠 Agent is searching your vault...*").
*   When `"token"` events fire, it smoothly pipes them into the standard markdown renderer.

---

## 5. Phased Step-by-Step Implementation Plan

### Phase 1: Backend Setup & Tool Definitions
1.  Install `langgraph`.
2.  In `main.py`, define the `@tool` for `search_vault(query: str)`.
3.  (Optional) Define a mock secondary tool, e.g., `@tool` `get_weather(city: str)`.

### Phase 2: Building the LangGraph Router
1.  Initialize the StateGraph.
2.  Create the `llm_node` function.
3.  Create the `should_continue` conditional router.
4.  Compile the graph using a SQLite checkpointer (to maintain persistent chat memory per thread).

### Phase 3: SSE Streaming Overhaul
1.  Refactor `POST /api/chat` to accept threaded user messages.
2.  Replace the static `llm.stream()` with `graph.astream_events(..., version="v2")`.
3.  Write an async generator that translates LangGraph events into our custom `data: {...}` SSE strings.

### Phase 4: Frontend UI Updates
1.  Update `page.tsx` payload parser to handle `"status"` events.
2.  Add a visual indicator in the chat bubble UI to render intermediate "Thought/Action" states to the user while they wait for the final LLM summary.
