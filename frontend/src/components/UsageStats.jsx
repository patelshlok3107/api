import { motion } from 'framer-motion'

export default function UsageStats({ stats }) {
  if (!stats) return null

  const rl = stats.rate_limit || {}
  const minutePct = Math.min(100, ((rl.requests_this_minute || 0) / (rl.limit_per_minute || 20)) * 100)
  const dayPct    = Math.min(100, ((rl.requests_today     || 0) / (rl.limit_per_day    || 200)) * 100)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
      <StatCard
        label="Requests Today"
        value={rl.requests_today ?? stats.requests_today_db ?? 0}
        limit={rl.limit_per_day || 200}
        pct={dayPct}
        color="var(--primary)"
        sublabel={`${rl.remaining_day ?? (200 - (rl.requests_today || 0))} remaining`}
      />
      <StatCard
        label="This Minute"
        value={rl.requests_this_minute || 0}
        limit={rl.limit_per_minute || 20}
        pct={minutePct}
        color="var(--cyan)"
        sublabel={`${rl.remaining_minute ?? (20 - (rl.requests_this_minute || 0))} remaining`}
      />
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>All-Time Requests</div>
        <div className="stat-number" style={{ fontSize: '2rem', marginBottom: 4 }}>
          {(stats.total_requests || 0).toLocaleString()}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {stats.last_used
            ? `Last used ${new Date(stats.last_used).toLocaleDateString()}`
            : 'Not used yet'
          }
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, limit, pct, color, sublabel }) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const strokeDash = circumference - (pct / 100) * circumference
  const warnColor = pct > 80 ? '#ef4444' : pct > 60 ? '#f59e0b' : color

  return (
    <div className="card" style={{ padding: '20px 24px' }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* Ring */}
        <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
          <svg width="90" height="90" viewBox="0 0 90 90" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="45" cy="45" r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="7"
            />
            <motion.circle
              cx="45" cy="45" r={radius}
              fill="none"
              stroke={warnColor}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: strokeDash }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              style={{ filter: `drop-shadow(0 0 6px ${warnColor}80)` }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>{value}</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>/ {limit}</span>
          </div>
        </div>
        {/* Text */}
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
            {Math.round(pct)}%
          </div>
          <div style={{ fontSize: 12, color: warnColor }}>{sublabel}</div>
          {pct > 80 && (
            <div style={{ fontSize: 11, color: 'var(--orange)', marginTop: 4 }}>⚠ Approaching limit</div>
          )}
        </div>
      </div>
    </div>
  )
}
