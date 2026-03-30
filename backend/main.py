"""
Monopoly-Sushi Backend - FastAPI Server
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import rooms, websocket

app = FastAPI(title="Monopoly-Sushi API", version="0.1.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(rooms.router, prefix="/api/rooms", tags=["rooms"])
app.include_router(websocket.router, prefix="/ws", tags=["websocket"])


@app.get("/")
async def root():
    return {"message": "Monopoly-Sushi API", "version": "0.1.0"}


@app.get("/api/health")
async def health():
    return {"status": "ok"}
