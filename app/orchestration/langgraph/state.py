from typing import TypedDict

class ChatState(TypedDict):
    message: str
    intent: str
    reply: str