from google import genai
from google.genai import types

from app.core.config import settings

system_instruction = (
        "You are a professional banking support assistant for a demo banking application. "
        "Provide short, clear, practical answers to general banking support questions. "
        "Do not claim to access accounts, reset passwords directly, or perform actions. "
        "Do not ask for unnecessary follow-up details. "
        "If a user asks about something like resetting a password, explain the usual steps clearly."
    )

def vertex_ai_ready() -> bool:
    return(
        settings.GOOGLE_GENAI_USE_VERTEXAI
        and bool(settings.GOOGLE_CLOUD_PROJECT)
        and bool(settings.GOOGLE_CLOUD_LOCATION)
        and bool(settings.VERTEX_MODEL)
    )

def get_vertex_client():
    if not vertex_ai_ready():
        return None
    
    return genai.Client(
        vertexai = True,
        project=settings.GOOGLE_CLOUD_PROJECT,
        location=settings.GOOGLE_CLOUD_LOCATION
    )

def fallback_general_support(message: str) -> str:
    return (
        f"I can help with general banking support. You asked: '{message}'. "
        f"For this prototype, I can currently assist with spending insights, suspicious charge reviews, "
        f"and general account support questions."
    )

def generate_general_support(message: str) -> str:
    client = get_vertex_client()

    if client is None:
        return fallback_general_support(message)

    try:
        response = client.models.generate_content(
            model=settings.VERTEX_MODEL,
            contents=(
                f"Customer question: {message}\n\n"
                "Respond with a concise general banking support answer."
            ),
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.2,
                max_output_tokens=250,
            ),
        )

        if response.text:
            return response.text.strip()

        return fallback_general_support(message)

    except Exception as e:
        print("Gemini error:", repr(e))
        return fallback_general_support(message)