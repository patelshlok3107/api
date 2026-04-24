import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import CodeSnippet from '../components/CodeSnippet'

const ENDPOINTS = [
  {
    method: 'POST',
    path: '/v1/chat/completions',
    desc: 'Generate a chat completion from a sequence of messages.',
    auth: true,
    body: `{
  "model": "vrish-chat-v1",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "temperature": 0.7,
  "max_tokens": 1024
}`,
    response: `{
  "id": "req_abc123",
  "object": "chat.completion",
  "model": "vrish-chat-v1",
  "choices": [{
    "message": {"role": "assistant", "content": "Hello! How can I help?"},
    "finish_reason": "stop"
  }]
}`,
    params: [
      { name: 'model', type: 'string', req: true, desc: 'vrish-chat-v1 | vrish-chat-pro' },
      { name: 'messages', type: 'array', req: true, desc: 'Array of {role, content} messages' },
      { name: 'temperature', type: 'float', req: false, desc: '0.0–2.0. Default: 0.7' },
      { name: 'max_tokens', type: 'int', req: false, desc: 'Max tokens to generate. Default: 1024' },
    ],
  },
  {
    method: 'POST',
    path: '/v1/image/generate',
    desc: 'Generate an image from a text prompt. Returns a direct URL you can embed.',
    auth: true,
    body: `{
  "prompt": "A futuristic city at sunset, cyberpunk style",
  "model": "vrish-image-v1",
  "width": 1024,
  "height": 1024,
  "seed": 42
}`,
    response: `{
  "id": "img_xyz789",
  "object": "image.generation",
  "data": [{
    "url": "https://image.pollinations.ai/prompt/...",
    "prompt": "A futuristic city...",
    "width": 1024,
    "height": 1024
  }]
}`,
    params: [
      { name: 'prompt', type: 'string', req: true, desc: 'Image description prompt' },
      { name: 'width', type: 'int', req: false, desc: 'Width in pixels. Default: 1024' },
      { name: 'height', type: 'int', req: false, desc: 'Height in pixels. Default: 1024' },
      { name: 'seed', type: 'int', req: false, desc: 'Reproducibility seed (optional)' },
    ],
  },
  {
    method: 'POST',
    path: '/v1/keys/generate',
    desc: 'Generate a new API key. Works anonymously or with JWT auth.',
    auth: false,
    body: `{
  "label": "My App Key"
}`,
    response: `{
  "key": "vrish_sk_xxxxxxxx...",
  "key_prefix": "vrish_sk_aBcD...",
  "key_id": "uuid",
  "label": "My App Key",
  "message": "Save this key immediately — it will never be shown again."
}`,
    params: [
      { name: 'label', type: 'string', req: false, desc: 'Human-readable key label' },
    ],
  },
  {
    method: 'GET',
    path: '/v1/usage/stats',
    desc: 'Get usage statistics. Pass JWT for all keys, or API key for single-key stats.',
    auth: true,
    body: null,
    response: `{
  "key_prefix": "vrish_sk_aBcD...",
  "total_requests": 47,
  "requests_today_db": 12,
  "rate_limit": {
    "requests_this_minute": 2,
    "requests_today": 12,
    "limit_per_minute": 20,
    "limit_per_day": 200,
    "remaining_minute": 18,
    "remaining_day": 188
  }
}`,
    params: [],
  },
  {
    method: 'POST',
    path: '/v1/auth/register',
    desc: 'Register a new account with email + password.',
    auth: false,
    body: `{
  "email": "you@example.com",
  "password": "yourpassword",
  "full_name": "Shlok Mehta"
}`,
    response: `{
  "access_token": "eyJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "user": {"id": "uuid", "email": "you@example.com"}
}`,
    params: [
      { name: 'email', type: 'string', req: true, desc: 'Your email address' },
      { name: 'password', type: 'string', req: true, desc: 'Minimum 6 characters' },
      { name: 'full_name', type: 'string', req: false, desc: 'Display name' },
    ],
  },
]

const METHOD_COLORS = {
  GET:  { bg: 'rgba(16,185,129,0.15)', color: '#34d399', border: 'rgba(16,185,129,0.3)' },
  POST: { bg: 'rgba(99,102,241,0.15)', color: '#818cf8', border: 'rgba(99,102,241,0.3)' },
}

