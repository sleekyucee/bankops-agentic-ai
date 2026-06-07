# BankOps Agentic AI Backend

## Overview

BankOps is an MVP backend for banking operations support built with FastAPI and LangGraph. It handles customer support requests through intent-based orchestration for fraud checks, spending analysis, escalation workflows, customer memory, and knowledge retrieval.

The project combines deterministic banking support logic with SQLite persistence and a local RAG pipeline. Knowledge-base questions can be retrieved through keyword matching or local semantic search using Sentence Transformers and FAISS.

## Core Features

- FastAPI API layer
- LangGraph workflow orchestration
- Rule-based intent routing
- User-aware fraud and spending tools
- SQLite-backed customer memory
- Persistent conversation history
- Escalation ticket creation and retrieval
- Lightweight Markdown RAG knowledge base
- Local semantic vector search with Sentence Transformers and FAISS
- Developer debug endpoints
- Decision trace metadata for workflow visibility

## Architecture

```text
Client
  |
  v
FastAPI routes
  |
  v
Chat service
  |
  v
LangGraph orchestration
  |
  +--> Intent detection
  |
  +--> Greeting / Fraud / Spending / Escalation / General nodes
          |
          +--> Banking tools
          +--> SQLite customer data, conversations, and tickets
          +--> Keyword or FAISS knowledge retrieval
  |
  v
Structured API response with decision trace
```

In short:

```text
Client -> FastAPI -> LangGraph -> nodes/tools -> SQLite/RAG -> response
```

## Tech Stack

- Python
- FastAPI
- LangGraph
- LangChain
- Sentence Transformers
- FAISS
- SQLite
- Uvicorn

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` | API status message |
| `GET` | `/health` | Health check |
| `POST` | `/chat` | Process a banking support message |
| `GET` | `/debug/customer/{user_id}` | Inspect a customer profile |
| `GET` | `/debug/conversations/{user_id}` | Inspect recent conversation history |
| `GET` | `/debug/tickets` | List all support tickets |
| `GET` | `/debug/tickets/{user_id}` | List support tickets for a user |
| `GET` | `/debug/rag/search?q=` | Inspect keyword RAG retrieval |
| `GET` | `/debug/rag/vector-search?q=` | Inspect local FAISS vector retrieval |

The debug endpoints are intentionally unauthenticated for local development and demonstration only.

## Example `/chat` Request

```json
{
  "user_id": "user_001",
  "message": "What happens when my card is frozen?"
}
```

## Example `/chat` Response

```json
{
  "reply": "A card freeze may be used when a customer reports suspicious card activity, loss of card control, or an urgent account access concern involving card payments. New card purchases, online card payments, and cash withdrawals are blocked, but pending transactions may still complete. Source: card_freeze_policy.md",
  "status": "success",
  "escalation_required": false,
  "escalation_priority": null,
  "assigned_team": null,
  "intent": "general",
  "decision_trace": [
    "intent_detected: general",
    "handler: general_node",
    "rag_retriever: vector",
    "rag_chunks_found: 3"
  ],
  "ticket_id": null,
  "case_summary": null,
  "created_at": null,
  "human_review_required": false,
  "approval_status": null,
  "review_queue": null
}
```

The exact retrieved text and source list may vary as the knowledge base changes.

## Local Setup

Create a virtual environment:

```powershell
python -m venv venv
```

Activate it on Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

On macOS or Linux:

```bash
source venv/bin/activate
```

Install dependencies:

```bash
python -m pip install -r requirements.txt
```

Initialize the SQLite database and seed data:

```bash
python -m app.db.database
```

Run the API without reload:

```bash
uvicorn app.main:app
```

The API is then available at `http://localhost:8000`. Interactive API documentation is available at `http://localhost:8000/docs`.

The first semantic search may download the local `sentence-transformers/all-MiniLM-L6-v2` model. Later searches reuse the in-process FAISS vector store.

## Project Status

This is an MVP backend portfolio project. It demonstrates agent-style workflow orchestration, local persistence, support ticket handling, customer context, and local semantic RAG.

It is not production-ready. Areas such as authentication, authorization, migrations, structured observability, deployment configuration, security hardening, and broader automated testing still need to be addressed.

## Future Improvements

- AWS deployment
- PostgreSQL or Amazon RDS persistence
- Amazon S3 knowledge-base storage
- Amazon Bedrock LLM integration
- CrewAI specialist agents
- Authentication and authorization
- Frontend operations dashboard
