# ClipsAI Service — Sygn video clip cutter

Long-running Python service that wraps [ClipsAI](https://github.com/ClipsAI/clipsai) so the Node backend can call it over HTTP.

## Why a wrapper?

ClipsAI is a Python library. Our backend is Node. The bridge has to be a network call. We use a long-running FastAPI process so whisper only loads once (saves 10-30s per call).

## Deploy on Contabo

```bash
# 1. System deps
apt install -y python3.10 python3.10-venv ffmpeg

# 2. Virtualenv
mkdir -p /opt/sygn-clipsai && cd /opt/sygn-clipsai
python3.10 -m venv .
source bin/activate
pip install -U pip
pip install clipsai fastapi uvicorn[standard] requests boto3

# 3. Drop the wrapper in
scp ai-services/clipsai-service/main.py root@167.86.99.97:/opt/sygn-clipsai/main.py

# 4. Environment (optional — for S3/B2 upload)
cat > /opt/sygn-clipsai/.env <<EOF
WHISPER_MODEL=base                           # or small/medium/large-v3 if GPU
CLIPSAI_WORK_DIR=/var/lib/sygn-clipsai
S3_BUCKET=your-b2-bucket
S3_ENDPOINT=https://s3.us-west-004.backblazeb2.com
S3_ACCESS_KEY_ID=xxxxx
S3_SECRET_ACCESS_KEY=xxxxx
CDN_BASE_URL=https://cdn.sygn.live
EOF

# 5. PM2 (matches your other sygn-* processes)
pm2 start "bash -c 'source /opt/sygn-clipsai/bin/activate && source /opt/sygn-clipsai/.env && uvicorn main:app --host 127.0.0.1 --port 8100'" \
  --name sygn-clipsai
pm2 save

# 6. Verify
curl -s localhost:8100/health
# {"status":"healthy","models_loaded":true,"whisper_model":"base",...}
```

## Whisper model size vs cost

| Model | RAM | Speed (CPU) | Quality |
|---|---|---|---|
| tiny | ~1GB | 10x realtime | OK for punchy clips |
| base | ~1GB | 7x realtime | **Recommended default** |
| small | ~2GB | 4x realtime | Better transcript accuracy |
| medium | ~5GB | 2x realtime | Good |
| large-v3 | ~10GB | 1x realtime | Best; needs GPU to be practical |

For CPU-only Contabo, stick with `base` unless you notice mis-transcriptions.

## Local dev via SSH tunnel

Add `-L 8100:127.0.0.1:8100` to your existing tunnel:

```bash
ssh -L 11434:127.0.0.1:11434 -L 7860:127.0.0.1:7860 -L 8090:127.0.0.1:8080 \
    -L 8100:127.0.0.1:8100 root@167.86.99.97
```

Then in your local `backend/.env`:

```
CLIPSAI_URL=http://localhost:8100
```

Restart the backend. When the video pipeline hits step 10 (`cutClips`) and strategy says `cutClipsFromLong: true`, it'll hit the service.

## Test manually

```bash
curl -X POST http://localhost:8100/cut \
  -H 'Content-Type: application/json' \
  -d '{
    "video_url": "https://example.com/some-long-video.mp4",
    "min_duration_sec": 30,
    "max_duration_sec": 90,
    "max_clips": 3
  }'
```

Expect a response like:

```json
{
  "clips": [
    { "url": "https://cdn.sygn.live/clips/abc123/clip-01.mp4", "start_sec": 45.2, "end_sec": 118.4, "transcript": "...", "title": "..." },
    ...
  ],
  "total_duration_sec": 480.5,
  "processing_ms": 42000
}
```

## Troubleshooting

- **`load_error` non-null in /health**: `pip install --upgrade clipsai transformers torch` in the venv. Then `pm2 restart sygn-clipsai`.
- **`ffmpeg not found`**: `apt install -y ffmpeg`.
- **Out of memory during transcribe**: drop to `WHISPER_MODEL=tiny`.
- **All clips end up as `file://`**: S3 upload not configured. Set the S3_* env vars in step 4.
