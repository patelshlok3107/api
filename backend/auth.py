import secrets
import hashlib
import os
from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from models import User, APIKey

SECRET_KEY = os.getenv("SECRET_KEY", "vrish-super-secret-key-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

bearer_scheme = HTTPBearer()


# ─── API Key Utils ────────────────────────────────────────────────────────────

def generate_api_key() -> str:
    """Generate a new API key in vrish_sk_xxx format."""
    random_part = secrets.token_urlsafe(32)
    return f"vrish_sk_{random_part}"


def hash_key(key: str) -> str:
    """SHA-256 hash of the API key — stored in DB, never the raw key."""
    return hashlib.sha256(key.encode()).hexdigest()


def get_key_prefix(key: str) -> str:
    """Return the first 20 chars for safe display (e.g., vrish_sk_aBcD...)."""
    return key[:20] + "..."


# ─── Password Utils ───────────────────────────────────────────────────────────

def verify_password(plain: str, hashed: str) -> bool:
    if not hashed:
        return False
    try:
        return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    # bcrypt limits to 72 bytes
    pwd_bytes = password.encode('utf-8')
    if len(pwd_bytes) > 72:
        pwd_bytes = pwd_bytes[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')


# ─── JWT Utils ────────────────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


# ─── FastAPI Dependencies ─────────────────────────────────────────────────────

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Extract and validate JWT; return the User object."""
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Like get_current_user but returns None if no token provided (for optional auth)."""
    if not credentials:
        return None
    payload = decode_token(credentials.credentials)
    if not payload:
        return None
    user_id = payload.get("sub")
    return db.query(User).filter(User.id == user_id, User.is_active == True).first()


def validate_api_key(raw_key: str, db: Session) -> APIKey:
    """Validate a raw vrish_sk_ key against the DB. Returns APIKey or raises 401."""
    if not raw_key.startswith("vrish_sk_"):
        raise HTTPException(status_code=401, detail="Invalid API key format")
    key_hash = hash_key(raw_key)
    api_key = db.query(APIKey).filter(
        APIKey.key_hash == key_hash,
        APIKey.is_active == True
    ).first()
    if not api_key:
        raise HTTPException(status_code=401, detail="Invalid or revoked API key")
    return api_key
