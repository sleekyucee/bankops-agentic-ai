from fastapi import APIRouter
from app.models.chat import ChatRequest, ChatResponse

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    return ChatResponse(
        reply=f"Mock response: received your message '{request.message}'",
        status="success"
    )