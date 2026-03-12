from fastapi import APIRouter
from app.models.chat import ChatRequest, ChatResponse
from app.services.chat_service import generate_chat_response

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    return generate_chat_response(request)
        