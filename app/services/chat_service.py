from app.models.chat import ChatRequest, ChatResponse

def generate_chat_response(request: ChatRequest) -> ChatResponse:
    return ChatResponse(
        reply=f"Mock response: received your message '{request.message}'",
        status="success"
    )