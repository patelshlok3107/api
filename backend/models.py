import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, ForeignKey, Text
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)


class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    key_hash = Column(String, unique=True, nullable=False, index=True)
    key_prefix = Column(String, nullable=False)       # e.g. "vrish_sk_aBcD..." (first 20 chars)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)  # NULL = anonymous key
    label = Column(String, default="Default Key")
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    # Usage tracking
    request_count = Column(Integer, default=0)        # all-time requests
    daily_count = Column(Integer, default=0)          # requests today
    last_used = Column(DateTime, nullable=True)
    last_reset_date = Column(String, nullable=True)   # ISO date string for daily reset


class UsageLog(Base):
    __tablename__ = "usage_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    api_key_id = Column(String, ForeignKey("api_keys.id"), index=True)
    # bucket_hour: YYYY-MM-DD HH:00
    bucket_hour = Column(String, nullable=False, index=True)
    count = Column(Integer, default=0)
