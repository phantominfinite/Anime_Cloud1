from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, func
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

        # Advanced PostgreSQL full text search using search_vector
        try:
            # We use websearch_to_tsquery for more natural search syntax (e.g. "cowboy bebop -movie")
            # And ts_rank_cd for better relevance ranking
            fts_stmt = (
                select(Anime)
                .filter(text("search_vector @@ websearch_to_tsquery('english', :q)"))
                .order_by(text("ts_rank_cd(search_vector, websearch_to_tsquery('english', :q)) DESC"))
                .params(q=query)
                .limit(limit)
            )
            rows = (await db.execute(fts_stmt)).scalars().all()
        except Exception:
            # Fallback to ilike if FTS fails or column not populated
            rows = (await db.execute(select(Anime).filter(Anime.title.ilike(f"%{query}%")).limit(limit))).scalars().all()

        for row in rows:
            if row not in results:
                results.append(row)

        return [
            {
                "mal_id": a.mal_id,
                "title": a.title,
                "image_url": a.image_url,
                "score": a.score,
                "type": a.type,
                "year": a.year,
                "description": a.description[:200] + "..." if a.description and len(a.description) > 200 else a.description
            } for a in results
        ]

search_service = SearchService()
