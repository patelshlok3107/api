import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Copy, Check, Trash2, Key, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ApiKeyCard({ apiKey, keyId, label, createdAt, isActive, requestCount, onRevoke }) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyKey = async () => {
    await navigator.clipboard.writeText(apiKey)
    setCopied(true)
    toast.success('API key copied to clipboard!')
    setTimeout(() => setCopied(false), 2500)
  }

  const masked = apiKey
    ? apiKey.slice(0, 14) + '•'.repeat(Math.max(0, apiKey.length - 20)) + apiKey.slice(-6)
    : '•'.repeat(32)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
      style={{ padding: '20px 24px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
        <div className="flex items-center gap-2">
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))',
            border: '1px solid rgba(99,102,241,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Key size={15} color="#818cf8" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{label || 'API Key'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Created {new Date(createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${isActive !== false ? 'badge-green' : 'badge-orange'}`}>
            {isActive !== false ? '● Active' : '○ Revoked'}
          </span>
          {requestCount !== undefined && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {requestCount} req
            </span>
          )}
        </div>
      </div>

      {/* Key display */}
      <div style={{
        background: 'rgba(0,0,0,0.4)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 12,
      }}>
        <code style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 13,
          color: revealed ? '#a5b4fc' : 'var(--text-secondary)',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          letterSpacing: revealed ? '0' : '2px',
        }}>
          {revealed ? apiKey : masked}
        </code>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setRevealed(!revealed)}
            title={revealed ? 'Hide key' : 'Reveal key'}
            style={{
              background: 'none',
              color: 'var(--text-muted)',
              padding: 4,
              borderRadius: 6,
              transition: 'color 0.2s',
              display: 'flex',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button
            onClick={copyKey}
            title="Copy key"
            style={{
              background: copied ? 'rgba(16,185,129,0.15)' : 'none',
              color: copied ? 'var(--green-light)' : 'var(--text-muted)',
              padding: 4,
              borderRadius: 6,
              transition: 'all 0.2s',
              display: 'flex',
            }}
            onMouseEnter={e => !copied && (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => !copied && (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <AnimatePresence mode="wait">
              <motion.span key={copied ? 'check' : 'copy'} initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Warning for new key */}
      {apiKey && apiKey.startsWith('vrish_sk_') && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 8, padding: '10px 12px',
          fontSize: 12, color: 'var(--orange)',
          marginBottom: onRevoke ? 12 : 0,
        }}>
          <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
          <span>Save this key now — it will never be shown again in full.</span>
        </div>
      )}

      {/* Revoke button */}
      {onRevoke && isActive !== false && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => onRevoke(keyId)}
            className="btn btn-danger btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Trash2 size={13} /> Revoke Key
          </button>
        </div>
      )}
    </motion.div>
  )
}
