# AI Knowledge Assistant

Production-grade RAG system — upload documents, ask questions, get AI-generated answers with source citations.

## Tech Stack

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion, TanStack Query v5
- **Backend**: FastAPI (Python 3.12), LangChain, Pydantic v2, uvicorn
- **Vector DB**: Qdrant
- **Cache**: Redis
- **LLM**: Groq (llama-3.3-70b-versatile) for dev → OpenAI (gpt-4o-mini) for prod
- **Infra**: Docker, GitHub Actions CI/CD, Vercel (frontend), Railway (backend)

## Project Structure

```
├── backend/          # FastAPI app
├── frontend/         # Next.js app
├── docker-compose.yml
└── .env.example
```

## Local Setup

**1. Clone and configure:**
```bash
git clone https://github.com/aryanrajendrasuthar/AI-Knowledge-Assistant.git
cd AI-Knowledge-Assistant
cp .env.example .env          # add your GROQ_API_KEY
cp frontend/.env.local.example frontend/.env.local
```

**2. Start backend services (backend + Redis + Qdrant):**
```bash
docker compose up --build
```

**3. Start frontend (separate terminal):**
```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:3000  
Backend API: http://localhost:8000  
API Docs: http://localhost:8000/docs

## Environment Variables

| Variable | Where to get it |
|----------|----------------|
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) → API Keys |
| `QDRANT_URL` | Auto-set by docker-compose (`http://qdrant:6333`) |
| `REDIS_URL` | Auto-set by docker-compose (`redis://redis:6379`) |

For production deployment, see [Deployment](#deployment).

## Running Tests

```bash
# Backend
cd backend && pip install -r requirements-dev.txt && pytest

# Frontend
cd frontend && npm run type-check && npm run lint
```

## Deployment

**Frontend → Vercel**
- Connect GitHub repo in Vercel dashboard
- Set env var: `NEXT_PUBLIC_API_URL=<railway-backend-url>`
- Auto-deploys on push to `main`

**Backend → Railway**
- Connect GitHub repo in Railway dashboard
- Add all env vars from `.env.example`
- Auto-deploys on push to `main`

---

## Ownership

© 2026 Aryan Rajendra Suthar. All Rights Reserved.

This project is proprietary. Unauthorized copying, distribution, or use is prohibited.
See [LICENSE](LICENSE) · [CONFIDENTIALITY.md](CONFIDENTIALITY.md) · [AUTHORS.md](AUTHORS.md)
