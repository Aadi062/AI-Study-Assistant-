# AI-Study-Assistant-

A premium, high-fidelity full-stack React dashboard and Node.js Express server for testing, visualizing, and persisting the **AI Study Assistant** n8n playbook workflows.

## n8n Workflow Profiles
The dashboard visualizes and interfaces with three active n8n playbooks:
1.  **AI Study Assistant Chat Flow**: Webhook trigger -> LangChain Tools Agent (retrieving syllabus context from Qdrant, referencing Window Buffer Memory, generating answers via Groq Chat Model, and generating practice tests via the student quiz tool) -> Respond to Webhook.
2.  **Drive Syllabus Indexer**: Webhook trigger -> Search Curriculum Files (GDrive) -> Keep Only Docs (Filter) -> Loop Over Files -> Download File -> Qdrant Vector Store (ingesting via Google Gemini Embeddings and Text Splitter).
3.  **Manual Document Ingest**: Pastes curriculum files directly -> splits text -> retrieves Gemini Embeddings -> indexes text chunks into local Qdrant-like vector database.

## Full-Stack Architecture
*   **Frontend**: React client running on Vite (port `5173`). Renders the interactive Study console, live n8n flowchart nodes, execution latencies dashboard, and a RAG document ingest portal.
*   **Backend**: Node.js Express API server (port `5000`). Handles message classifications, routes, direct Gemini generative calls, and embedding retrievals.
*   **Database (Persisted File DB)**: Managed under `./database_workspace/`:
    *   `sessions.json`: Stores full conversation chat records.
    *   `curriculum.json`: Stores curriculum text chunks and 768-dimension vectors.
    *   `logs.json`: Persists execution latencies, status codes, and route logs.

---

## Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Full-Stack Server (Client + Backend Database)
Run the following single command to launch both the Vite client and the Express backend server concurrently:
```bash
npm start
```
*   **Study Console**: Open [http://localhost:5173/](http://localhost:5173/)
*   **Backend API**: Running on [http://localhost:5000/](http://localhost:5000/)

### 3. Git Integration
To link this project to your GitHub repository, run:
```bash
git init
git add .
git commit -m "Initialize AI Study Assistant full-stack RAG dashboard"
git branch -M main
git remote add origin https://github.com/Aadi062/AI-Study-Assistant-.git
git push -u origin main
```
