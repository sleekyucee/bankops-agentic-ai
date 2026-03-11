from fastapi import FastAPI
from app.routes.health import router as health_router
from app.routes.chat import router as chat_router

app = FastAPI(
    title="BankOps Agentic Ai Platform",
    description="Agentic AI banking assistant backend",
    version="0.1.0"
)

@app.get("/")
def root():
    return {"message": "BankOps API is running"}

app.include_router(health_router)
app.include_router(chat_router)