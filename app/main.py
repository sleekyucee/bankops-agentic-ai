from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.health import router as health_router
from app.routes.chat import router as chat_router
from app.routes.debug import router as debug_router

app = FastAPI(
    title="BankOps Agentic Ai Platform",
    description="Agentic AI banking assistant backend",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "BankOps API is running"}

app.include_router(health_router)
app.include_router(chat_router)
app.include_router(debug_router)
