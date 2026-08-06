import { createContext, useContext, useState, useEffect } from 'react'
import {
  auth, googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from '../config/firebase'
import api from '../services/api'

const AuthContext = createContext(null)

// Prevents duplicate firebase-sync when loginWithGoogle handles its own backend call
let _googleSyncInProgress = false

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  // Listen to Firebase auth state
  useEffect(() => {
    // Restore backend-only session first (admin/technician)
    const stored = localStorage.getItem('am_user')
    const token  = localStorage.getItem('am_token')
    if (stored && token) {
      try { setUser(JSON.parse(stored)) } catch {}
    }

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Skip sync if loginWithGoogle() is already handling it (prevents double-sync)
        if (_googleSyncInProgress) {
          setLoading(false)
          return
        }
        try {
          const idToken = await firebaseUser.getIdToken()
          localStorage.setItem('am_fb_token', idToken)
          // Sync with backend — creates user in PostgreSQL if needed
          const res = await api.post('/auth/firebase-sync', { idToken })
          const appUser = {
            ...res.data.user,
            photoURL:    firebaseUser.photoURL,
            displayName: firebaseUser.displayName,
          }
          setUser(appUser)
          localStorage.setItem('am_user', JSON.stringify(appUser))
          localStorage.setItem('am_token', res.data.token) // store backend JWT
          if (res.data.refreshToken) {
            localStorage.setItem('am_refresh_token', res.data.refreshToken)
          }
        } catch {
          // Backend not available — use Firebase user directly
          const appUser = {
            id:       firebaseUser.uid,
            name:     firebaseUser.displayName || firebaseUser.email?.split('@')[0],
            email:    firebaseUser.email,
            role:     'customer',
            photoURL: firebaseUser.photoURL,
          }
          setUser(appUser)
          localStorage.setItem('am_user', JSON.stringify(appUser))
        }
      } else {
        // No Firebase session — keep backend-only session if present
        const storedUser  = localStorage.getItem('am_user')
        const storedToken = localStorage.getItem('am_token')
        if (storedUser && storedToken) {
          try { setUser(JSON.parse(storedUser)) } catch { setUser(null) }
        } else {
          setUser(null)
        }
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  // Direct backend login (admin / technician — bypasses Firebase)
  const loginWithBackend = (userData, token, refreshToken) => {
    localStorage.setItem('am_token', token)
    localStorage.setItem('am_refresh_token', refreshToken || token) // fallback to token if no refresh
    localStorage.setItem('am_user', JSON.stringify(userData))
    setUser(userData)
  }

  // Sign in with Google (1-click sync with backend — blocks onAuthStateChanged from double-syncing)
  const loginWithGoogle = async () => {
    _googleSyncInProgress = true
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const firebaseUser = result.user

      const idToken = await firebaseUser.getIdToken()
      localStorage.setItem('am_fb_token', idToken)

      try {
        // Sync with backend to get backend JWT & user record
        const res = await api.post('/auth/firebase-sync', { idToken })
        const appUser = {
          ...res.data.user,
          photoURL:    firebaseUser.photoURL,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
        }
        setUser(appUser)
        localStorage.setItem('am_user', JSON.stringify(appUser))
        localStorage.setItem('am_token', res.data.token)
        if (res.data.refreshToken) {
          localStorage.setItem('am_refresh_token', res.data.refreshToken)
        }
        return appUser
      } catch (syncErr) {
        console.warn('Backend sync warning, using Firebase fallback:', syncErr.message)
        const appUser = {
          id:       firebaseUser.uid,
          name:     firebaseUser.displayName || firebaseUser.email?.split('@')[0],
          email:    firebaseUser.email,
          role:     'customer',
          photoURL: firebaseUser.photoURL,
        }
        setUser(appUser)
        localStorage.setItem('am_user', JSON.stringify(appUser))
        return appUser
      }
    } finally {
      // Release flag after a brief delay so onAuthStateChanged fires normally on future sessions
      setTimeout(() => { _googleSyncInProgress = false }, 2000)
    }
  }

  // Sign in with email + password
  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password)
    return result.user
  }

  // Register new account
  const register = async (name, email, password, phone) => {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    // Set display name
    await updateProfile(result.user, { displayName: name })
    // Sync to backend — pass password so backend stores password_hash
    // This allows the user to log in with email+password directly later
    try {
      const idToken = await result.user.getIdToken()
      await api.post('/auth/firebase-sync', { idToken, phone, name, password })
    } catch {}
    return result.user
  }

  // Password reset email
  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email)
  }

  // Logout
  const logout = async () => {
    const refreshToken = localStorage.getItem('am_refresh_token')
    
    // Revoke refresh token on backend
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken })
      } catch (err) {
        console.error('Logout error:', err)
      }
    }

    await signOut(auth)
    localStorage.removeItem('am_user')
    localStorage.removeItem('am_token')
    localStorage.removeItem('am_refresh_token')
    localStorage.removeItem('am_fb_token')
    setUser(null)
  }

  // Update local user state & localStorage
  const updateUser = (updatedFields) => {
    setUser(prev => {
      if (!prev) return updatedFields
      const nextUser = { ...prev, ...updatedFields }
      localStorage.setItem('am_user', JSON.stringify(nextUser))
      return nextUser
    })
  }

  // Get fresh token for API calls
  const getToken = async () => {
    const firebaseUser = auth.currentUser
    if (firebaseUser) {
      return await firebaseUser.getIdToken()
    }
    return localStorage.getItem('am_token')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, loginWithBackend, register, resetPassword, logout, getToken, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
