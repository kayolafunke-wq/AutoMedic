import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import api from '../services/api'

export default function ResetPasswordPage() {
  const [searchParams]  = useSearchParams()
  const navigate        = useNavigate()
  const token           = searchParams.get('token')

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPwd,   setShowPwd]   = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [success,   setSuccess]   = useState(false)
  const [error,     setError]     = useState('')

  useEffect(() => {
    if (!token) setError('No reset token found. Please request a new reset link.')
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    if (password !== confirm) return setError('Passwords do not match.')
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, new_password: password })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-sm p-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 bg-[#B8860B] rounded-xl flex items-center justify-center text-white font-black text-sm">AM</div>
          <span className="font-black text-lg text-[#1A1A2E]">AutoMedic</span>
        </Link>

        {success ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="font-bold text-xl text-[#1A1A2E] mb-2">Password Reset!</h2>
            <p className="text-gray-500 text-sm mb-4">
              Your password has been updated. Redirecting you to login…
            </p>
            <Link to="/login" className="text-[#B8860B] text-sm font-semibold hover:underline">
              Go to Login →
            </Link>
          </div>
        ) : (
          <>
            <Link to="/login"
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#B8860B] transition-colors mb-6">
              <ArrowLeft size={13} /> Back to sign in
            </Link>

            <h2 className="font-bold text-2xl text-[#1A1A2E] mb-1">Set new password</h2>
            <p className="text-gray-400 text-sm mb-7">Enter a new password for your account.</p>

            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-5 text-sm">
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            {!token ? (
              <div className="text-center mt-4">
                <Link to="/login"
                  className="inline-block px-5 py-2.5 bg-[#B8860B] text-white font-semibold text-sm rounded-xl hover:bg-[#8B6508] transition-colors">
                  Request New Reset Link
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">New Password</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      <Lock size={15} />
                    </span>
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      required
                      autoComplete="new-password"
                      className="w-full pl-10 pr-10 py-3 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] bg-gray-50 focus:bg-white transition-all placeholder-gray-300"
                    />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      <Lock size={15} />
                    </span>
                    <input
                      type="password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Repeat your new password"
                      required
                      autoComplete="new-password"
                      className="w-full pl-10 pr-10 py-3 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] bg-gray-50 focus:bg-white transition-all placeholder-gray-300"
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-3.5 bg-[#B8860B] text-white font-bold rounded-xl hover:bg-[#8B6508] transition-all disabled:opacity-60 text-sm mt-2">
                  {loading
                    ? <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Resetting…
                      </span>
                    : 'Reset Password'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}
