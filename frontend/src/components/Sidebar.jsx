import { Link, useLocation } from 'react-router-dom'
import { Home, LayoutDashboard, BookOpen, Settings, LogOut, LogIn, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/' && location.pathname !== '/') return false
    return location.pathname.startsWith(path) && (path !== '/' || location.pathname === '/')
  }

  const handleLogout = () => {
    logout()
  }

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, path: '/', label: 'Dashboard' },
    { id: 'docs', icon: BookOpen, path: '/docs', label: 'Docs' },
    { id: 'settings', icon: Settings, path: '/settings', label: 'Settings' },
  ]

  return (
    <div className="dashboard-sidebar">
      <Link to="/" className="dashboard-logo">
        VRISH<span>.</span>
      </Link>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'center' }}>
        {navItems.map(item => (
          <Link 
            key={item.id} 
            to={item.path}
            className={`sidebar-icon ${isActive(item.path) ? 'active' : ''}`}
            title={item.label}
          >
            <item.icon size={22} />
          </Link>
        ))}
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'center' }}>
        {user ? (
          <div className="sidebar-icon" onClick={handleLogout} title="Log Out">
            <LogOut size={22} />
          </div>
        ) : (
          <>
            <Link to="/login" className="sidebar-icon" title="Sign In">
              <LogIn size={22} />
            </Link>
            <Link to="/register" className="sidebar-icon" title="Create Account">
              <UserPlus size={22} />
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
