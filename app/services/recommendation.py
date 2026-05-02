from __future__ import annotations

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Anime, UserAnime


class RecommendationService:
    async def recommend_for_user(self, db: AsyncSession, user_id: int, limit: int = 12) -> list[dict]:
        preferred_genres_q = (
            select(Anime.genres)
            .join(UserAnime, UserAnime.anime_mal_id == Anime.mal_id)
            .filter(UserAnime.user_id == user_id)
            .filter(UserAnime.score.isnot(None))
            .order_by(UserAnime.score.desc())
            .limit(10)
        )
        pref = [row[0] for row in (await db.execute(preferred_genres_q)).all() if row[0]]

        q = select(Anime).order_by(func.coalesce(Anime.score, 0).desc()).limit(limit)
        if pref:
            tokens = [g.strip(' []"') for entry in pref for g in entry.split(',') if g.strip()]
            for token in tokens[:3]:
                q = q.filter(Anime.genres.ilike(f"%{token}%"))

        items = (await db.execute(q)).scalars().all()
        return [{"mal_id": a.mal_id, "title": a.title, "image_url": a.image_url, "score": a.score} for a in items]


recommendation_service = RecommendationService()
