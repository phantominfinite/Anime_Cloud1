from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class EmbeddingProvider(Protocol):
    async def embed(self, text_input: str) -> list[float]: ...


@dataclass
class VectorSearchResult:
    mal_id: str
    title: str
    score: float


class PgVectorSearchService:
    def __init__(self, embedding_provider: EmbeddingProvider) -> None:
        self.embedding_provider = embedding_provider

    async def semantic_search(self, db: AsyncSession, query: str, limit: int = 20) -> list[VectorSearchResult]:
        embedding = await self.embedding_provider.embed(query)
        sql = text(
            """
            SELECT mal_id, title, 1 - (embedding <=> CAST(:embedding AS vector)) AS score
            FROM anime_embeddings
            ORDER BY embedding <=> CAST(:embedding AS vector)
            LIMIT :limit
            """
        )
        rows = (await db.execute(sql, {"embedding": embedding, "limit": limit})).all()
        return [VectorSearchResult(mal_id=r[0], title=r[1], score=float(r[2])) for r in rows]
