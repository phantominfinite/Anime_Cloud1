from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from typing import List, Dict, Any
from app.db.models import Anime

class SearchService:
    async def search_anime(self, db: AsyncSession, query: str, limit: int = 50) -> List[Dict[str, Any]]:
        results = []

        if query.isdigit():
            id_stmt = select(Anime).filter(Anime.mal_id == query)
            anime = (await db.execute(id_stmt)).scalars().first()
            if anime:
                results.append(anime)

        # PostgreSQL full text search with fallback
        try:
            fts_stmt = (
                select(Anime)
                .filter(text("to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')) @@ plainto_tsquery('english', :q)"))
                .params(q=query)
                .limit(limit)
            )
            rows = (await db.execute(fts_stmt)).scalars().all()
        except Exception:
            rows = (await db.execute(select(Anime).filter(Anime.title.ilike(f"%{query}%")).limit(limit))).scalars().all()

        for row in rows:
            if row not in results:
                results.append(row)

        return [{"mal_id": a.mal_id, "title": a.title, "image_url": a.image_url, "score": a.score, "type": a.type, "year": a.year} for a in results]

search_service = SearchService()
