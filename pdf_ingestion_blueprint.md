# PDF Ingestion Pipeline: Architectural Blueprint

**Role:** System Architect & Product Manager
**Project:** Private Second Brain (Life OS)
**Phase:** 5 (Multimodal Document Parsing)

---

## 1. Current State Context
The Private Second Brain is currently fully operational for pure text (Markdown) workflows. 
*   **Backend:** FastAPI handles CRUD operations, LangChain chunks and embeds text, and ChromaDB stores vectors with a robust deduplication strategy (`where={"source": filename}`). It streams responses via SSE.
*   **Frontend:** A highly polished Next.js 14 UI featuring dual panes (Capture & Chat), localStorage state resilience, real-time health polling, and dynamic source citation rendering.

## 2. Proposed Architecture

### 2.1 Backend File Handling
*   **Storage Location:** We will introduce a new directory: `/vault/documents`. This keeps raw PDFs logically separated from the user's personal Markdown journal entries in `/vault`, preventing folder clutter while still keeping all data inside the local boundary.
*   **Endpoints:** 
    *   `POST /api/documents/upload`: Uses FastAPI's `UploadFile` to stream the PDF securely to disk.
    *   *Update existing* `GET /api/notes`: Will be modified to scan *both* `/vault` (for `.md`) and `/vault/documents` (for `.pdf`) so the future Sidebar UI shows a unified view of all knowledge.

### 2.2 Text Extraction & Chunking Strategy
*   **Library Recommendation:** We will use **`pypdf`** integrated directly via LangChain's **`PyPDFLoader`**. 
    *   *Why?* It is lightweight, entirely local, requires no external binaries (unlike `pdfplumber` which can be heavy, or `tesseract` which requires OS-level OCR installs), and plugs perfectly into our existing LangChain document ecosystem.
*   **Chunking Logic:** Dense PDF text is notoriously difficult to retrieve if chunked poorly due to page numbers, headers, and column breaks.
    *   We will use the `RecursiveCharacterTextSplitter`.
    *   **Tuning:** `chunk_size=1200`, `chunk_overlap=300`. PDFs often contain longer conceptual paragraphs. We need a slightly larger chunk size than Markdown to capture full sentences, with a higher overlap to prevent cutting off critical context midway through a sentence block.

### 2.3 Vector Metadata Integrity (Zero Ghost Vectors)
*   **The Golden Rule:** The metadata `source` key must perfectly match the physical filename.
*   **Execution:** When a PDF named `financial_report.pdf` is uploaded, every LangChain `Document` chunk will be forcibly tagged with `metadata={"source": "financial_report.pdf"}`.
*   **Deduplication:** The exact same core logic used in Markdown saves will be applied:
    ```python
    existing_docs = vector_store.get(where={"source": filename})
    if existing_docs and existing_docs["ids"]:
        vector_store.delete(ids=existing_docs["ids"])
    ```
*   Because our existing `DELETE /api/notes/{filename}` endpoint simply looks for a file string and deletes the matching metadata, it will instantly support deleting `.pdf` files without any backend code changes as long as the route handles the `/documents` folder path.

### 2.4 Frontend UX & Design
*   **The "Invisible" UX (Drag & Drop):** The cleanest UX for a Life OS is frictionless. We will wrap the entire `NoteEditor` Card in a React Drag-and-Drop overlay. When a user drags a file over the Capture pane, the border pulses emerald, indicating it's ready to ingest.
*   **Explicit UX (Action Button):** In the bottom toolbar of the `NoteEditor` (next to "Stored in local vault..."), we will add a small, elegant paperclip/upload icon button (`<Button variant="ghost">`) that triggers a hidden `<input type="file" accept=".pdf" />`.
*   **Feedback:** The `ToastStack` will be utilized to show an "Ingesting Document..." loading state, followed by a success message displaying how many vector chunks were created.

---

## 3. Library Dependencies to Add
**Backend (`requirements.txt`)**
*   `pypdf` (Fast, pure Python PDF parsing)
*   `python-multipart` (Required by FastAPI to accept `multipart/form-data` file uploads)

---

## 4. Step-by-Step Execution Plan

This is the exact sequence of instructions to feed the implementation agent.

### Phase 1: Backend Infrastructure (FastAPI)
1. Add `pypdf` and `python-multipart` to `requirements.txt` and install them.
2. In `main.py`, define `DOCS_DIR = os.path.join(VAULT_DIR, "documents")` and ensure the directory is created on startup.
3. Import `UploadFile` and `File` from `fastapi`. Import `PyPDFLoader` from `langchain_community.document_loaders`.
4. Create the `POST /api/documents/upload` endpoint:
    *   Validate the file is a PDF.
    *   Save the physical file to `DOCS_DIR`.
    *   Initialize `PyPDFLoader` on the saved file.
    *   Execute deduplication: Query ChromaDB for `source == filename.pdf` and delete existing IDs.
    *   Load and split the document using `RecursiveCharacterTextSplitter(chunk_size=1200, chunk_overlap=300)`.
    *   Iterate over chunks to enforce `metadata={"source": filename}`.
    *   Add documents to `vector_store` and return a success JSON containing chunk counts.

### Phase 2: Frontend UX (Next.js)
1. In `note-editor.tsx`, import `Paperclip` from `lucide-react`.
2. Create a hidden `<input type="file" accept="application/pdf" />` referenced via a `useRef`.
3. Add a ghost button next to the "Save to Vault" button that triggers the hidden input's click event.
4. Implement a `handleFileUpload` async function that packages the selected file into `FormData()`.
5. Send a `POST` request to `/api/documents/upload`.
6. Hook into the `isSaving` state to disable inputs during upload, and use the `onSave` (or a new `onToast`) prop to trigger a success/error toast when the API responds.
7. *(Optional Polish)*: Add drag-and-drop event listeners (`onDragOver`, `onDrop`) to the main `Card` container to accept dropped PDFs directly.
