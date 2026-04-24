import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Bot, User, Loader, Zap } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function LiveDemo({ demoKey }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "👋 Hey! I'm VRISH Chat, powered by LLaMA via Groq. Ask me anything — code, ideas, explanations!" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [myKey, setMyKey] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const effectiveKey = demoKey || myKey

  const sendMessage = async () => {
    if (!input.trim()) return
    if (!effectiveKey) {
      toast.error('Paste your VRISH API key below to chat!')
      return
    }

    const userMsg = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await axios.post(
        `${API_BASE}/v1/chat/completions`,
        {
          model: 'vrish-chat-v1',
          messages: [...messages, userMsg].filter(m => m.role !== 'system'),
          temperature: 0.7,
          max_tokens: 512,
        },
        { headers: { Authorization: `Bearer ${effectiveKey}`, 'Content-Type': 'application/json' } }
      )
      const reply = res.data?.choices?.[0]?.message?.content || 'No response received.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      const detail = err.response?.data?.detail || err.response?.data?.error?.message || 'Request failed'
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${detail}` }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div style={{
      background: 'rgba(8, 8, 16, 0.8)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
      overflow: 'hidden',
      backdropFilter: 'blur(20px)',
      maxWidth: 640,
      margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'rgba(99,102,241,0.05)',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Zap size={15} color="white" />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>VRISH Chat</div>
          <div style={{ fontSize: 11, color: 'var(--green-light)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
            Live — powered by LLaMA 3.1 via Groq
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ height: 320, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                : 'rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {msg.role === 'user' ? <User size={14} color="white" /> : <Bot size={14} color="#a78bfa" />}
            </div>
            <div style={{
              maxWidth: '78%',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.25))'
                : 'rgba(255,255,255,0.06)',
              border: `1px solid ${msg.role === 'user' ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'}`,
              fontSize: 14,
              lineHeight: 1.55,
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
            </div>
          </motion.div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bot size={14} color="#a78bfa" />
            </div>
            <div style={{
              padding: '10px 14px', borderRadius: '4px 16px 16px 16px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', gap: 4, alignItems: 'center',
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#a78bfa',
                  animation: `blink 1.2s ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Key input for anonymous users */}
      {!demoKey && (
        <div style={{ padding: '0 20px 8px' }}>
          <input
            className="input"
            placeholder="Paste your vrish_sk_... API key to enable chat"
            value={myKey}
            onChange={e => setMyKey(e.target.value)}
            style={{ fontSize: 12, padding: '8px 14px' }}
          />
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: 10,
      }}>
        <textarea
          className="input"
          placeholder="Type a message… (Enter to send)"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          style={{ resize: 'none', flex: 1, fontSize: 14, padding: '10px 14px', lineHeight: 1.4 }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="btn btn-primary"
          style={{
            padding: '10px 16px',
            opacity: loading || !input.trim() ? 0.5 : 1,
            flexShrink: 0,
          }}
        >
          {loading ? <Loader size={16} className="spinner" style={{ animation: 'spin 0.7s linear infinite' }} /> : <Send size={16} />}
        </button>
      </div>
    </div>
  )
}
