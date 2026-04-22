from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from database import get_db
from models import User
from auth import (
    verify_password, get_password_hash,
    create_access_token, get_current_user,
)

router = APIRouter()


# ─── Schemas ──────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    full_name: str | None
    created_at: str

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenResponse, status_code=201)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new account with email + password."""
    print(f"[AUTH] Attempting registration for: {req.email}")
    try:
        if db.query(User).filter(User.email == req.email).first():
            print(f"[AUTH] Email already registered: {req.email}")
            raise HTTPException(status_code=400, detail="Email already registered")

        print("[AUTH] Creating new user instance...")
        user = User(
            email=req.email,
            password_hash=get_password_hash(req.password),
            full_name=req.full_name,
        )
        print("[AUTH] Adding user to DB...")
        db.add(user)
        print("[AUTH] Committing session...")
        db.commit()
        print("[AUTH] Refreshing user...")
        db.refresh(user)

        print("[AUTH] Creating access token...")
        token = create_access_token({"sub": user.id})
        print(f"[AUTH] Registration successful for {req.email}")
        
        return TokenResponse(
            access_token=token,
            user=UserOut(
                id=user.id,
                email=user.email,
                full_name=user.full_name,
                created_at=user.created_at.isoformat(),
            ),
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"[AUTH] Registration CRASHED: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Login with email + password; returns JWT."""
    user = db.query(User).filter(User.email == req.email, User.is_active == True).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user.id})
    return TokenResponse(
        access_token=token,
        user=UserOut(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            created_at=user.created_at.isoformat(),
        ),
    )


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    """Get the currently authenticated user."""
    return UserOut(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        created_at=current_user.created_at.isoformat(),
    )
