import uuid
import time
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
from models import APIKey
from auth import validate_api_key
from rate_limiter import rate_limiter

router = APIRouter()

POLLINATIONS_BASE = "https://image.pollinations.ai/prompt"


# ─── Schemas ──────────────────────────────────────────────────────────────────

class ImageRequest(BaseModel):
    prompt: str
    model: Optional[str] = "vrish-image-v1"
    width: Optional[int] = 1024
    height: Optional[int] = 1024
    negative_prompt: Optional[str] = None
    seed: Optional[int] = None


# ─── Endpoint ─────────────────────────────────────────────────────────────────

@router.post("/generate")
async def generate_image(
    request: Request,
    body: ImageRequest,
    db: Session = Depends(get_db),
):
    """
    Generate an image from a text prompt via Pollinations.ai (free, no key required).
    Returns a URL you can embed directly in <img> tags.
    """
    # ── Auth ──
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    raw_key = auth_header.removeprefix("Bearer ").strip()
    api_key: APIKey = validate_api_key(raw_key, db)

    # ── Rate limiting ──
    allowed, reason, rl_headers = rate_limiter.check(api_key.id)
    if not allowed:
        return JSONResponse(
            status_code=429,
            content={"error": {"message": reason, "type": "rate_limit_exceeded"}},
            headers=rl_headers,
        )

    # ── Build Pollinations URL ──
    encoded_prompt = quote(body.prompt)
    params = f"?width={body.width}&height={body.height}&nologo=true&enhance=true"
    if body.seed:
        params += f"&seed={body.seed}"
    image_url = f"{POLLINATIONS_BASE}/{encoded_prompt}{params}"

    # ── Update usage ──
    today_str = datetime.utcnow().date().isoformat()
    if api_key.last_reset_date != today_str:
        api_key.daily_count = 0
        api_key.last_reset_date = today_str
    api_key.request_count += 1
    api_key.daily_count += 1
    api_key.last_used = datetime.utcnow()
    db.commit()

    # ── Time-series usage log ──
    from utils import record_usage
    record_usage(db, api_key.id)

    request_id = f"img_{uuid.uuid4().hex[:12]}"

    return JSONResponse(
        content={
            "id": request_id,
            "object": "image.generation",
            "created": int(time.time()),
            "model": body.model,
            "data": [
                {
                    "url": image_url,
                    "prompt": body.prompt,
                    "width": body.width,
                    "height": body.height,
                    "revised_prompt": body.prompt,
                }
            ],
            "vrish": {
                "provider": "pollinations.ai",
                "requests_remaining_today": rl_headers.get("X-RateLimit-Remaining-Day"),
            },
        },
        headers=rl_headers,
    )
