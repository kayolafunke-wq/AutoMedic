import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthCallback() {
  const { handleGoogleCallback } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  useEffect(() => {
    const token = params.get('token')
    const role  = params.get('role')
    if (!token) { navigate('/login'); return }

    handleGoogleCallback(token)
      .then(user => {
        const dest = user.role === 'admin' ? '/admin'
          : user.role === 'technician' ? '/technician'
          : user.role === 'stockkeeper' ? '/stockkeeper'
          : '/dashboard'
        navigate(dest, { replace: true })
      })
      .catch(() => navigate('/login?error=callback_failed'))
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F2F5]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#B8860B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Signing you in with Google...</p>
      </div>
    </div>
  )
}
