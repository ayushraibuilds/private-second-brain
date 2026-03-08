# Private Second Brain (Life OS) 🧠

**Your 100% local AI Second Brain that actually remembers everything.**
Draft notes in markdown → save to your private vault → chat with an AI that pulls perfect context from *your own thoughts*. Zero cloud. Zero subscriptions. Zero data leaks.

![Demo GIF placeholder](https://github.com/user-attachments/assets/private-second-brain-demo-placeholder)

## 🌟 Features

- **100% Local & Private** — Everything runs on your machine with Ollama
- **Capture Zone** — Dual-pane markdown editor with instant save
- **Smart RAG Chat** — ChromaDB finds relevant notes automatically
- **Real-time Streaming** — Beautiful SSE streaming responses
- **Persistent Everything** — Notes + chat history survive reloads
- **Auto-Healing Vectors** — Edit a note → old embeddings are intelligently replaced
- **Life OS Ready** — Built for daily thinking, not just note-taking

## 🏗️ Architecture

- **Frontend**: Next.js 14 (App Router) + Tailwind + shadcn/ui
- **Backend**: FastAPI + LangChain + ChromaDB
- **AI Engine**: Ollama (`llama3.2` + `nomic-embed-text`)

## 🚀 Getting Started (2 minutes)

### Prerequisites
- Node.js (v18+)
- Python 3.9+
- Ollama (running)

### 1. Pull Models
```bash
ollama pull llama3.2
ollama pull nomic-embed-text
```

### 2. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate    # Windows: venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001 --host 127.0.0.1
```

### 3. Frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` → start building your Life OS!

## 📂 Folder Structure
- `/vault`          ← Your actual .md files + hidden .chroma DB (auto-created)
- `/backend`        ← FastAPI + RAG logic
- `/frontend`       ← Next.js UI

---

*Built with privacy and local-compute in mind.*
**Star ⭐ if this helps you think better.**

## Roadmap (Next 2 Weeks)

- [ ] Voice note capture (Whisper)
- [ ] Multi-agent memory (via agent.yaml)
- [ ] Docker + one-click install
- [ ] Web search tool (optional, local-first)
- [ ] Mobile PWA support

---
Made with ❤️ by Ayush
