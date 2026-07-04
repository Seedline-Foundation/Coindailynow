"""
ClipsAI FastAPI wrapper — cuts long videos into social-ready clips.

Deploys to Contabo as a long-running service on port 8100 (or override via
CLIPSAI_PORT). Loads whisper once at startup so per-request latency stays low.

Endpoints:
    GET  /health                   — readiness probe
    POST /cut  {video_url, ...}    — download, segment, upload clips, return URLs

Setup on Contabo:
    apt install -y python3.10 python3.10-venv ffmpeg
    cd /opt && python3.10 -m venv sygn-clipsai && source sygn-clipsai/bin/activate
    pip install -U pip
    pip install clipsai fastapi uvicorn[standard] requests boto3
    # Copy this file to /opt/sygn-clipsai/main.py
    # Run: uvicorn main:app --host 127.0.0.1 --port 8100 --workers 1
    # Or add to PM2: pm2 start "/opt/sygn-clipsai/bin/uvicorn main:app --host 127.0.0.1 --port 8100" --name sygn-clipsai
"""

import os
import time
import uuid
import shutil
import subprocess
import tempfile
from typing import List, Optional
from pathlib import Path

import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

# ClipsAI + whisper — heavy imports. Wrapped so /health works even if import fails.
try:
    from clipsai import ClipFinder, Transcriber
    _CLIPSAI_OK = True
    _CLIPSAI_IMPORT_ERR = None
except Exception as e:
    _CLIPSAI_OK = False
    _CLIPSAI_IMPORT_ERR = str(e)


# ── Config ────────────────────────────────────────────────────────────────

WORK_DIR = Path(os.environ.get("CLIPSAI_WORK_DIR", "/tmp/sygn-clipsai"))
WORK_DIR.mkdir(parents=True, exist_ok=True)

# Optional CDN upload (Backblaze B2 / S3). If unset, we serve clips over HTTP
# from WORK_DIR — good enough for local testing, not for production.
CDN_BASE_URL = os.environ.get("CDN_BASE_URL", "").rstrip("/")
S3_BUCKET = os.environ.get("S3_BUCKET", "")
S3_ENDPOINT = os.environ.get("S3_ENDPOINT", "")
S3_KEY = os.environ.get("S3_ACCESS_KEY_ID", "")
S3_SECRET = os.environ.get("S3_SECRET_ACCESS_KEY", "")

# Whisper model size — "tiny" / "base" / "small" / "medium" / "large-v3"
WHISPER_MODEL = os.environ.get("WHISPER_MODEL", "base")


# ── Load models once at boot ─────────────────────────────────────────────

_transcriber: Optional[object] = None
_clipfinder: Optional[object] = None
_load_error: Optional[str] = None

def _ensure_loaded():
    global _transcriber, _clipfinder, _load_error
    if _transcriber is not None:
        return
    if not _CLIPSAI_OK:
        _load_error = f"clipsai import failed: {_CLIPSAI_IMPORT_ERR}"
        return
    try:
        _transcriber = Transcriber(model_size=WHISPER_MODEL)
        _clipfinder = ClipFinder()
    except Exception as e:
        _load_error = f"model init failed: {e}"


# ── FastAPI app ──────────────────────────────────────────────────────────

app = FastAPI(title="Sygn ClipsAI Service", version="1.0.0")


@app.on_event("startup")
async def startup():
    _ensure_loaded()


@app.get("/health")
def health():
    return {
        "status": "healthy" if (_transcriber and _clipfinder) else "degraded",
        "clipsai_import": _CLIPSAI_OK,
        "models_loaded": _transcriber is not None and _clipfinder is not None,
        "whisper_model": WHISPER_MODEL,
        "load_error": _load_error,
    }


class CutRequest(BaseModel):
    video_url: str = Field(..., description="HTTP(S) URL of the source video")
    min_duration_sec: int = Field(30, ge=5, le=300)
    max_duration_sec: int = Field(90, ge=10, le=600)
    max_clips: int = Field(5, ge=1, le=20)


class Clip(BaseModel):
    url: str
    start_sec: float
    end_sec: float
    transcript: str
    title: Optional[str] = None


class CutResponse(BaseModel):
    clips: List[Clip]
    total_duration_sec: Optional[float] = None
    processing_ms: int


