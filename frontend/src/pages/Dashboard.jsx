import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Home, PieChart, Users, Layers, Settings, LogOut, 
  Search, Activity, Key, Plus, Terminal,
  Cpu, Zap, Server, ShieldAlert, Copy, RefreshCw
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import axios from 'axios'

const API_BASE = 'http://localhost:8000'

// Mock Data for the beautiful gold chart
// Real-time usage data is fetched from the backend and stored in the 'stats' state.

export default function Dashboard() {
  const { user, token, api, logout } = useAuth()
  const navigate = useNavigate()
  
  const [keys, setKeys] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeNav, setActiveNav] = useState('home')
  const [generating, setGenerating] = useState(false)
  const [newKey, setNewKey] = useState(null)

  const anonKey = localStorage.getItem('vrish_anon_key')

  const loadKeys = useCallback(async () => {
    if (!user) return
    try {
      const res = await api.get('/v1/keys/list')
      setKeys(res.data)
    } catch { /* silent */ }
  }, [user, api])

  const loadStats = useCallback(async () => {
    if (!user && !anonKey) return
    try {
      const headers = user 
        ? { Authorization: `Bearer ${token}` } 
        : { Authorization: `Bearer ${anonKey}` }
      const res = await axios.get(`${API_BASE}/v1/usage/stats`, { headers })
      setStats(res.data)
    } catch { /* silent */ }
  }, [user, token, anonKey])

  useEffect(() => {
    Promise.all([loadKeys(), loadStats()]).finally(() => setLoading(false))
    const interval = setInterval(loadStats, 15000)
    return () => clearInterval(interval)
  }, [loadKeys, loadStats])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const generateKey = async () => {
    setGenerating(true)
    try {
      const label = 'Premium API Key'
      const res = user
        ? await api.post('/v1/keys/generate', { label })
        : await axios.post(`${API_BASE}/v1/keys/generate`, { label })
      setNewKey(res.data.key)
      toast.success('✨ Key Generated! Copy it now (won\'t be shown again).', { duration: 6000 })
      if (!user) localStorage.setItem('vrish_anon_key', res.data.key)
      await loadKeys()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to generate key')
    } finally {
      setGenerating(false)
    }
  }

  // Derived stats
  const activeKeys = keys.filter(k => k.is_active)
  const revokedKeys = keys.filter(k => !k.is_active)
  let totalRequests = stats?.total_requests || 0
  if (user && stats?.keys) {
    totalRequests = stats.keys.reduce((acc, k) => acc + k.total_requests, 0)
  }



  const TopBar = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Platform Overview</h1>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#a1a1aa' }} />
          <input 
            type="text" 
            placeholder="Search API keys..." 
            style={{ 
              background: '#0a0a0a', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '99px',
              padding: '10px 16px 10px 42px', color: '#fff', fontSize: '13px', width: '240px', outline: 'none'
            }} 
          />
        </div>

        <div className="dash-pill" style={{ color: '#d4af37' }}>
          <Activity size={14} color="#fca311" /> 
          {activeKeys.length || (anonKey ? 1 : 0)} Active Keys
        </div>
        <div className="dash-pill" style={{ opacity: 0.7, color: '#a1a1aa' }}>
          {revokedKeys.length} Revoked
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#0a0a0a', border: '1px solid rgba(212, 175, 55, 0.2)', padding: '6px 16px', borderRadius: '99px' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #fca311, #d4af37)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: '#000' }}>
            {user ? user.email[0].toUpperCase() : 'A'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.2 }}>{user ? user.email.split('@')[0] : 'Anon User'}</span>
            <span style={{ fontSize: '11px', color: '#a1a1aa' }}>Developer</span>
          </div>
        </div>

        <button 
          onClick={() => { setLoading(true); Promise.all([loadKeys(), loadStats()]).finally(() => setLoading(false)) }}
          className="sidebar-icon" 
          style={{ width: 36, height: 36, background: '#0a0a0a', border: '1px solid rgba(212, 175, 55, 0.2)', marginBottom: 0 }}
          title="Refresh Data"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>

        <button 
          onClick={generateKey} 
          disabled={generating}
          style={{ 
            background: 'linear-gradient(135deg, #fca311, #d4af37)', 
            color: '#000', fontSize: '13px', fontWeight: 600, 
            padding: '10px 20px', borderRadius: '99px',
            boxShadow: '0 4px 14px rgba(212, 175, 55, 0.3)',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          {generating ? <span className="spinner" style={{width: 14, height: 14, borderTopColor: '#000'}}/> : <Plus size={16}/>} 
          Generate Key
        </button>
      </div>
    </div>
  )

  const StatChart = () => (
    <div className="dash-card" style={{ marginBottom: '32px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600 }}>API Traffic</h2>
        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#a1a1aa', fontWeight: 500 }}>
          <span style={{ color: '#d4af37' }}>Days</span>
          <span>Weeks</span>
          <span>Months</span>
        </div>
      </div>

      <div style={{ height: '240px', width: '100%', marginLeft: '-20px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={stats?.usage_timeline || []} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="time" stroke="#52525b" fontSize={11} tickMargin={10} axisLine={false} tickLine={false} />
            <YAxis stroke="#52525b" fontSize={11} tickFormatter={(val) => val} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ background: '#0a0a0a', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '8px' }}
              itemStyle={{ color: '#d4af37', fontSize: '12px' }}
              labelStyle={{ color: '#fff', fontSize: '13px', marginBottom: '4px' }}
              formatter={(value) => [`${value} requests`, 'Usage']}
            />
            {/* The main solid gold area chart */}
            <Area type="monotone" dataKey="requests" stroke="#d4af37" strokeWidth={3} fillOpacity={1} fill="url(#colorReq)" animationDuration={1000} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )

  const ModelCards = () => {
    const models = [
      { id: 'vrish-chat-pro', name: 'LLaMA 3.3 70B', icon: Cpu, latency: '42', load: 85, color: '#fca311' },
      { id: 'vrish-chat-v1', name: 'LLaMA 3.1 8B', icon: Zap, latency: '18', load: 35, color: '#d4af37' },
      { id: 'vrish-image-v1', name: 'Pollinations Gen', icon: Server, latency: '850', load: 60, color: '#ffffff' }
    ]

    return (
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px' }}>Active Models</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {models.map(m => (
            <div key={m.id} className="dash-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <m.icon size={20} color={m.color} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: '11px', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '4px' }}><Terminal size={10}/> {m.id}</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', fontWeight: 600 }}>
                <span style={{ color: m.color }}>⚡ {m.latency}ms</span>
                <span style={{ color: '#fff' }}>Load {m.load}%</span>
              </div>

              {/* Dot Grid Visualizer */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: 'auto' }}>
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} style={{ 
                    width: '6px', height: '6px', borderRadius: '50%', 
                    background: i < (m.load/100)*24 ? m.color : 'rgba(255,255,255,0.05)' 
                  }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // --- Right Panel ---

  const RightSidebar = () => {
    // Collect specific keys to display or fallback if anon
    const displayKeys = user ? activeKeys : (anonKey ? [{ label: 'Anon Key', key_prefix: anonKey, is_active: true }] : [])

    return (
      <div className="dashboard-right-panel">
        
        {/* New key display */}
        {newKey && (
          <div style={{ marginBottom: '24px', background: 'rgba(212, 175, 55, 0.1)', border: '1px solid #d4af37', padding: '16px', borderRadius: '12px' }}>
            <div style={{ fontSize: '13px', color: '#fca311', fontWeight: 600, marginBottom: '8px' }}>Your new API key (copy now):</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <code style={{ flex: 1, background: '#000', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', color: '#fff', wordBreak: 'break-all' }}>{newKey}</code>
              <button 
                onClick={() => { navigator.clipboard.writeText(newKey); toast.success('Copied to clipboard'); }}
                style={{ background: '#d4af37', color: '#000', padding: '8px', borderRadius: '6px' }}
              >
                <Copy size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Active Keys section */}
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Active API Keys</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px' }}>
          {displayKeys.length === 0 ? (
             <div style={{ color: '#a1a1aa', fontSize: '13px' }}>No active keys found.</div>
          ) : (
            displayKeys.map((k, i) => (
              <div key={i} className="dash-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Key size={18} color="#d4af37" />
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{k.label || 'API Key'}</div>
                  <div style={{ fontSize: '11px', color: '#a1a1aa', fontFamily: 'monospace' }}>{k.key_prefix.substring(0, 16)}...</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rate Limits */}
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Limits & Quotas</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '40px' }}>
          <div className="dash-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={18} color="#ef4444" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: 2 }}>Per Minute</div>
              <div style={{ fontSize: '11px', color: '#a1a1aa' }}>20 req limit</div>
            </div>
            <div style={{ background: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>
              MAX 20
            </div>
          </div>

          <div className="dash-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={18} color="#d4af37" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: 2 }}>Daily Limit</div>
              <div style={{ fontSize: '11px', color: '#a1a1aa' }}>200 req per key</div>
            </div>
            <div style={{ background: '#d4af37', color: '#000', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>
              200 Limit
            </div>
          </div>
        </div>

        {/* Big Widget Bottom */}
        <div className="dash-gradient-card">
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
            {[Zap, Cpu, Server].map((Icon, i) => (
              <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: i > 0 ? -10 : 0, border: '2px solid rgba(212, 175, 55, 0.5)' }}>
                <Icon size={14} color="#000" />
              </div>
            ))}
          </div>
          <div style={{ fontSize: '42px', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1 }}>+{totalRequests > 1000 ? (totalRequests/1000).toFixed(1) + 'k' : totalRequests}</div>
          <div style={{ fontSize: '13px', fontWeight: 600, opacity: 0.8, marginTop: '8px', color: 'rgba(0,0,0,0.8)' }}>Total API Executions</div>
        </div>

      </div>
    )
  }

  // Loading State
  if (loading) {
    return (
      <div className="dashboard-app-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ borderTopColor: '#d4af37' }} />
      </div>
    )
  }

  return (
    <>
      <div className="dashboard-main">
        <TopBar />
        <StatChart />
        <ModelCards />
      </div>
      <RightSidebar />
    </>
  )
}
