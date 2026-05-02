# AnimeCloud Advanced — Enterprise Blueprint

## Phase 1: Architecture Map
- HLS/DASH pipeline with FFmpeg workers and manifest cache.
- Watch-party sync using FastAPI WebSocket signaling + WebRTC data channel.
- Semantic search powered by pgvector embeddings.
- PWA offline caching with IndexedDB download manager.
- Celery queue for heavy media/metadata jobs.
- Prometheus metrics + Grafana dashboards.

## Phase 2: On-the-fly HLS Streaming
- `app/services/hls_engine.py` provides ABR ladder and FFmpeg orchestration.
- `GET /api/stream/hls/{file_id}/master.m3u8` generates and serves master manifest.

## Phase 3: Watch Party
- `app/services/watch_party.py` manages room state and sync events.
- `WS /api/watch-party/{room_id}` broadcasts real-time play/pause/seek state.
- `frontend/src/services/watchParty.ts` and `WatchPartyOverlay.tsx` provide frontend sync client.

## Phase 4: AI Vector Search
- Migration adds `anime_embeddings` table backed by pgvector.
- `app/services/vector_search.py` adds semantic retrieval API surface.
