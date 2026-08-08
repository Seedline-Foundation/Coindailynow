import os
import sys
import time
import socket
import asyncio
import threading
from pathlib import Path
from unittest.mock import MagicMock
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

# Ensure we have the same schema models
class CutRequest(BaseModel):
    video_url: str
    min_duration_sec: int = 30
    max_duration_sec: int = 90
    max_clips: int = 5

# --- Baseline Blocking Async Context ---
# This simulates a developer changing the endpoint to async def,
# but running blocking synchronous I/O and process execution directly on the event loop.
app_blocking = FastAPI()

@app_blocking.get("/health")
async def health_blocking():
    return {"status": "ok"}

@app_blocking.post("/cut")
async def cut_blocking(req: CutRequest):
    # Simulate blocking synchronous I/O (downloading)
    time.sleep(1.0)
    # Simulate blocking synchronous CPU (transcribing)
    time.sleep(0.5)
    # Simulate blocking synchronous process execution (ffmpeg)
    time.sleep(0.5)
    return {"status": "success"}


# --- Optimized Non-blocking Async Context ---
# This simulates the fixed code where we use async def, but run
# blocking operations with asyncio.to_thread and async subprocesses.
app_optimized = FastAPI()

@app_optimized.get("/health")
async def health_optimized():
    return {"status": "ok"}

@app_optimized.post("/cut")
async def cut_optimized(req: CutRequest):
    # Simulate async download using to_thread
    await asyncio.to_thread(time.sleep, 1.0)
    # Simulate async CPU task using to_thread
    await asyncio.to_thread(time.sleep, 0.5)
    # Simulate async subprocess using create_subprocess_exec (yields loop)
    # (or simulated here by asyncio.sleep to show the non-blocking behavior)
    await asyncio.sleep(0.5)
    return {"status": "success"}


def get_free_port():
    s = socket.socket()
    s.bind(('', 0))
    port = s.getsockname()[1]
    s.close()
    return port

def run_server(app, port):
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="error")

def test_responsiveness(port):
    import requests
    base_url = f"http://127.0.0.1:{port}"
    health_latencies = []

    def run_health():
        time.sleep(0.2)  # Wait for the /cut request to start
        for _ in range(5):
            t0 = time.time()
            try:
                requests.get(f"{base_url}/health", timeout=5)
                health_latencies.append(time.time() - t0)
            except Exception:
                health_latencies.append(999.0)
            time.sleep(0.2)

    # Start health checker thread
    h_thread = threading.Thread(target=run_health)
    h_thread.start()

    # Trigger /cut request
    t_start = time.time()
    try:
        r = requests.post(f"{base_url}/cut", json={"video_url": "https://example.com/video.mp4"}, timeout=10)
    except Exception as e:
        print("Cut request failed:", e)

    h_thread.join()
    return health_latencies

def main():
    print("=========================================")
    print("  MEASURING EVENT LOOP BLOCKING LATENCY  ")
    print("=========================================")

    # 1. Test Blocking Baseline
    port_block = get_free_port()
    t_block = threading.Thread(target=run_server, args=(app_blocking, port_block), daemon=True)
    t_block.start()
    time.sleep(1.0)  # Wait for boot

    print("\n[Baseline] Testing with Blocking Sync I/O in Async Context...")
    blocking_latencies = test_responsiveness(port_block)
    max_blocking = max(blocking_latencies) if blocking_latencies else 0
    avg_blocking = sum(blocking_latencies) / len(blocking_latencies) if blocking_latencies else 0
    print(f"Health check latencies: {[f'{l:.4f}s' for l in blocking_latencies]}")
    print(f"Average latency: {avg_blocking:.4f}s")
    print(f"Maximum latency: {max_blocking:.4f}s")

    # 2. Test Optimized
    port_opt = get_free_port()
    t_opt = threading.Thread(target=run_server, args=(app_optimized, port_opt), daemon=True)
    t_opt.start()
    time.sleep(1.0)  # Wait for boot

    print("\n[Optimized] Testing with Non-blocking Async and Threading...")
    opt_latencies = test_responsiveness(port_opt)
    max_opt = max(opt_latencies) if opt_latencies else 0
    avg_opt = sum(opt_latencies) / len(opt_latencies) if opt_latencies else 0
    print(f"Health check latencies: {[f'{l:.4f}s' for l in opt_latencies]}")
    print(f"Average latency: {avg_opt:.4f}s")
    print(f"Maximum latency: {max_opt:.4f}s")

    print("\n========================= SUMMARY =========================")
    print(f"Baseline Max Blocking Latency  : {max_blocking:.4f}s")
    print(f"Optimized Max Blocking Latency : {max_opt:.4f}s")
    speedup = max_blocking / max_opt if max_opt > 0 else float('inf')
    print(f"Responsiveness Improvement     : {speedup:.1f}x faster health response")
    print("===========================================================")

    if max_opt < 0.1 and max_blocking > 0.5:
        print("RESULT: SUCCESS! Async non-blocking pattern works beautifully.")
    else:
        print("RESULT: FAILURE. Latency optimization did not meet expectations.")

if __name__ == "__main__":
    main()
