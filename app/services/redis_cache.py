import json
import logging
import time
from typing import Optional, Any, List

import redis.asyncio as redis

from app.core.config import settings

logger = logging.getLogger(__name__)


class RedisCacheService:
    def __init__(self):
        self.redis_url = getattr(settings, "REDIS_URL", "redis://localhost:6379/0")
        self.client: redis.Redis | None = None

    async def connect(self):
        if self.client:
            return

        client = redis.from_url(
            self.redis_url,
            encoding="utf-8",
            decode_responses=True,
            socket_connect_timeout=1,
        )
        await client.ping()
        self.client = client
        logger.info("Connected to Redis at %s", self.redis_url)

    async def close(self):
        if self.client:
            await self.client.close()
            self.client = None

    async def _get_client(self) -> redis.Redis:
        if not self.client:
            await self.connect()
        if not self.client:
            raise RuntimeError("Redis client not initialized")
        return self.client

    async def get(self, key: str) -> Optional[Any]:
        client = await self._get_client()
        val = await client.get(key)
        return json.loads(val) if val else None

    async def set(self, key: str, value: Any, expire: int = 300):
        client = await self._get_client()
        val_str = json.dumps(value)
        await client.set(key, val_str, ex=expire)

    async def delete(self, key: str):
        client = await self._get_client()
        await client.delete(key)

    async def update_access(self, file_path: str):
        client = await self._get_client()
        current_time = time.time()
        await client.zadd("cache_access_log", {file_path: current_time})

    async def get_coldest_files(self, count: int = 10) -> List[str]:
        client = await self._get_client()
        items = await client.zpopmin("cache_access_log", count)
        return [item[0] for item in items]


redis_service = RedisCacheService()
