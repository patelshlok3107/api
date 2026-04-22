import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE = 'http://localhost:8000'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('vrish_jwt'))
  const [loading, setLoading] = useState(true)

  // Axios instance with JWT
  const api = axios.create({ baseURL: API_BASE })
  api.interceptors.request.use((config) => {
    const t = localStorage.getItem('vrish_jwt')
    if (t) config.headers.Authorization = `Bearer ${t}`
    return config
  })

  const fetchMe = useCallback(async (jwt) => {
    try {
      const res = await axios.get(`${API_BASE}/v1/auth/me`, {
        headers: { Authorization: `Bearer ${jwt}` },
      })
      setUser(res.data)
    } catch {
      logout()
    }
  }, [])

  useEffect(() => {
    if (token) {
      fetchMe(token).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const register = async (email, password, fullName) => {
    const res = await axios.post(`${API_BASE}/v1/auth/register`, {
      email, password, full_name: fullName,
    })
    const { access_token, user: u } = res.data
    localStorage.setItem('vrish_jwt', access_token)
    setToken(access_token)
    setUser(u)
    return u
  }

  const login = async (email, password) => {
    const res = await axios.post(`${API_BASE}/v1/auth/login`, { email, password })
    const { access_token, user: u } = res.data
    localStorage.setItem('vrish_jwt', access_token)
    setToken(access_token)
    setUser(u)
    return u
  }

  const logout = () => {
    localStorage.removeItem('vrish_jwt')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, api, register, login, logout, API_BASE }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
