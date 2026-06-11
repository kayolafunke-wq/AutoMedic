import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, User, Wrench, Shield, Lock, AlertCircle } from 'lucide-react'

const DEMO = {
  customer: { email: 'john@example.com', password: 'password123' },
  technician: { email: 'peter@automedic.mw', password: 'password123' },
  admin: { email: 'admin@automedic.mw', password: 'password123' }
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirect = location.state?.from || null

  const [role, setRole] = useState('customer')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      const dest = redirect || (user.role === 'admin' ? '/admin' : user.role === 'technician' ? '/technician' : '/dashboard')
      navigate(dest, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (r) => {
    setRole(r)
    setEmail(DEMO[r].email)
    setPassword(DEMO[r].password)
  }

  const tabs = [
    { key: 'customer', label: 'Customer', icon: User },
    { key: 'technician', label: 'Technician', icon: Wrench },
    { key: 'admin', label: 'Admin', icon: Shield }
  ]

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left — Image Panel */}
      <div className="hidden md:flex relative bg-dark-2 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark-2 to-[#0F3460]" />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,0.05) 40px, rgba(255,255,255,0.05) 41px)' }} />
        {/* Glow effects */}
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-center p-12">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-xl">AM</div>
            <span className="font-black text-2xl text-white">AutoMedic</span>
          </div>

          {/* Icon grid */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            {['🚗', '🔧', '⚙️', '🛢️', '⚡', '🔋', '🛠️', '🔍', '📡'].map((emoji, i) => (
              <div key={i} className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${i === 4 ? 'bg-primary shadow-lg shadow-primary/40' : 'bg-white/8 border border-white/10'}`}>
                {emoji}
              </div>
            ))}
          </div>

          <h2 className="font-display text-3xl text-white leading-tight mb-3">
            Lilongwe's Premier<br />
            <em className="text-primary not-italic">Garage Platform</em>
          </h2>
          <p className="text-white/60 text-sm">Professional service. Full digital transparency.</p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <h2 className="font-display text-3xl text-dark mb-7">Sign in to your account</h2>

          {/* Role tabs */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl mb-7">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setRole(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-all ${role === key ? 'bg-white text-primary shadow' : 'text-gray-500 hover:text-gray-700'}`}>
                <Icon size={14} />{label}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-5 text-sm">
              <AlertCircle size={16} />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-primary text-white font-semibold rounded-full hover:bg-primary-dark transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-xs font-bold text-gray-500 mb-2.5">Demo credentials:</p>
            <div className="flex flex-col gap-1.5">
              {Object.entries(DEMO).map(([r, { email: e }]) => (
                <button key={r} onClick={() => fillDemo(r)}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-left hover:border-primary hover:text-primary transition-colors">
                  <span className="capitalize font-semibold">{r}:</span>
                  <span className="text-gray-500">{e} / password123</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 text-center">
            <a href="/" className="text-sm text-gray-500 hover:text-primary transition-colors">← Back to Website</a>
          </div>
        </div>
      </div>
    </div>
  )
}
