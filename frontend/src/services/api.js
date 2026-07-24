import axios from 'axios'

// Use environment variable in production, fallback to /api proxy in development
const baseURL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(async (config) => {
  // Use stored backend JWT (most reliable — set after firebase-sync)
  const stored = localStorage.getItem('am_token')
  if (stored) {
    config.headers.Authorization = `Bearer ${stored}`
    return config
  }

  // Fallback: get fresh Firebase token and use it directly
  try {
    const { auth } = await import('../config/firebase')
    const firebaseUser = auth.currentUser
    if (firebaseUser) {
      const token = await firebaseUser.getIdToken()
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch {}

  return config
})

api.interceptors.response.use(
  res => res,
  async err => {
    // If 401 with stored token, try refreshing via Firebase
    if (err.response?.status === 401) {
      const stored = localStorage.getItem('am_token')
      if (stored) {
        try {
          const { auth } = await import('../config/firebase')
          const firebaseUser = auth.currentUser
          if (firebaseUser) {
            const idToken = await firebaseUser.getIdToken(true)
            const syncRes = await api.post('/auth/firebase-sync', { idToken })
            if (syncRes.data.token) {
              localStorage.setItem('am_token', syncRes.data.token)
              // Retry original request with new token
              err.config.headers.Authorization = `Bearer ${syncRes.data.token}`
              return axios(err.config)
            }
          }
        } catch {}
        // If refresh failed, clear token
        localStorage.removeItem('am_token')
        localStorage.removeItem('am_user')
      }
    }
    return Promise.reject(err)
  }
)

export default api
