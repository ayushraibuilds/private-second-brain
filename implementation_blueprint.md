# Implementation Blueprint: Private AI Second Brain (Local-First Life OS)

This is a highly detailed, step-by-step blueprint designed to feed a code generator. The system consists of a Next.js frontend, a FastAPI backend, local Markdown file storage, a ChromaDB vector store, and a local Ollama instance for embeddings and generation. ZERO cloud APIs are permitted.

## Project Structure (Monorepo)
```
private-second-brain/
├── backend/
│   ├── requirements.txt
│   ├── main.py
│   └── ...
├── frontend/
│   ├── package.json
│   ├── app/
│   │   ├── page.tsx
│   │   └── ...
│   └── ...
└── vault/
    └── (Markdown files stored here)
```

## Phase 1: Foundation & Backend Setup (LocalAIEngineer)

### Step 1.1: Initialize Backend Environment
1. Create directories: `mkdir -p private-second-brain/backend`, `mkdir -p private-second-brain/frontend`, `mkdir -p private-second-brain/vault`.
2. Inside `backend`, create `requirements.txt` with exactly these dependencies:
   ```text
   fastapi
   uvicorn
   langchain
   langchain-community
   chromadb
   pydantic
   python-multipart
   ```
3. Create a virtual environment, activate it, and install `requirements.txt`.

### Step 1.2: Local Models Prerequisites
1. Ensure Ollama is installed locally.
2. Run `ollama pull llama3` to get the generative model.
3. Run `ollama pull nomic-embed-text` to get the embedding model.

### Step 1.3: Backend Core & Storage (main.py)
1. Create `/backend/main.py`.
2. Initialize FastAPI app with CORS middleware to allow the frontend (e.g., `http://localhost:3000`) to communicate with the backend.
3. Configure ChromaDB client pointing to `../vault/.chroma` or an embedded local path to persist vector data.
4. Configure LangChain's `OllamaEmbeddings` using the `nomic-embed-text` model.
5. Provide a helper utility to ensure the `/vault` directory exists.

### Step 1.4: Endpoint - POST /api/notes/save
1. Define a Pydantic model for the request payload: `title: str`, `content: str`.
2. **File Storage**: Write the `content` to a local file in `../vault/{title}.md`.
3. **Vector Database**: 
   - Chunk the Markdown content using a text splitter (e.g., `RecursiveCharacterTextSplitter`).
   - Embed the chunks using the local Ollama embeddings (`nomic-embed-text`).
   - Store the vectors and metadata (source file name, timestamps) into the ChromaDB collection.
4. Return a success response `{"status": "success", "file": "{title}.md"}`.

### Step 1.5: Endpoint - POST /api/chat
1. Define a Pydantic model for request: `query: str`, `history: list` (optional).
2. **Retrieval**: 
   - Embed the `query` using `nomic-embed-text`.
   - Perform a similarity search in ChromaDB.
   - Format the retrieved Markdown chunks into a context string.
3. **Generation**:
   - Construct a prompt: "You are a local AI assistant. Use the following context from the user's personal vault to answer the question. Context: {context}. Question: {query}".
   - Use LangChain's `Ollama` LLM wrapper configured with the `llama3` model.
   - Set the response to stream.
4. Return a `StreamingResponse` from FastAPI that yields server-sent events (SSE) back to the client.

## Phase 2: Frontend Setup (FrontendCraftsman)

### Step 2.1: Initialize Next.js Application
1. In the root, run: `npx create-next-app@latest frontend --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"`
2. Navigate to `/frontend` and initialize `shadcn/ui`: `npx -y shadcn@latest init` (use defaults: neutral, global CSS variables).
3. Install necessary shadcn components: `npx -y shadcn@latest add button textarea scroll-area card input`.
4. Install markdown rendering libraries (e.g., `react-markdown`, `remark-gfm`).

### Step 2.2: LifeOS Layout & Core UI Components
1. Replace `app/page.tsx` with a dual-pane layout:
   - **Left Pane (Capture Zone)**: 50% width.
   - **Right Pane (Chat Interface)**: 50% width.
   - Use Tailwind's grid or flexbox for a dynamic, responsive split screen.
2. Implement a unified dark mode / modern aesthetic (black/gray backgrounds, glowing accents or minimalist borders to signify a premium tool).

### Step 2.3: Markdown Capture Zone (Left Pane)
1. Build a `NoteEditor` component.
2. Form fields:
   - Title input (single line text).
   - Content input (large textarea for raw Markdown).
3. "Save to Vault" Button.
4. **Action**: On submit, send a POST request to `http://localhost:8000/api/notes/save` with `{title, content}`. Handle loading states and show a quick success toast.

### Step 2.4: Localized AI Chat Interface (Right Pane)
1. Build a `ChatInterface` component.
2. **Message List**: A scrollable area displaying `user` and `assistant` messages. Render assistant messages using `react-markdown` to properly format retrieved code snippets.
3. **Input Box**: A sticky input field at the bottom with a submit button.
4. **Action**: 
   - On submit, append user query to local state.
   - Send POST request to `http://localhost:8000/api/chat`.
   - Parse the streaming SSE response and gradually append the text to the last assistant message in the state.

## Phase 3: Monorepo Orchestration (LeadArchitect)

### Step 3.1: Start Scripts
1. Provide a root-level script or README instructions to run both servers concurrently.
   - Terminal 1: `cd backend && source venv/bin/activate && uvicorn main:app --reload`
   - Terminal 2: `cd frontend && npm run dev`
2. Audit all code generated.
3. Verify **ZERO CLOUD API** rule: Ensure `openai`, `anthropic`, or other cloud SDKs are nowhere in `package.json` or `requirements.txt`.
