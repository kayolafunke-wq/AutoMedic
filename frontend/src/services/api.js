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
    const originalRequest = err.config

    // If 401 and we haven't retried yet
    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // Try refresh token first (for backend users: admin, technician, stockkeeper)
      const refreshToken = localStorage.getItem('am_refresh_token')
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken })
          
          // Update tokens
          localStorage.setItem('am_token', data.token)
          localStorage.setItem('am_refresh_token', data.refreshToken)
          localStorage.setItem('am_user', JSON.stringify(data.user))
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${data.token}`
          return axios(originalRequest)
        } catch (refreshErr) {
          // Refresh failed - clear everything and redirect to login
          localStorage.removeItem('am_token')
          localStorage.removeItem('am_refresh_token')
          localStorage.removeItem('am_user')
          localStorage.removeItem('am_fb_token')
          window.location.href = '/login'
          return Promise.reject(refreshErr)
        }
      }

      // Fallback: try Firebase token refresh (for customer accounts)
      const stored = localStorage.getItem('am_token')
      if (stored) {
        try {
          const { auth } = await import('../config/firebase')
          const firebaseUser = auth.currentUser
          if (firebaseUser) {
            const idToken = await firebaseUser.getIdToken(true)
            const syncRes = await api.post('/auth/firebase-sync', { idToken })
            if (syncRes.data.token && syncRes.data.refreshToken) {
              localStorage.setItem('am_token', syncRes.data.token)
              localStorage.setItem('am_refresh_token', syncRes.data.refreshToken)
              localStorage.setItem('am_user', JSON.stringify(syncRes.data.user))
              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${syncRes.data.token}`
              return axios(originalRequest)
            }
          }
        } catch {}
      }

      // If all refresh attempts failed, clear tokens and redirect
      localStorage.removeItem('am_token')
      localStorage.removeItem('am_refresh_token')
      localStorage.removeItem('am_user')
      localStorage.removeItem('am_fb_token')
      window.location.href = '/login'
    }

    return Promise.reject(err)
  }
)

export default api
