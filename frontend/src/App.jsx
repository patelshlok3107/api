import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Docs from './pages/Docs'
import Login from './pages/Login'
import Register from './pages/Register'
import Settings from './pages/Settings'

function AppContent() {
  return (
    <div className="dashboard-app-container">
      <Sidebar />
      <div style={{ flex: 1, height: '100vh', overflowY: 'auto', position: 'relative' }}>
        <Routes>
          <Route path="/"          element={<Dashboard />} />
          <Route path="/docs"      element={<Docs />} />
          <Route path="/settings"  element={<Settings />} />
          <Route path="/login"     element={<Login />} />
          <Route path="/register"  element={<Register />} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#141414',
              color: '#d4af37',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  )
}
