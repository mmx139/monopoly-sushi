"""
WebSocket handling for real-time game communication
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # room_id -> list of websocket connections
        self.rooms: Dict[str, Set[WebSocket]] = {}
        # websocket -> player_id
        self.players: Dict[WebSocket, str] = {}

    async def connect(self, websocket: WebSocket, room_id: str, player_id: str):
        await websocket.accept()
        if room_id not in self.rooms:
            self.rooms[room_id] = set()
        self.rooms[room_id].add(websocket)
        self.players[websocket] = player_id

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.rooms:
            self.rooms[room_id].discard(websocket)
        if websocket in self.players:
            del self.players[websocket]

    async def broadcast(self, room_id: str, message: dict):
        if room_id in self.rooms:
            for connection in self.rooms[room_id]:
                await connection.send_json(message)

manager = ConnectionManager()

@router.websocket("/{room_id}/{player_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, player_id: str):
    await manager.connect(websocket, room_id, player_id)
    try:
        await manager.broadcast(room_id, {
            "type": "player_joined",
            "player_id": player_id
        })

        while True:
            data = await websocket.receive_json()
            # Handle game messages
            await manager.broadcast(room_id, data)

    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
        await manager.broadcast(room_id, {
            "type": "player_left",
            "player_id": player_id
        })
