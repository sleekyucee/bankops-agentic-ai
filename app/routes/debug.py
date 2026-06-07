from fastapi import APIRouter

from app.db.database import get_recent_conversations, get_support_tickets
from app.rag.retriever import retrieve_relevant_chunks
from app.tools.customer_context import get_customer_context


router = APIRouter(prefix="/debug", tags=["debug"])


@router.get("/conversations/{user_id}")
def debug_conversations(user_id: str):
    return {
        "user_id": user_id,
        "conversations": get_recent_conversations(user_id),
    }


@router.get("/customer/{user_id}")
def debug_customer(user_id: str):
    return get_customer_context(user_id)


@router.get("/rag/search")
def debug_rag_search(q: str):
    return {
        "query": q,
        "results": retrieve_relevant_chunks(q, top_k=3),
    }


@router.get("/tickets")
def debug_tickets():
    return {
        "tickets": get_support_tickets(),
    }


@router.get("/tickets/{user_id}")
def debug_tickets_for_user(user_id: str):
    return {
        "tickets": get_support_tickets(user_id),
    }
