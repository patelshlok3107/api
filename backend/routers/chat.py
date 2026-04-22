import os
import uuid
import time
import httpx

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from database import get_db
from models import APIKey
from auth import validate_api_key
from rate_limiter import rate_limiter

router = APIRouter()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = "llama-3.1-8b-instant"

# Model name aliases — map VRISH model names → Groq model IDs
MODEL_MAP = {
    "vrish-chat-v1":   "llama-3.1-8b-instant",
    "vrish-chat-pro":  "llama-3.3-70b-versatile",
    "vrish-code-v1":   "llama-3.1-8b-instant",
    "llama-3.1-8b-instant": "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile": "llama-3.3-70b-versatile",
}


# ─── Schemas ──────────────────────────────────────────────────────────────────

class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    model: Optional[str] = "vrish-chat-v1"
    messages: list[Message]
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1024
    stream: Optional[bool] = False


# ─── Endpoint ─────────────────────────────────────────────────────────────────

@router.post("/completions")
async def chat_completions(
    request: Request,
    body: ChatRequest,
    db: Session = Depends(get_db),
):
    """
    OpenAI-compatible chat completion endpoint.
    Requires: Authorization: Bearer vrish_sk_xxx
    """
    # ── Extract & validate API key ──
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    raw_key = auth_header.removeprefix("Bearer ").strip()
    api_key: APIKey = validate_api_key(raw_key, db)

    # ── Rate limiting ──
    allowed, reason, rl_headers = rate_limiter.check(api_key.id)
    if not allowed:
        resp = JSONResponse(
            status_code=429,
            content={"error": {"message": reason, "type": "rate_limit_exceeded"}},
            headers=rl_headers,
        )
        return resp

    # ── Validate Groq key ──
    if not GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured. Set GROQ_API_KEY in .env")

    # ── Map model name ──
    groq_model = MODEL_MAP.get(body.model, DEFAULT_MODEL)

    # ── Call Groq API ──
    groq_payload = {
        "model": groq_model,
        "messages": [m.model_dump() for m in body.messages],
        "temperature": body.temperature,
        "max_tokens": body.max_tokens,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            groq_resp = await client.post(
                GROQ_BASE_URL,
                json=groq_payload,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
            )
        groq_resp.raise_for_status()
        groq_data = groq_resp.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Upstream error: {e.response.text}")
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Could not reach AI service: {str(e)}")

    # ── Update DB usage counters ──
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

    # ── Build standardised VRISH response ──
    request_id = f"req_{uuid.uuid4().hex[:12]}"
    choices = groq_data.get("choices", [])
    usage_data = groq_data.get("usage", {})

    return JSONResponse(
        content={
            "id": request_id,
            "object": "chat.completion",
            "created": int(time.time()),
            "model": body.model,
            "choices": choices,
            "usage": usage_data,
            "vrish": {
                "routed_to": groq_model,
                "requests_remaining_today": rl_headers.get("X-RateLimit-Remaining-Day"),
            },
        },
        headers=rl_headers,
    )
