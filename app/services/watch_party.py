from __future__ import annotations

from dataclasses import dataclass, field
from time import time
from typing import Any

from fastapi import WebSocket


@dataclass
class PartyState:
    host_id: str
    position_s: float = 0.0
    is_playing: bool = False
    updated_at: float = field(default_factory=time)


class WatchPartyService:
    def __init__(self) -> None:
        self._rooms: dict[str, set[WebSocket]] = {}
        self._state: dict[str, PartyState] = {}

    async def join(self, room_id: str, websocket: WebSocket, user_id: str) -> PartyState:
        await websocket.accept()
        self._rooms.setdefault(room_id, set()).add(websocket)
        self._state.setdefault(room_id, PartyState(host_id=user_id))
        return self._state[room_id]

    async def leave(self, room_id: str, websocket: WebSocket) -> None:
        if room_id in self._rooms:
            self._rooms[room_id].discard(websocket)
            if not self._rooms[room_id]:
                self._rooms.pop(room_id, None)
                self._state.pop(room_id, None)

    async def apply_event(self, room_id: str, event: dict[str, Any]) -> PartyState:
        state = self._state[room_id]
        state.position_s = float(event.get("position_s", state.position_s))
        state.is_playing = bool(event.get("is_playing", state.is_playing))
        state.updated_at = time()
        return state

    async def broadcast(self, room_id: str, payload: dict[str, Any]) -> None:
        to_remove: list[WebSocket] = []
        for ws in self._rooms.get(room_id, set()):
            try:
                await ws.send_json(payload)
            except Exception:
                to_remove.append(ws)
        for ws in to_remove:
            self._rooms[room_id].discard(ws)


watch_party_service = WatchPartyService()
