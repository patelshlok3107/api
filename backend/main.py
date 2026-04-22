import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from database import create_tables
from routers import users, keys, chat, image, usage

app = FastAPI(
    title="VRISH API Platform",
    description="Universal AI API platform — one key, every capability.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-RateLimit-Limit-Minute", "X-RateLimit-Remaining-Minute",
                    "X-RateLimit-Limit-Day", "X-RateLimit-Remaining-Day", "Retry-After"],
)

# ─── Startup ──────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    create_tables()
    print("[VRISH] API Platform is live!")

# ─── Routers ──────────────────────────────────────────────────────────────────
app.include_router(users.router,  prefix="/v1/auth",   tags=["Authentication"])
app.include_router(keys.router,   prefix="/v1/keys",   tags=["API Keys"])
app.include_router(chat.router,   prefix="/v1/chat",   tags=["Chat"])
app.include_router(image.router,  prefix="/v1/image",  tags=["Image"])
app.include_router(usage.router,  prefix="/v1/usage",  tags=["Usage"])

# ─── Root ─────────────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "platform": "VRISH API Platform",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs",
        "endpoints": {
            "auth": "/v1/auth",
            "keys": "/v1/keys",
            "chat": "/v1/chat/completions",
            "image": "/v1/image/generate",
            "usage": "/v1/usage/stats",
        },
    }

@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
