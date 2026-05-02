from __future__ import annotations

import asyncio
from dataclasses import dataclass
from pathlib import Path

from app.services.redis_cache import redis_service


@dataclass(frozen=True)
class HLSProfile:
    name: str
    width: int
    height: int
    video_bitrate: str
    maxrate: str
    bufsize: str


PROFILES: tuple[HLSProfile, ...] = (
    HLSProfile("1080p", 1920, 1080, "5000k", "5350k", "7500k"),
    HLSProfile("720p", 1280, 720, "2800k", "2996k", "4200k"),
    HLSProfile("480p", 854, 480, "1400k", "1498k", "2100k"),
)


class HLSEngine:
    def __init__(self, ffmpeg_bin: str = "ffmpeg", hls_root: str = "tmp/hls") -> None:
        self._ffmpeg_bin = ffmpeg_bin
        self._hls_root = Path(hls_root)
        self._hls_root.mkdir(parents=True, exist_ok=True)

    def _episode_dir(self, episode_id: str) -> Path:
        path = self._hls_root / episode_id
        path.mkdir(parents=True, exist_ok=True)
        return path

    def _status_key(self, episode_id: str) -> str:
        return f"hls:job:{episode_id}"

    async def get_status(self, episode_id: str) -> dict | None:
        return await redis_service.get(self._status_key(episode_id))

    async def ensure_hls_async(self, source_file: Path, episode_id: str) -> tuple[Path, bool]:
        out_dir = self._episode_dir(episode_id)
        master = out_dir / "master.m3u8"
        if master.exists():
            return master, True

        status = await self.get_status(episode_id)
        if status and status.get("status") == "processing":
            return master, False

        await redis_service.set(self._status_key(episode_id), {"status": "processing"}, expire=3600)
        asyncio.create_task(self._transcode(source_file, episode_id, master))
        return master, False

    async def _transcode(self, source_file: Path, episode_id: str, master: Path) -> None:
        cmd = [self._ffmpeg_bin, "-y", "-i", str(source_file)]
        var_stream_map: list[str] = []
        for idx, profile in enumerate(PROFILES):
            cmd.extend([
                "-map", "0:v:0", "-map", "0:a:0?",
                f"-c:v:{idx}", "libx264",
                f"-b:v:{idx}", profile.video_bitrate,
                f"-maxrate:v:{idx}", profile.maxrate,
                f"-bufsize:v:{idx}", profile.bufsize,
                f"-vf:{idx}", f"scale=w={profile.width}:h={profile.height}:force_original_aspect_ratio=decrease",
                f"-c:a:{idx}", "aac", f"-b:a:{idx}", "128k",
            ])
            var_stream_map.append(f"v:{idx},a:{idx},name:{profile.name}")

        out_dir = self._episode_dir(episode_id)
        cmd.extend([
            "-f", "hls",
            "-hls_time", "6",
            "-hls_playlist_type", "vod",
            "-hls_flags", "independent_segments",
            "-hls_segment_filename", str(out_dir / "%v" / "segment_%05d.ts"),
            "-master_pl_name", "master.m3u8",
            "-var_stream_map", " ".join(var_stream_map),
            str(out_dir / "%v" / "index.m3u8"),
        ])

        proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        _, stderr = await proc.communicate()
        if proc.returncode != 0:
            await redis_service.set(
                self._status_key(episode_id),
                {"status": "failed", "error": stderr.decode("utf-8", errors="ignore")[:1024]},
                expire=3600,
            )
            return
        await redis_service.set(self._status_key(episode_id), {"status": "ready", "manifest": str(master)}, expire=24 * 3600)


hls_engine = HLSEngine()
