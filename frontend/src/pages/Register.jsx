import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, Zap, ArrowLeft, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const PERKS = ['Free forever', 'Manage multiple keys', 'Usage analytics', 'OpenAI-compatible']

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Email and password are required'); return }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await register(email, password, fullName)
      toast.success('🎉 Account created! Welcome to VRISH!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page grid-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', position: 'relative', padding: '80px 24px' }}>
      <div className="orb orb-purple" style={{ width: 600, height: 600, top: '-10%', right: '-10%' }} />
      <div className="orb orb-cyan"   style={{ width: 400, height: 400, bottom: '0', left: '-5%' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, maxWidth: 860, width: '100%', position: 'relative', zIndex: 1, alignItems: 'start' }}>

        {/* Left panel */}
        <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} style={{ paddingTop: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, marginBottom: 40 }}>
            <ArrowLeft size={14} /> Back
          </Link>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 24, boxShadow: '0 8px 30px rgba(99,102,241,0.35)',
          }}>
            <Zap size={24} color="white" />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-1px', lineHeight: 1.2, marginBottom: 16 }}>
            Start building<br />
            <span className="gradient-text">with AI today.</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.65, marginBottom: 32 }}>
            Create your free account and get instant access to chat, image generation, and code AI — all under one key.
          </p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {PERKS.map(perk => (
              <li key={perk} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text-secondary)' }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Check size={11} color="var(--green-light)" />
                </div>
                {perk}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Right panel — form */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="card" style={{ padding: '36px 32px' }}>
            <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Create your account</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 }}>Free forever · No credit card required</p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 18 }}>
                <label className="input-label">
                  <User size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
                  Full Name <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
                </label>
                <input
                  id="register-name"
                  className="input"
                  type="text"
                  placeholder="Shlok Mehta"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  autoComplete="name"
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label className="input-label">
                  <Mail size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
                  Email Address
                </label>
                <input
                  id="register-email"
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div style={{ marginBottom: 28 }}>
                <label className="input-label">
                  <Lock size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="register-password"
                    className="input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ paddingRight: 44 }}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', color: 'var(--text-muted)', display: 'flex' }}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Strength bar */}
                {password.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 2,
                        background: password.length >= i * 2
                          ? i <= 1 ? '#ef4444' : i <= 2 ? '#f59e0b' : i <= 3 ? '#10b981' : '#6366f1'
                          : 'rgba(255,255,255,0.08)',
                        transition: 'background 0.3s',
                      }} />
                    ))}
                  </div>
                )}
              </div>

              <button
                id="register-submit"
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '13px' }}
              >
                {loading ? <span className="spinner" /> : <Zap size={16} />}
                {loading ? 'Creating account…' : 'Create Free Account'}
              </button>
            </form>

            <div className="divider" />
            <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Sign in</Link>
            </p>
          </div>
        </motion.div>

      </div>

      <style>{`
        @media (max-width: 680px) {
          .register-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
