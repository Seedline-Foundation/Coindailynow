import sys
import pytest
from pathlib import Path
from unittest.mock import MagicMock, patch

# Mock clipsai BEFORE importing main
mock_clipsai = MagicMock()
class MockTranscriber:
    def __init__(self, model_size="base"):
        pass
    def transcribe(self, path):
        return "mock transcription"

class MockClipFinder:
    def find_clips(self, transcription, min_clip_duration, max_clip_duration):
        return [
            {"start_time": 10.0, "end_time": 40.0, "text": "This is clip 1. Second sentence."},
        ]

mock_clipsai.Transcriber = MockTranscriber
mock_clipsai.ClipFinder = MockClipFinder
sys.modules["clipsai"] = mock_clipsai

# Mock boto3
sys.modules["boto3"] = MagicMock()

from fastapi.testclient import TestClient
from main import app, WORK_DIR, _ensure_loaded


def test_health_endpoint():
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["clipsai_import"] is True
        assert data["models_loaded"] is True


@patch("main.requests.get")
@patch("main.asyncio.create_subprocess_exec")
def test_cut_endpoint(mock_subproc, mock_get):
    # Setup mock download
    mock_response = MagicMock()
    mock_response.__enter__.return_value = mock_response
    mock_response.raise_for_status.return_value = None
    mock_response.iter_content.return_value = [b"mock chunk"]
    mock_get.return_value = mock_response

    # Setup mock subprocess
    mock_proc = MagicMock()

    # Simple async mock helper
    async def mock_communicate():
        return b"300.0\n", b""

    mock_proc.communicate = mock_communicate
    mock_proc.returncode = 0

    async def mock_create_subprocess_exec(*args, **kwargs):
        return mock_proc

    mock_subproc.side_effect = mock_create_subprocess_exec

    with TestClient(app) as client:
        payload = {
            "video_url": "https://example.com/mock-video.mp4",
            "min_duration_sec": 30,
            "max_duration_sec": 90,
            "max_clips": 5
        }
        response = client.post("/cut", json=payload)
        assert response.status_code == 200
        data = response.json()

        assert "clips" in data
        assert len(data["clips"]) == 1
        clip = data["clips"][0]
        assert clip["start_sec"] == 10.0
        assert clip["end_sec"] == 40.0
        assert clip["transcript"] == "This is clip 1. Second sentence."
        assert clip["title"] == "This is clip 1"
        assert "url" in clip
        assert clip["url"].startswith("file://")
