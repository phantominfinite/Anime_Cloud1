from __future__ import annotations

import asyncio
import contextlib
from dataclasses import dataclass, field
from time import time
from typing import Any

from fastapi import WebSocket

from app.services.redis_cache import redis_service


@dataclass
class PartyState:
    host_id: str
    position_s: float = 0.0
    is_playing: bool = False
    updated_at: float = field(default_factory=time)


class WatchPartyService:
    def __init__(self) -> None:
        self._rooms: dict[str, set[WebSocket]] = {}
        self._room_tasks: dict[str, asyncio.Task[None]] = {}

    def _room_state_key(self, room_id: str) -> str:
        return f"watch_party:state:{room_id}"

    def _room_channel(self, room_id: str) -> str:
        return f"watch_party:events:{room_id}"

    async def join(self, room_id: str, websocket: WebSocket, user_id: str) -> PartyState:
        await websocket.accept()
        members = self._rooms.setdefault(room_id, set())
        members.add(websocket)

        state = await redis_service.get(self._room_state_key(room_id))
        if state is None:
            new_state = PartyState(host_id=user_id)
            await redis_service.set(self._room_state_key(room_id), new_state.__dict__, expire=24 * 3600)
            state = new_state.__dict__

        if room_id not in self._room_tasks:
            self._room_tasks[room_id] = asyncio.create_task(self._fanout_room(room_id))

        return PartyState(**state)

    async def leave(self, room_id: str, websocket: WebSocket) -> None:
        if room_id not in self._rooms:
            return
        self._rooms[room_id].discard(websocket)
        if not self._rooms[room_id]:
            self._rooms.pop(room_id, None)
            task = self._room_tasks.pop(room_id, None)
            if task:
                task.cancel()
                with contextlib.suppress(asyncio.CancelledError):
                    await task

    async def apply_event(self, room_id: str, event: dict[str, Any]) -> PartyState:
        payload = await redis_service.get(self._room_state_key(room_id))
        if payload is None:
            raise RuntimeError(f"Missing room state for room {room_id}")

        state = PartyState(**payload)
        state.position_s = float(event.get("position_s", state.position_s))
        state.is_playing = bool(event.get("is_playing", state.is_playing))
        state.updated_at = time()
        await redis_service.set(self._room_state_key(room_id), state.__dict__, expire=24 * 3600)
        return state

    async def publish(self, room_id: str, payload: dict[str, Any]) -> None:
        import json
        client = await redis_service._get_client()
        await client.publish(self._room_channel(room_id), json.dumps(payload))

    async def _fanout_room(self, room_id: str) -> None:
        client = await redis_service._get_client()
        pubsub = client.pubsub()
        await pubsub.subscribe(self._room_channel(room_id))
        try:
            while True:
                msg = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if not msg or "data" not in msg:
                    await asyncio.sleep(0.05)
                    continue
                data = msg["data"]
                if isinstance(data, str):
                    import json
                    payload = json.loads(data)
                else:
                    continue

                stale: list[WebSocket] = []
                for ws in self._rooms.get(room_id, set()):
                    try:
                        await ws.send_json(payload)
                    except Exception:
                        stale.append(ws)
                for ws in stale:
                    self._rooms.get(room_id, set()).discard(ws)
        finally:
            await pubsub.unsubscribe(self._room_channel(room_id))
            await pubsub.close()


watch_party_service = WatchPartyService()
