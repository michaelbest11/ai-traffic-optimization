# backend/server.py
import os
import json
import random
import math
import asyncio
import logging
import subprocess
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, Any

from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

import numpy as np
import pandas as pd
import joblib
import warnings

warnings.filterwarnings("ignore")

# load .env
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("server")

# directories
STREAM_DIR = ROOT_DIR / "hls_streams"      # will hold per-camera folders with index.m3u8 + segments
CLIPS_DIR = ROOT_DIR / "clips"             # stored cut clips
STREAM_DIR.mkdir(parents=True, exist_ok=True)
CLIPS_DIR.mkdir(parents=True, exist_ok=True)

# Try to load camera list from cams.json if present
CAMS_JSON = ROOT_DIR / "cams.json"
if CAMS_JSON.exists():
    try:
        with CAMS_JSON.open("r", encoding="utf-8") as f:
            cameras = json.load(f)
            logger.info(f"Loaded {len(cameras)} cameras from cams.json")
    except Exception as e:
        logger.exception("Failed to load cams.json, falling back to example list")
        cameras = []
else:
    # fallback example camera list; update with your RTSPs or HLS sources
    cameras = [
        {"id": "accra_cam_1", "title": "Ring Rd", "source_rtsp": "rtsp://user:pass@10.0.0.10:554/stream"},
        {"id": "kumasi_cam_2", "title": "Tech Junction", "source_rtsp": "rtsp://user:pass@10.0.1.10:554/stream"},
    ]
    logger.info("No cams.json found — using built-in example cameras (update cams.json)")

# helper to locate ffmpeg
import shutil
FFMPEG_BIN = shutil.which("ffmpeg") or os.environ.get("FFMPEG_PATH")
if not FFMPEG_BIN:
    logger.warning("ffmpeg not found on PATH and FFMPEG_PATH not set. HLS/clip commands will be skipped until ffmpeg is installed.")


def start_hls_stream(cam: Dict[str, Any]) -> None:
    """
    Start an ffmpeg process to convert RTSP -> HLS into STREAM_DIR/<cam_id>/index.m3u8
    This function is non-blocking (spawns subprocess); it will log failures instead of raising.
    """
    cam_id = cam.get("id")
    rtsp = cam.get("source_rtsp") or cam.get("rtsp_url") or cam.get("url")
    if not rtsp:
        logger.info(f"[HLS] Camera {cam_id} has no RTSP/URL configured — skipping")
        return

    if not FFMPEG_BIN:
        logger.warning(f"[HLS] ffmpeg not available — cannot start stream for {cam_id}")
        return

    out_dir = STREAM_DIR / cam_id
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "index.m3u8"

    # If we already have a running process (rudimentary check: presence of index), skip starting another
    if out_file.exists():
        # we still might want to restart if old — but keep simple for now
        logger.info(f"[HLS] HLS output already exists for {cam_id} — skipping start (index exists)")
        return

    # ffmpeg command: using tcp transport is often more reliable for RTSP on networks behind NAT
    cmd = [
        FFMPEG_BIN,
        "-rtsp_transport", "tcp",
        "-i", rtsp,
        "-c:v", "copy",                 # copy codec (low CPU). If issues, consider libx264 and encoding
        "-c:a", "aac",
        "-f", "hls",
        "-hls_time", "2",
        "-hls_list_size", "5",
        "-hls_flags", "delete_segments+append_list",
        "-start_number", "0",
        str(out_file)
    ]

    logger.info(f"[HLS] Starting ffmpeg for camera {cam_id}: {' '.join(cmd[:4])} ...")
    try:
        # spawn detached process, redirect output to log files to avoid blocking uvicorn stdout
        stdout_path = out_dir / "ffmpeg_stdout.log"
        stderr_path = out_dir / "ffmpeg_stderr.log"
        stdout_f = open(stdout_path, "ab")
        stderr_f = open(stderr_path, "ab")
        subprocess.Popen(cmd, stdout=stdout_f, stderr=stderr_f, close_fds=True)
        logger.info(f"[HLS] ffmpeg started for {cam_id} — output at {out_file}")
    except Exception as e:
        logger.exception(f"[HLS] Failed to start ffmpeg for {cam_id}: {e}")


def create_clip(source: str, start_seconds: int, duration: int, cam_id: str) -> str:
    """
    Create clip via ffmpeg. source may be rtsp or http/mp4.
    Saves clip to CLIPS_DIR/<cam_id>_<timestamp>.mp4 and returns filename.
    """
    if not FFMPEG_BIN:
        raise RuntimeError("ffmpeg not available on server")

    timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    filename = f"{cam_id}_{timestamp}.mp4"
    out_path = CLIPS_DIR / filename

    cmd = [
        FFMPEG_BIN,
        "-rtsp_transport", "tcp",
        "-ss", str(start_seconds),
        "-i", source,
        "-t", str(duration),
        "-c:v", "copy",
        "-c:a", "aac",
        str(out_path)
    ]
    logger.info(f"[CLIP] Creating clip with ffmpeg: {' '.join(cmd[:6])} ...")
    try:
        subprocess.run(cmd, check=True)
        logger.info(f"[CLIP] Clip created: {out_path}")
        return filename
    except subprocess.CalledProcessError as e:
        logger.exception(f"[CLIP] ffmpeg failed to create clip: {e}")
        raise


# FASTAPI app + router
app = FastAPI(title="AI Traffic Optimizer API", version="1.0")
api_router = APIRouter(prefix="/api")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# mount hls streams directory as static so that index.m3u8 and segments are served
# example stream URL -> http://localhost:8001/hls_streams/accra_cam_1/index.m3u8
app.mount("/hls_streams", StaticFiles(directory=str(STREAM_DIR)), name="hls_streams")
app.mount("/clips", StaticFiles(directory=str(CLIPS_DIR)), name="clips")

