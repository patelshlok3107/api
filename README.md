# VRISH API Platform

> Universal AI API platform — one key, every capability.

## ⚡ Quick Start

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt

# Copy and fill in your Groq API key
copy .env.example .env
# Edit .env and set GROQ_API_KEY=gsk_...

uvicorn main:app --reload --port 8000
```

Get your free Groq key at: https://console.groq.com

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Then open: **http://localhost:5173**

### 3. One-click startup (PowerShell)
```powershell
.\start.ps1
```

---

## 🔑 Try It Immediately

```bash
# 1. Generate a free key (no signup)
curl -X POST http://localhost:8000/v1/keys/generate \
  -H "Content-Type: application/json" \
  -d '{"label": "Test Key"}'

# 2. Chat with AI
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Authorization: Bearer vrish_sk_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "vrish-chat-v1", "messages": [{"role": "user", "content": "Hello!"}]}'

# 3. Generate an image
curl -X POST http://localhost:8000/v1/image/generate \
  -H "Authorization: Bearer vrish_sk_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "a futuristic city at night, cyberpunk"}'
```

---

## 🌐 Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/v1/auth/register` | — | Register with email + password |
| `POST` | `/v1/auth/login` | — | Get JWT token |
| `GET`  | `/v1/auth/me` | JWT | Get current user |
| `POST` | `/v1/keys/generate` | Optional | Generate API key (anonymous or linked) |
| `GET`  | `/v1/keys/list` | JWT | List all your keys |
| `POST` | `/v1/keys/revoke` | JWT | Revoke a key |
| `POST` | `/v1/chat/completions` | API Key | Chat with LLaMA/Mistral via Groq |
| `POST` | `/v1/image/generate` | API Key | Image generation via Pollinations |
| `GET`  | `/v1/usage/stats` | Key or JWT | Usage statistics |

---

## 📊 Rate Limits (Free Tier)

- **20 requests / minute** per key
- **200 requests / day** per key
- Rate limit headers returned on every response

---

## 🤖 Models

| VRISH Model | Routes To | Best For |
|-------------|-----------|----------|
| `vrish-chat-v1` | LLaMA 3.1 8B (Groq) | Fast general chat |
| `vrish-chat-pro` | LLaMA 3.3 70B (Groq) | Complex reasoning |
| `vrish-image-v1` | Pollinations.ai | Image generation |

---

## 🔐 Security

- API keys hashed with SHA-256 — raw key stored only in **your** browser
- JWT tokens for user sessions (7-day expiry)
- HTTPS recommended for production
- In-memory rate limiting (swap for Redis in production)
