"""
Room management API routes
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
import uuid

router = APIRouter()

class Player(BaseModel):
    id: str
    name: str
    character: str

class RoomCreate(BaseModel):
    name: str
    host_name: str

class Room(BaseModel):
    id: str
    name: str
    host_id: str
    players: List[Player] = []
    max_players: int = 4
    status: str = "waiting"  # waiting, playing, finished

# In-memory room storage (for MVP)
rooms_db: dict = {}

@router.post("/create")
async def create_room(room: RoomCreate):
    """Create a new game room"""
    room_id = str(uuid.uuid4())[:8]
    host_id = str(uuid.uuid4())[:8]

    new_room = Room(
        id=room_id,
        name=room.name,
        host_id=host_id,
        players=[Player(id=host_id, name=room.host_name, character="苏轼")]
    )
    rooms_db[room_id] = new_room
    return {"room_id": room_id, "player_id": host_id}

@router.get("/{room_id}")
async def get_room(room_id: str):
    """Get room info"""
    room = rooms_db.get(room_id)
    if not room:
        return {"error": "Room not found"}, 404
    return room

@router.post("/{room_id}/join")
async def join_room(room_id: str, player_name: str):
    """Join an existing room"""
    room = rooms_db.get(room_id)
    if not room:
        return {"error": "Room not found"}, 404
    if len(room.players) >= room.max_players:
        return {"error": "Room is full"}, 400
    if room.status != "waiting":
        return {"error": "Game already started"}, 400

    player_id = str(uuid.uuid4())[:8]
    room.players.append(Player(id=player_id, name=player_name, character="苏辙"))
    return {"player_id": player_id, "room": room}
