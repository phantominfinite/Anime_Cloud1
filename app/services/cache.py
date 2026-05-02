from __future__ import annotations

import asyncio
import hashlib
import logging
import os
import shutil

import aiofiles

from app.core.config import settings
from app.services.redis_cache import redis_service

logger = logging.getLogger(__name__)


class CacheService:
    def __init__(self):
        self.cache_dir = settings.CACHE_DIR
        os.makedirs(self.cache_dir, exist_ok=True)
        self._evict_lock = asyncio.Lock()
        self._size_key = "cache:size:bytes"

    def _get_chunk_path(self, file_id: str, chunk_index: int) -> str:
        safe_file_id = hashlib.md5(file_id.encode()).hexdigest()
        file_dir = os.path.join(self.cache_dir, safe_file_id)
        os.makedirs(file_dir, exist_ok=True)
        return os.path.join(file_dir, str(chunk_index))

    async def exists(self, file_id: str, chunk_index: int) -> bool:
        return os.path.exists(self._get_chunk_path(file_id, chunk_index))

    async def get_chunk(self, file_id: str, chunk_index: int) -> bytes | None:
        path = self._get_chunk_path(file_id, chunk_index)
        if not os.path.exists(path):
            return None
        asyncio.create_task(redis_service.update_access(path))
        async with aiofiles.open(path, mode="rb") as f:
            return await f.read()

    async def save_chunk(self, file_id: str, chunk_index: int, data: bytes):
        path = self._get_chunk_path(file_id, chunk_index)
        temp_path = f"{path}.tmp"
        previous_size = os.path.getsize(path) if os.path.exists(path) else 0

        async with aiofiles.open(temp_path, mode="wb") as f:
            await f.write(data)
        os.replace(temp_path, path)

        current_size = os.path.getsize(path)
        delta = current_size - previous_size
        if delta:
            client = await redis_service._get_client()
            await client.incrby(self._size_key, delta)

        asyncio.create_task(redis_service.update_access(path))
        asyncio.create_task(self._check_cache_size())

    async def _check_cache_size(self):
        if self._evict_lock.locked():
            return
        async with self._evict_lock:
            max_size = int(getattr(settings, "CACHE_MAX_BYTES", 2 * 1024 * 1024 * 1024))
            client = await redis_service._get_client()
            raw_size = await client.get(self._size_key)
            total_size = int(raw_size or 0)
            while total_size > max_size:
                eviction_candidates = await redis_service.get_coldest_files(count=50)
                if not eviction_candidates:
                    break
                for fp in eviction_candidates:
                    if not os.path.exists(fp):
                        continue
                    size = os.path.getsize(fp)
                    os.remove(fp)
                    await client.decrby(self._size_key, size)
                    total_size -= size
                    if total_size <= max_size:
                        break

    async def clear_cache(self):
        shutil.rmtree(self.cache_dir)
        os.makedirs(self.cache_dir, exist_ok=True)
        client = await redis_service._get_client()
        await client.set(self._size_key, 0)


cache_service = CacheService()
