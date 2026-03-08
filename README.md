# Private Second Brain (Life OS) 🧠

A 100% local, zero-cloud personal knowledge management system and AI assistant. Draft notes in markdown, save them to your local vault, and chat with an AI that retrieves context directly from your own thoughts.

![CleanShot 2026-03-08 at 16 41 24](https://github.com/user-attachments/assets/private-second-brain-placeholder)

## 🌟 Features

*   **100% Local Privacy**: Your data never leaves your machine. Powered entirely by local LLMs via Ollama.
*   **Capture Zone**: A dual-pane interface allows you to draft markdown notes and immediately save them to your local vault.
*   **Context-Aware RAG**: Uses ChromaDB to embed your notes. The chat interface performs similarity searches to pull relevant context into your conversations.
*   **Real-time Streaming**: Chat responses stream directly to the UI using Server-Sent Events (SSE).
*   **Persistent State**: Chat history and note drafts survive page reloads via local storage.
*   **Auto-Healing Vectors**: Editing and re-saving a note intelligently replaces old embeddings in ChromaDB to prevent duplicate context buildup.

## 🏗️ Architecture

*   **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui
*   **Backend**: Python, FastAPI, LangChain, ChromaDB
*   **AI Engine**: [Ollama](https://ollama.com/) 
    *   Generation Model: `llama3.2`
    *   Embedding Model: `nomic-embed-text`

## 🚀 Getting Started

### Prerequisites
1.  **Node.js** (v18+)
2.  **Python** (3.9+)
3.  **Ollama**: Install from [ollama.com](https://ollama.com/)

### 1. Download Local AI Models
Open a terminal, ensure Ollama is running (`ollama serve`), and pull the required models:
```bash
ollama pull llama3.2
ollama pull nomic-embed-text
```

### 2. Backend Setup
The backend runs on FastAPI and port `8001`.
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001 --host 127.0.0.1
```

### 3. Frontend Setup
The frontend runs on Next.js and port `3000`. Open a **new** terminal window:
```bash
cd frontend
npm install
npm run dev
```

### 4. Access the App
Navigate to `http://localhost:3000` in your browser to begin building your vault!

## 📂 Folder Structure
*   `/backend`: Python API, RAG search logic, and vector database management.
*   `/frontend`: Next.js web application and UI components.
*   `/vault`: Your raw `.md` files and the hidden `.chroma` vector database (auto-generated when you save your first note). 

---

*Built with privacy and local-compute in mind.*
