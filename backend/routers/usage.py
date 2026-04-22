from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models import APIKey, User, UsageLog
from auth import validate_api_key, get_current_user, get_current_user_optional
from rate_limiter import rate_limiter
from datetime import datetime, timedelta

router = APIRouter()


@router.get("/stats")
def get_usage_stats(
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Get usage statistics.
    - Authenticated: returns stats for ALL your keys and aggregate hourly log.
    - Anonymous (with API key in header): returns stats and hourly log for that key.
    """
    auth_header = request.headers.get("Authorization", "")
    
    # ── Helpder to build hourly timeline ──────────────────────────────────────
    def get_hourly_stats(db: Session, key_ids: list[str]):
        now = datetime.utcnow()
        hours = []
        # Generate last 24 one-hour buckets
        for i in range(23, -1, -1):
            t = now - timedelta(hours=i)
            hours.append(t.strftime("%Y-%m-%d %H:00"))
        
        logs = db.query(UsageLog).filter(
            UsageLog.api_key_id.in_(key_ids),
            UsageLog.bucket_hour.in_(hours)
        ).all()
        
        log_map = {l.bucket_hour: l.count for l in logs}
        
        timeline = []
        for h in hours:
            # Format label for frontend: e.g. "3 PM"
            dt = datetime.strptime(h, "%Y-%m-%d %H:00")
            label = dt.strftime("%I %p").lstrip("0").lower()
            timeline.append({
                "time": label,
                "requests": log_map.get(h, 0),
                "bucket": h
            })
        return timeline

    if current_user:
        keys = db.query(APIKey).filter(
            APIKey.user_id == current_user.id,
            APIKey.is_active == True,
        ).all()
        key_ids = [k.id for k in keys]

        result = []
        for k in keys:
            rt_usage = rate_limiter.get_usage(k.id)
            result.append({
                "key_id": k.id,
                "key_prefix": k.key_prefix,
                "label": k.label,
                "total_requests": k.request_count,
                "requests_today_db": k.daily_count,
                "last_used": k.last_used.isoformat() if k.last_used else None,
                "rate_limit": rt_usage,
            })

        return {
            "user_id": current_user.id,
            "email": current_user.email,
            "keys": result,
            "total_requests_all_time": sum(k.request_count for k in keys),
            "usage_timeline": get_hourly_stats(db, key_ids)
        }

    elif auth_header.startswith("Bearer vrish_sk_"):
        raw_key = auth_header.removeprefix("Bearer ").strip()
        api_key = validate_api_key(raw_key, db)
        rt_usage = rate_limiter.get_usage(api_key.id)
        return {
            "key_id": api_key.id,
            "key_prefix": api_key.key_prefix,
            "label": api_key.label,
            "total_requests": api_key.request_count,
            "requests_today_db": api_key.daily_count,
            "last_used": api_key.last_used.isoformat() if api_key.last_used else None,
            "rate_limit": rt_usage,
            "usage_timeline": get_hourly_stats(db, [api_key.id])
        }

    else:
        raise HTTPException(
            status_code=401,
            detail="Provide either a JWT or your VRISH API key"
        )
