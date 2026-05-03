from __future__ import annotations

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Anime, UserAnime


class RecommendationService:
    async def recommend_for_user(self, db: AsyncSession, user_id: int, limit: int = 12) -> list[dict]:
        # 1. Get user's top genres from highly rated/watched anime
        user_history_stmt = (
            select(Anime.genres)
            .join(UserAnime, UserAnime.anime_mal_id == Anime.mal_id)
            .filter(UserAnime.user_id == user_id)
            .filter(or_(UserAnime.score >= 7, UserAnime.status == "completed"))
            .limit(20)
        )
        pref_rows = (await db.execute(user_history_stmt)).scalars().all()

        # Extract and count genres
        genre_counts: dict[str, int] = {}
        for genres_str in pref_rows:
            if not genres_str: continue
            # Basic parsing of genre string (e.g. "[Action, Sci-Fi]")
            tokens = [g.strip(' []"\'') for g in genres_str.split(',') if g.strip()]
            for t in tokens:
                genre_counts[t] = genre_counts.get(t, 0) + 1

        # Sort genres by preference
        top_genres = sorted(genre_counts.keys(), key=lambda k: genre_counts[k], reverse=True)[:3]

        # 2. Build recommendation query
        q = select(Anime).filter(Anime.score.isnot(None))

        if top_genres:
            # Filter by top genres
            genre_filters = [Anime.genres.ilike(f"%{g}%") for g in top_genres]
            q = q.filter(or_(*genre_filters))

        # 3. Exclude already watched/in-library anime
        watched_stmt = select(UserAnime.anime_mal_id).filter(UserAnime.user_id == user_id)
        watched_ids = (await db.execute(watched_stmt)).scalars().all()
        if watched_ids:
            q = q.filter(Anime.mal_id.notin_(watched_ids))

        # 4. Rank by score and popularity (rank)
        # Higher score and lower rank (meaning higher position in top lists) are better
        q = q.order_by(Anime.score.desc(), Anime.rank.asc()).limit(limit)

        items = (await db.execute(q)).scalars().all()

        # If we don't have enough results, backfill with general top anime
        if len(items) < limit:
            fallback_limit = limit - len(items)
            fallback_q = (
                select(Anime)
                .filter(Anime.mal_id.notin_([a.mal_id for a in items] + list(watched_ids)))
                .order_by(Anime.score.desc())
                .limit(fallback_limit)
            )
            fallback_items = (await db.execute(fallback_q)).scalars().all()
            items.extend(fallback_items)

        return [
            {
                "mal_id": a.mal_id,
                "title": a.title,
                "image_url": a.image_url,
                "score": a.score,
                "year": a.year,
                "type": a.type
            } for a in items
        ]


recommendation_service = RecommendationService()
