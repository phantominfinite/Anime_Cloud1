from __future__ import annotations
import os
import time
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import text, select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.db.models import User, Anime, Episode, UserAnime, Comment
from app.services.redis_cache import redis_service
from app.services.websocket import manager
from app.core.config import settings

router = APIRouter()

STARTED_AT = time.time()


@router.get("/health")
async def get_system_health(db: AsyncSession = Depends(get_db)):
    db_status = "ok"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"offline: {str(e)}"

    cache_status = "ok"
    try:
        await redis_service.set("health_check", {"ok": True}, expire=5)
    except Exception as e:
        cache_status = f"offline: {str(e)}"

    status = "operational"
    if db_status.startswith("offline") or cache_status.startswith("offline"):
        status = "degraded"

    return {
        "status": status,
        "components": {
            "database": db_status,
            "cache": cache_status,
            "realtime_users": len(manager.active_connections),
        },
    }

@router.get("/info")
async def get_system_info() -> dict:
    uptime_s = int(time.time() - STARTED_AT)
    cache_bytes = 0
    try:
        for root, _, files in os.walk(settings.CACHE_DIR):
            for f in files:
                try:
                    cache_bytes += os.path.getsize(os.path.join(root, f))
                except Exception:
                    pass
    except Exception:
        cache_bytes = -1

    return {
        "ok": True,
        "environment": settings.ENVIRONMENT,
        "uptime_seconds": uptime_s,
        "realtime_users": len(manager.active_connections),
        "cache_dir": settings.CACHE_DIR,
        "cache_bytes": cache_bytes,
    }


@router.get('/admin/analytics')
async def admin_analytics(
    x_admin_api_key: str | None = Header(None, alias="X-Admin-API-Key"),
    db: AsyncSession = Depends(get_db),
):
    if not settings.ADMIN_API_KEY or x_admin_api_key != settings.ADMIN_API_KEY:
        raise HTTPException(status_code=403, detail='Forbidden')

    # Basic Counts
    user_count = await db.scalar(select(func.count(User.id)))
    anime_count = await db.scalar(select(func.count(Anime.id)))
    episode_count = await db.scalar(select(func.count(Episode.id)))
    comment_count = await db.scalar(select(func.count(Comment.id)))

    # Engagement Metrics
    # New users in the last 7 days
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    new_users = await db.scalar(select(func.count(User.id)).filter(User.created_at >= seven_days_ago))

    # Active users (those with library updates in last 7 days)
    active_users = await db.scalar(
        select(func.count(func.distinct(UserAnime.user_id)))
        .filter(UserAnime.updated_at >= seven_days_ago)
    )

    # Content Popularity
    # Top 5 most watched anime (by library entry count)
    top_watched_stmt = (
        select(Anime.title, func.count(UserAnime.id).label('watch_count'))
        .join(UserAnime, UserAnime.anime_mal_id == Anime.mal_id)
        .group_by(Anime.title)
        .order_by(text('watch_count DESC'))
        .limit(5)
    )
    top_watched_res = await db.execute(top_watched_stmt)
    top_watched = [{"title": r[0], "count": r[1]} for r in top_watched_res.all()]

    return {
        'ok': True,
        'analytics': {
            'total_stats': {
                'users': user_count or 0,
                'animes': anime_count or 0,
                'episodes': episode_count or 0,
                'comments': comment_count or 0,
            },
            'engagement': {
                'new_users_7d': new_users or 0,
                'active_users_7d': active_users or 0,
                'realtime_websockets': len(manager.active_connections),
            },
            'top_content': top_watched
        }
    }
