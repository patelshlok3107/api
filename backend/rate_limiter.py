"""
In-memory rate limiter using sliding window per key.
For production, swap this out for a Redis-backed implementation.
"""
from collections import defaultdict
from datetime import datetime, timedelta
import os

RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT_PER_MINUTE", "20"))
RATE_LIMIT_PER_DAY = int(os.getenv("RATE_LIMIT_PER_DAY", "200"))


class RateLimiter:
    def __init__(self):
        # key_id -> list of datetime timestamps (last 60 seconds)
        self._minute_window: dict[str, list] = defaultdict(list)
        # key_id -> {"date": "YYYY-MM-DD", "count": int}
        self._daily_window: dict[str, dict] = defaultdict(lambda: {"date": "", "count": 0})

    def check(self, key_id: str) -> tuple[bool, str, dict]:
        """
        Returns (allowed: bool, reason: str, headers: dict).
        Call this BEFORE processing the request.
        """
        now = datetime.utcnow()
        today_str = now.date().isoformat()

        # ── Sliding-window minute check ──────────────────────────────────────
        cutoff = now - timedelta(minutes=1)
        window = self._minute_window[key_id]
        # Prune entries older than 1 minute
        self._minute_window[key_id] = [ts for ts in window if ts > cutoff]
        minute_used = len(self._minute_window[key_id])

        if minute_used >= RATE_LIMIT_PER_MINUTE:
            retry_after = int((self._minute_window[key_id][0] + timedelta(minutes=1) - now).total_seconds()) + 1
            return False, f"Rate limit: {RATE_LIMIT_PER_MINUTE} requests/minute exceeded", {
                "X-RateLimit-Limit-Minute": str(RATE_LIMIT_PER_MINUTE),
                "X-RateLimit-Remaining-Minute": "0",
                "Retry-After": str(retry_after),
            }

        # ── Daily quota check ────────────────────────────────────────────────
        daily = self._daily_window[key_id]
        if daily["date"] != today_str:
            daily["date"] = today_str
            daily["count"] = 0

        if daily["count"] >= RATE_LIMIT_PER_DAY:
            return False, f"Daily quota of {RATE_LIMIT_PER_DAY} requests exceeded. Resets at midnight UTC.", {
                "X-RateLimit-Limit-Day": str(RATE_LIMIT_PER_DAY),
                "X-RateLimit-Remaining-Day": "0",
            }

        # ── Record the request ───────────────────────────────────────────────
        self._minute_window[key_id].append(now)
        daily["count"] += 1

        return True, "OK", {
            "X-RateLimit-Limit-Minute": str(RATE_LIMIT_PER_MINUTE),
            "X-RateLimit-Remaining-Minute": str(RATE_LIMIT_PER_MINUTE - minute_used - 1),
            "X-RateLimit-Limit-Day": str(RATE_LIMIT_PER_DAY),
            "X-RateLimit-Remaining-Day": str(RATE_LIMIT_PER_DAY - daily["count"]),
        }

    def get_usage(self, key_id: str) -> dict:
        """Return current usage counters for a key."""
        now = datetime.utcnow()
        today_str = now.date().isoformat()
        cutoff = now - timedelta(minutes=1)

        minute_requests = [ts for ts in self._minute_window[key_id] if ts > cutoff]
        daily = self._daily_window[key_id]
        daily_count = daily["count"] if daily["date"] == today_str else 0

        return {
            "requests_this_minute": len(minute_requests),
            "requests_today": daily_count,
            "limit_per_minute": RATE_LIMIT_PER_MINUTE,
            "limit_per_day": RATE_LIMIT_PER_DAY,
            "remaining_minute": max(0, RATE_LIMIT_PER_MINUTE - len(minute_requests)),
            "remaining_day": max(0, RATE_LIMIT_PER_DAY - daily_count),
        }


# Singleton instance shared across all requests
rate_limiter = RateLimiter()