export default function Docs() {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(new Set([0]))

  const toggle = (i) => {
    setExpanded(prev => {
      const n = new Set(prev)
      n.has(i) ? n.delete(i) : n.add(i)
      return n
    })
  }

  const filtered = ENDPOINTS.filter(ep =>
    ep.path.toLowerCase().includes(search.toLowerCase()) ||
    ep.desc.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page">
      <div className="container" style={{ padding: '48px 24px' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 48 }}>
          <span className="section-label">📚 Reference</span>
          <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-1px', marginBottom: 12 }}>
            API <span className="gradient-text">Documentation</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 600, lineHeight: 1.6 }}>
            The VRISH API is OpenAI-compatible. Base URL:{' '}
            <code style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--primary-light)', fontSize: 14 }}>
              {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}
            </code>
          </p>
        </motion.div>

        {/* Auth callout */}
        <div style={{
          background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: 12, padding: '16px 20px',
          marginBottom: 32, fontSize: 14,
        }}>
          <strong style={{ color: 'var(--primary-light)' }}>🔐 Authentication:</strong>
          <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>
            For AI endpoints, pass your VRISH key as:{' '}
            <code style={{ fontFamily: 'JetBrains Mono, monospace', color: '#a5b4fc' }}>
              Authorization: Bearer vrish_sk_...
            </code>
          </span>
        </div>

        {/* Rate limit callout */}
        <div style={{
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 12, padding: '16px 20px',
          marginBottom: 40, fontSize: 14,
        }}>
          <strong style={{ color: 'var(--orange)' }}>⚡ Rate Limits (Free Tier):</strong>
          <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>
            20 requests/minute · 200 requests/day. Rate limit headers are returned on every response.
          </span>
        </div>

        {/* Quick start */}
        <div style={{ marginBottom: 52 }}>
          <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 20 }}>Quick Start</h2>
          <CodeSnippet />
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input"
            placeholder="Search endpoints…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 40 }}
          />
        </div>

        {/* Endpoints */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((ep, i) => {
            const isOpen = expanded.has(i)
            const mc = METHOD_COLORS[ep.method] || METHOD_COLORS.POST
            return (
              <motion.div key={ep.path} className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                {/* Header row */}
                <button
                  onClick={() => toggle(i)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                    padding: '18px 20px', background: 'none', textAlign: 'left',
                    fontFamily: 'inherit', cursor: 'pointer',
                  }}
                >
                  <span style={{
                    padding: '3px 10px', borderRadius: 6, fontWeight: 700, fontSize: 11,
                    fontFamily: 'JetBrains Mono, monospace', letterSpacing: 0.5,
                    background: mc.bg, color: mc.color, border: `1px solid ${mc.border}`,
                    flexShrink: 0,
                  }}>
                    {ep.method}
                  </span>
                  <code style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: 'var(--text-primary)', flex: 1 }}>
                    {ep.path}
                  </code>
                  {!ep.auth && <span className="badge badge-green" style={{ fontSize: 10 }}>No Auth</span>}
                  <span style={{ color: 'var(--text-muted)' }}>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </button>

                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}
                  >
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 16, marginBottom: ep.params.length ? 20 : 0 }}>
                      {ep.desc}
                    </p>

                    {ep.params.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                          Parameters
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                              {['Name', 'Type', 'Required', 'Description'].map(h => (
                                <th key={h} style={{ textAlign: 'left', padding: '6px 12px', color: 'var(--text-muted)', fontWeight: 500 }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {ep.params.map(p => (
                              <tr key={p.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <td style={{ padding: '8px 12px' }}>
                                  <code style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--primary-light)', fontSize: 12 }}>{p.name}</code>
                                </td>
                                <td style={{ padding: '8px 12px', color: 'var(--cyan)' }}>{p.type}</td>
                                <td style={{ padding: '8px 12px' }}>
                                  <span style={{ color: p.req ? 'var(--red)' : 'var(--text-muted)', fontSize: 11 }}>
                                    {p.req ? 'required' : 'optional'}
                                  </span>
                                </td>
                                <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{p.desc}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: ep.body ? '1fr 1fr' : '1fr', gap: 16 }}>
                      {ep.body && (
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Request Body</div>
                          <pre className="code-block" style={{ fontSize: 12 }}>{ep.body}</pre>
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Response</div>
                        <pre className="code-block" style={{ fontSize: 12 }}>{ep.response}</pre>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Swagger link */}
        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <a
            href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <ExternalLink size={15} /> Open Interactive Swagger UI
          </a>
        </div>
      </div>
    </div>
  )
}
