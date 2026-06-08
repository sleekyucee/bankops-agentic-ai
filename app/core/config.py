import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    APP_NAME = os.getenv("APP_NAME", "BankOps Agentic AI")
    DATABASE_TYPE = os.getenv("DATABASE_TYPE", "sqlite")
    DATABASE_PATH = os.getenv("DATABASE_PATH", "bankops.db")
    KNOWLEDGE_BASE_PATH = os.getenv("KNOWLEDGE_BASE_PATH", "knowledge_base")
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

    GOOGLE_GENAI_USE_VERTEXAI = os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "false").lower() == "true"
    GOOGLE_CLOUD_PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT", "")
    GOOGLE_CLOUD_LOCATION = os.getenv("GOOGLE_CLOUD_LOCATION", "global")
    VERTEX_MODEL = os.getenv("VERTEX_MODEL", "gemini-2.5-flash")


settings = Settings()