@app.post("/cut", response_model=CutResponse)
def cut(req: CutRequest):
    _ensure_loaded()
    if _load_error:
        raise HTTPException(503, f"service not ready: {_load_error}")

    t0 = time.time()
    job_id = uuid.uuid4().hex[:12]
    job_dir = WORK_DIR / job_id
    job_dir.mkdir()

    try:
        # 1. Download source video
        src_path = job_dir / "source.mp4"
        _download(req.video_url, src_path)

        # 2. Transcribe
        transcription = _transcriber.transcribe(str(src_path))

        # 3. Find natural clip boundaries
        raw_clips = _clipfinder.find_clips(
            transcription=transcription,
            min_clip_duration=req.min_duration_sec,
            max_clip_duration=req.max_duration_sec,
        )
        raw_clips = raw_clips[: req.max_clips]

        # 4. Cut with ffmpeg + upload
        out: List[Clip] = []
        for i, c in enumerate(raw_clips):
            start = float(getattr(c, "start_time", c.get("start_time") if isinstance(c, dict) else 0))
            end = float(getattr(c, "end_time", c.get("end_time") if isinstance(c, dict) else 0))
            transcript = str(getattr(c, "text", c.get("text", "") if isinstance(c, dict) else ""))
            if end - start < 5:
                continue
            clip_path = job_dir / f"clip-{i+1:02d}.mp4"
            _ffmpeg_cut(src_path, clip_path, start, end)
            url = _publish(clip_path, f"clips/{job_id}/{clip_path.name}")
            out.append(Clip(
                url=url,
                start_sec=start,
                end_sec=end,
                transcript=transcript[:500],
                title=_derive_title(transcript),
            ))

        # 5. Best-effort source-duration probe
        total = _probe_duration(src_path)

        return CutResponse(
            clips=out,
            total_duration_sec=total,
            processing_ms=int((time.time() - t0) * 1000),
        )
    finally:
        # Keep workdir if no CDN (need to serve files); otherwise clean up
        if CDN_BASE_URL or S3_BUCKET:
            shutil.rmtree(job_dir, ignore_errors=True)


# ── Helpers ──────────────────────────────────────────────────────────────

def _download(url: str, dest: Path) -> None:
    with requests.get(url, stream=True, timeout=120) as r:
        r.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in r.iter_content(chunk_size=1 << 20):
                if chunk:
                    f.write(chunk)


def _ffmpeg_cut(src: Path, dest: Path, start: float, end: float) -> None:
    duration = max(1, end - start)
    cmd = [
        "ffmpeg", "-y",
        "-ss", f"{start:.2f}",
        "-i", str(src),
        "-t", f"{duration:.2f}",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart",
        str(dest),
    ]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
    if r.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {r.stderr[-500:]}")


def _publish(local_path: Path, key: str) -> str:
    # Prefer S3-compatible upload (Backblaze B2, MinIO, AWS S3). Fall back to
    # returning a local file:// URL if nothing configured — caller must retrieve.
    if S3_BUCKET and S3_KEY and S3_SECRET:
        try:
            import boto3
            s3 = boto3.client(
                "s3",
                endpoint_url=S3_ENDPOINT or None,
                aws_access_key_id=S3_KEY,
                aws_secret_access_key=S3_SECRET,
            )
            s3.upload_file(str(local_path), S3_BUCKET, key,
                           ExtraArgs={"ContentType": "video/mp4"})
            if CDN_BASE_URL:
                return f"{CDN_BASE_URL}/{key}"
            return f"https://{S3_BUCKET}.s3.amazonaws.com/{key}"
        except Exception as e:
            # Fall through to local URL
            print(f"[clipsai] S3 upload failed: {e}")
    # Local fallback — you'll need a static file server pointed at WORK_DIR
    return f"file://{local_path.absolute()}"


def _probe_duration(path: Path) -> Optional[float]:
    try:
        cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration",
               "-of", "default=noprint_wrappers=1:nokey=1", str(path)]
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        return float(r.stdout.strip()) if r.returncode == 0 else None
    except Exception:
        return None


def _derive_title(transcript: str) -> str:
    # First sentence, capped at 80 chars
    first = (transcript or "").split(".")[0].strip()
    return first[:80] if first else "Clip"
