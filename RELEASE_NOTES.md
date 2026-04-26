# Release Notes

## v1.0.0 — 2026-04-25

### Initial Production Release

**Author:** Aryan Rajendra Suthar  
**Copyright:** © 2026 Aryan Rajendra Suthar. All Rights Reserved.

---

### Features

**Backend**
- FastAPI async REST API with lifespan startup
- Document ingestion: PDF (PyMuPDF), DOCX (python-docx), plain text
- Chunked text splitting (500 chars / 50 overlap)
- Local embeddings via FastEmbed (`BAAI/bge-small-en-v1.5`, 384 dims)
- Qdrant vector store with cosine similarity search
- RAG query pipeline with top-k retrieval and context assembly
- LLM streaming via Groq (`llama-3.3-70b-versatile`)
- Redis caching with SHA-256 query hash keys (TTL: 3600s)
- SSE (Server-Sent Events) streaming responses
- Document registry via Redis hash (`docs:registry`)
- Document deletion from both Redis metadata and Qdrant vector store

**Frontend**
- Next.js 16 App Router with `(app)` route group
- Real-time token streaming via SSE
- TanStack Query v5 for data fetching and mutations
- Document upload and management UI
- shadcn/ui component library
- Always-dark oklch violet theme (no light mode)
- Responsive sidebar layout

**Infrastructure**
- Docker Compose: backend, Redis, Qdrant
- GitHub Actions CI: lint → type-check → tests → build
- Production targets: Railway (backend), Vercel (frontend), Qdrant Cloud, Upstash Redis

---

## v0.1.0 — 2026-03-23

### Project Inception

- Repository initialized
- Initial project concept and architecture defined by Aryan Rajendra Suthar
