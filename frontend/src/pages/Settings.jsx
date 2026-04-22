import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, Shield, Zap, CreditCard, Bell, 
  Trash2, Save, Key, Lock, Globe, Mail
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'api', label: 'API Preferences', icon: Zap },
    { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
  ]

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      toast.success('Settings updated successfully!')
    }, 1200)
  }

  const PageTitle = () => (
    <div style={{ marginBottom: '40px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-1px', marginBottom: '8px' }}>
        System <span className="gradient-text">Settings</span>
      </h1>
      <p style={{ color: '#a1a1aa', fontSize: '14px' }}>
        Manage your profile, security, and API configurations.
      </p>
    </div>
  )

  const TabSidebar = () => (
    <div style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'all 0.2s',
            background: activeTab === tab.id ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
            color: activeTab === tab.id ? '#d4af37' : '#a1a1aa',
            border: activeTab === tab.id ? '1px solid rgba(212, 175, 55, 0.2)' : '1px solid transparent',
            textAlign: 'left'
          }}
        >
          <tab.icon size={18} />
          {tab.label}
        </button>
      ))}
    </div>
  )

  return (
    <div className="dashboard-main" style={{ flexDirection: 'column' }}>
      <PageTitle />

      <div style={{ display: 'flex', gap: '48px', flex: 1 }}>
        <TabSidebar />

        <div style={{ flex: 1, maxWidth: '800px' }}>
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="dash-card"
                style={{ padding: '32px' }}
              >
                <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Profile Information</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                  <div>
                    <label className="input-label">Full Name</label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#52525b' }} />
                      <input className="input" style={{ paddingLeft: '40px' }} defaultValue={user?.full_name || 'Guest User'} />
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#52525b' }} />
                      <input className="input" style={{ paddingLeft: '40px' }} defaultValue={user?.email || 'guest@vrish.ai'} disabled />
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <label className="input-label">Bio (Optional)</label>
                  <textarea 
                    className="input" 
                    placeholder="Tell us about yourself..." 
                    rows={4}
                    style={{ resize: 'none' }}
                  />
                </div>

                <button 
                  onClick={handleSave} 
                  className="btn btn-primary"
                  disabled={saving}
                  style={{ minWidth: '140px' }}
                >
                  {saving ? <div className="spinner" style={{width: 16, height: 16}} /> : <> <Save size={16} /> Save Changes </>}
                </button>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
              >
                <div className="dash-card" style={{ padding: '32px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>Change Password</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '400px' }}>
                    <input className="input" type="password" placeholder="Current Password" />
                    <input className="input" type="password" placeholder="New Password" />
                    <input className="input" type="password" placeholder="Confirm New Password" />
                  </div>
                  <button className="btn btn-primary" style={{ marginTop: '24px' }}>
                    Update Password
                  </button>
                </div>

                <div className="dash-card" style={{ padding: '32px', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: '#ef4444' }}>Danger Zone</h3>
                  <p style={{ color: '#a1a1aa', fontSize: '13px', marginBottom: '20px' }}>
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <button className="btn btn-danger">
                    <Trash2 size={16} /> Delete Account
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'api' && (
              <motion.div
                key="api"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="dash-card"
                style={{ padding: '32px' }}
              >
                <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>API Preferences</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>Auto-rotation</div>
                      <div style={{ fontSize: '13px', color: '#a1a1aa' }}>Automatically rotate keys every 30 days.</div>
                    </div>
                    <div style={{ width: '48px', height: '24px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', position: 'relative' }}>
                      <div style={{ position: 'absolute', right: '4px', top: '4px', width: '16px', height: '16px', background: '#d4af37', borderRadius: '50%' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>Webhook Notifications</div>
                      <div style={{ fontSize: '13px', color: '#a1a1aa' }}>Receive alerts when rate limits are exceeded.</div>
                    </div>
                    <div style={{ width: '48px', height: '24px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '4px', top: '4px', width: '16px', height: '16px', background: '#52525b', borderRadius: '50%' }} />
                    </div>
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <label className="input-label">Default Region</label>
                    <select className="input" style={{ background: '#0a0a0a' }}>
                      <option>Global (Recommended)</option>
                      <option>US East (N. Virginia)</option>
                      <option>EU West (Ireland)</option>
                      <option>Asia Pacific (Singapore)</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'billing' && (
              <motion.div
                key="billing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="dash-gradient-card"
                style={{ padding: '40px', color: '#000' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', opacity: 0.8 }}>Current Plan</div>
                    <div style={{ fontSize: '48px', fontWeight: 900, marginBottom: '24px' }}>Free <span style={{fontSize: '20px', fontWeight: 600}}>Tier</span></div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>• 200 Requests / day</div>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>• Standard Latency</div>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>• Single Key Management</div>
                    </div>
                  </div>

                  <button style={{ background: '#000', color: '#fff', padding: '12px 24px', borderRadius: '99px', fontWeight: 700, fontSize: '14px' }}>
                    Upgrade to Pro
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
