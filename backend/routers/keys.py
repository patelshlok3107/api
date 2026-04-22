from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from database import get_db
from models import APIKey, User
from auth import (
    generate_api_key, hash_key, get_key_prefix,
    get_current_user, get_current_user_optional,
)

router = APIRouter()


# ─── Schemas ──────────────────────────────────────────────────────────────────

class GenerateKeyRequest(BaseModel):
    label: Optional[str] = "My Key"


class GenerateKeyResponse(BaseModel):
    """The raw key is returned ONCE — store it immediately!"""
    key: str
    key_prefix: str
    key_id: str
    label: str
    created_at: str
    message: str


class KeyInfo(BaseModel):
    key_id: str
    key_prefix: str
    label: str
    created_at: str
    is_active: bool
    request_count: int
    last_used: Optional[str]


class RevokeRequest(BaseModel):
    key_id: str


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/generate", response_model=GenerateKeyResponse, status_code=201)
def generate_key(
    req: GenerateKeyRequest = GenerateKeyRequest(),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Generate a new API key.
    - If authenticated (JWT), the key is linked to your account.
    - If anonymous (no JWT), the key is standalone — save it, it's shown only once!
    """
    raw_key = generate_api_key()
    key_hash = hash_key(raw_key)
    key_prefix = get_key_prefix(raw_key)

    api_key = APIKey(
        key_hash=key_hash,
        key_prefix=key_prefix,
        user_id=current_user.id if current_user else None,
        label=req.label or "My Key",
        created_at=datetime.utcnow(),
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)

    return GenerateKeyResponse(
        key=raw_key,
        key_prefix=key_prefix,
        key_id=api_key.id,
        label=api_key.label,
        created_at=api_key.created_at.isoformat(),
        message="⚠️ Save this key immediately — it will never be shown again.",
    )


@router.get("/list", response_model=list[KeyInfo])
def list_keys(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all API keys for the authenticated user."""
    keys = db.query(APIKey).filter(APIKey.user_id == current_user.id).all()
    return [
        KeyInfo(
            key_id=k.id,
            key_prefix=k.key_prefix,
            label=k.label,
            created_at=k.created_at.isoformat(),
            is_active=k.is_active,
            request_count=k.request_count,
            last_used=k.last_used.isoformat() if k.last_used else None,
        )
        for k in keys
    ]


@router.post("/revoke")
def revoke_key(
    req: RevokeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Revoke one of the authenticated user's API keys."""
    api_key = db.query(APIKey).filter(
        APIKey.id == req.key_id,
        APIKey.user_id == current_user.id,
    ).first()
    if not api_key:
        raise HTTPException(status_code=404, detail="Key not found or not yours")
    api_key.is_active = False
    db.commit()
    return {"message": f"Key '{api_key.label}' revoked successfully"}