# --- Simple demo endpoints for route/traffic (you can extend) ---
@api_router.get("/health")
async def health():
    return {"status": "ok", "time": datetime.utcnow().isoformat()}

@api_router.post("/route/optimize")
async def optimize_route(payload: Dict[str, Any]):
    """
    Expects JSON:
    {
      "start": {"lat": x, "lng": y},
      "end": {"lat": x, "lng": y},
      "city": "Accra"
    }
    """
    start = payload.get("start")
    end = payload.get("end")
    city = payload.get("city", "Accra")
    if not start or not end:
        raise HTTPException(status_code=400, detail="start and end required")

    # crude distance and fake optimization (replace with your ML/graph code)
    distance = math.sqrt((end["lat"] - start["lat"])**2 + (end["lng"] - start["lng"])**2) * 111
    # path = simple three-point path
    path = [start, {"lat": (start["lat"] + end["lat"]) / 2, "lng": (start["lng"] + end["lng"]) / 2}, end]

    # fake time factor based on hour
    hour = datetime.now().hour
    if hour in [7,8,17,18]:
        mult = random.uniform(1.8, 3.0)
        traffic = "Heavy"
    else:
        mult = random.uniform(0.8, 1.2)
        traffic = "Light"
    duration = int(distance * 2 * mult)

    return {
        "city": city,
        "vehicle_type": "car",
        "optimized_route": path,
        "estimated_time_minutes": duration,
        "distance_km": round(distance, 2),
        "traffic_conditions": traffic,
        "alternative_routes": [
            {"route_name": "Alt A", "duration": int(duration * 1.1), "distance": round(distance*1.05,2), "traffic_level": "Moderate"}
        ],
        "ai_insights": "This is a heuristic route — replace with your optimization graph."
    }

@api_router.get("/traffic/current/{city}")
async def current_traffic(city: str):
    # minimal demo: return locations and congestion
    sample = []
    for i in range(5):
        sample.append({
            "intersection_id": f"{city[:3].upper()}_{i+1}",
            "location": {"lat": 5.55 + i*0.002, "lng": -0.19 - i*0.002},
            "vehicle_count": random.randint(10, 200),
            "average_speed": round(random.uniform(10, 45), 1),
            "congestion_level": random.choice(["Low","Medium","High","Critical"])
        })
    return {"city": city, "traffic_data": sample, "summary": {"total_intersections": len(sample)}}

# Stream endpoint (convenience) - you can use the mounted static /hls_streams/ path directly.
@api_router.get("/stream/{cam_id}/index.m3u8")
async def get_stream_m3u8(cam_id: str):
    # path is STREAM_DIR/cam_id/index.m3u8
    file_path = STREAM_DIR / cam_id / "index.m3u8"
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Stream not found (HLS not started or ffmpeg failed)")
    return FileResponse(file_path)

# Clip create and list endpoints
@api_router.post("/clip")
async def request_clip(payload: Dict[str, Any], background_tasks: BackgroundTasks):
    """
    payload: { source: <rtsp or url>, start: seconds (or "HH:MM:SS"), duration: int, camId: str }
    We'll parse/normalize start to seconds (accepts integer seconds or HH:MM:SS)
    """
    source = payload.get("source")
    start = payload.get("start", 0)
    duration = int(payload.get("duration", 10))
    cam_id = payload.get("camId", "unknown")

    def parse_start(s):
        if isinstance(s, int):
            return int(s)
        if isinstance(s, str) and ":" in s:
            parts = [int(x) for x in s.split(":")]
            if len(parts) == 3:
                return parts[0]*3600 + parts[1]*60 + parts[2]
            if len(parts) == 2:
                return parts[0]*60 + parts[1]
        try:
            return int(s)
        except:
            return 0

    start_seconds = parse_start(start)

    if not source:
        raise HTTPException(status_code=400, detail="source required")

    # run clip creation in background to avoid blocking
    async def _create():
        try:
            filename = create_clip(source, start_seconds, duration, cam_id)
            logger.info(f"Clip finished: {filename}")
        except Exception as e:
            logger.exception("Clip creation failed")

    background_tasks.add_task(_create)
    return {"status": "queued", "camId": cam_id, "start": start_seconds, "duration": duration}

@api_router.get("/clip/list")
async def list_clips():
    files = sorted([f.name for f in CLIPS_DIR.glob("*.mp4")], reverse=True)
    out = []
    for f in files:
        stat = (CLIPS_DIR / f).stat()
        out.append({"filename": f, "created_at": datetime.utcfromtimestamp(stat.st_mtime).isoformat()})
    return out

@api_router.get("/clip/download/{filename}")
async def download_clip(filename: str):
    fp = CLIPS_DIR / filename
    if not fp.exists():
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(fp, media_type="video/mp4", filename=filename)


# include router + app startup/shutdown events
app.include_router(api_router)

@app.on_event("startup")
async def app_startup():
    logger.info("Starting app startup tasks...")
    # start HLS for each camera, don't fail startup if ffmpeg missing
    for cam in cameras:
        try:
            start_hls_stream(cam)
        except Exception:
            logger.exception(f"Failed to start stream for camera {cam.get('id')} (continuing)")

@app.on_event("shutdown")
async def app_shutdown():
    logger.info("Shutting down — nothing special configured")


# run via: uvicorn backend.server:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=os.environ.get("HOST", "0.0.0.0"), port=int(os.environ.get("PORT", 8001)))
