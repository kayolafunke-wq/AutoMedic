import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

// Demo users for when backend is not connected
const DEMO_USERS = {
  'john@example.com':      { id:'1', name:'John Banda',    email:'john@example.com',      role:'customer',    password:'password123' },
  'peter@automedic.mw':    { id:'2', name:'Peter Nkosi',   email:'peter@automedic.mw',    role:'technician',  password:'password123' },
  'admin@automedic.mw':    { id:'3', name:'Administrator', email:'admin@automedic.mw',    role:'admin',       password:'password123' },
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('am_token')
    const storedUser = localStorage.getItem('am_user')
    if (token && storedUser) {
      try {
        // Try real API first
        api.get('/auth/me')
          .then(res => setUser(res.data.user))
          .catch(() => {
            // Fallback to stored demo user
            setUser(JSON.parse(storedUser))
          })
          .finally(() => setLoading(false))
      } catch {
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    try {
      // Try real backend first
      const res = await api.post('/auth/login', { email, password })
      localStorage.setItem('am_token', res.data.token)
      localStorage.setItem('am_user', JSON.stringify(res.data.user))
      setUser(res.data.user)
      return res.data.user
    } catch (err) {
      // If backend unavailable, use demo credentials
      const demo = DEMO_USERS[email.toLowerCase()]
      if (demo && demo.password === password) {
        const { password: _, ...safeUser } = demo
        localStorage.setItem('am_token', 'demo_token_' + demo.role)
        localStorage.setItem('am_user', JSON.stringify(safeUser))
        setUser(safeUser)
        return safeUser
      }
      // Re-throw original error or generic message
      throw new Error('Invalid credentials')
    }
  }

  const logout = () => {
    localStorage.removeItem('am_token')
    localStorage.removeItem('am_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
