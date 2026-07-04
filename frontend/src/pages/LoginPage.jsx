import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle, CheckCircle, ArrowLeft, Car, Wrench, Settings, Zap } from 'lucide-react'
import api from '../services/api'

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
    <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
    <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
    <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/>
  </svg>
)

function Field({ label, icon, type, value, onChange, placeholder, required, suffix, autoComplete }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">{icon}</span>
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} required={required} autoComplete={autoComplete}
          className="w-full pl-10 pr-10 py-3 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] bg-gray-50 focus:bg-white transition-all placeholder-gray-300" />
        {suffix && <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{suffix}</span>}
      </div>
    </div>
  )
}

export default function LoginPage() {
  const { loginWithGoogle, loginWithBackend, register, resetPassword } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  // Support both ?redirect= query param and location.state.from
  const searchParams = new URLSearchParams(location.search)
  const redirectTo   = searchParams.get('redirect')
  const from         = redirectTo ? decodeURIComponent(redirectTo) : location.state?.from

  const [mode,     setMode]     = useState('login')
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [phone,    setPhone]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [error,    setError]    = useState('')
  const [info,     setInfo]     = useState('')
  const [googleOnly, setGoogleOnly] = useState(false)
  const [loading,  setLoading]  = useState(false)

  const goAfterLogin = (role) => {
    const dest = from || (role === 'admin' ? '/admin' : role === 'technician' ? '/technician' : role === 'stockkeeper' ? '/stockkeeper' : '/dashboard')
    navigate(dest, { replace: true })
  }

  // ── LOGIN: always use backend directly ──
  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      loginWithBackend(res.data.user, res.data.token)
      goAfterLogin(res.data.user.role)
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password.'
      const isGoogleAccount = err.response?.data?.google_account === true
      if (isGoogleAccount) {
        setGoogleOnly(true)
        setError('')
      } else {
        setGoogleOnly(false)
        setError(msg)
      }
    } finally { setLoading(false) }
  }

  // ── GOOGLE: customers only ──
  const handleGoogle = async () => {
    setError(''); setLoading(true)
    try {
      await loginWithGoogle()
      setTimeout(() => {
        const stored = JSON.parse(localStorage.getItem('am_user') || '{}')
        goAfterLogin(stored.role || 'customer')
      }, 1200)
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user')
        setError('Google sign-in failed. Please try again.')
    } finally { setLoading(false) }
  }

  // ── REGISTER: Firebase for customers ──
  const handleRegister = async (e) => {
    e.preventDefault(); setError('')
    if (password !== confirm) return setError('Passwords do not match.')
    if (password.length < 6)  return setError('Password must be at least 6 characters.')
    setLoading(true)
    try {
      await register(name, email, password, phone)
      setTimeout(() => goAfterLogin('customer'), 800)
    } catch (err) {
      setError(
        err.code === 'auth/email-already-in-use' ? 'An account with this email already exists.' :
        err.code === 'auth/weak-password'        ? 'Password is too weak.' :
        err.message || 'Registration failed.'
      )
    } finally { setLoading(false) }
  }

  const handleForgot = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      // Use backend forgot-password — works for ALL roles (admin, technician, stockkeeper, customer)
      await api.post('/auth/forgot-password', { email })
      setInfo('If that email is registered, a reset link has been sent. Check your inbox.')
    } catch (err) {
      setError('Failed to send reset email. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="h-screen flex overflow-hidden">

      {/* ── LEFT PANEL — static, never scrolls ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[48%] flex-col relative overflow-hidden flex-shrink-0 sticky top-0 h-screen">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="/login-bg.jpg"
            alt=""
            className="w-full h-full object-cover object-center"
          />
          {/* Dark overlay so text stays readable */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0d1117]/85 via-[#1A1A2E]/75 to-[#0F3460]/70" />
          {/* Subtle gold glow at bottom-left */}
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#B8860B]/15 rounded-full blur-[120px] -translate-x-1/4 translate-y-1/4 pointer-events-none" />
        </div>

        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#B8860B] rounded-2xl flex items-center justify-center text-white font-black text-base shadow-xl shadow-[#B8860B]/40">AM</div>
            <span className="font-black text-xl text-white tracking-tight">AutoMedic</span>
          </Link>

          {/* Centre — smaller icon ring with a wrench in the middle */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-[200px] h-[200px]">
              {/* Circle guide */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="72" fill="none" stroke="rgba(184,134,11,0.12)" strokeWidth="1" />
                {[-90, 0, 90, 180].map((angle, i) => {
                  const rad = (angle * Math.PI) / 180
                  return (
                    <line key={i}
                      x1={100} y1={100}
                      x2={100 + 68 * Math.cos(rad)}
                      y2={100 + 68 * Math.sin(rad)}
                      stroke="rgba(184,134,11,0.12)" strokeWidth="1" strokeDasharray="3 3"
                    />
                  )
                })}
              </svg>

              {/* Centre — single wrench icon (not AM logo) */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[52px] h-[52px] bg-[#B8860B] rounded-2xl flex items-center justify-center shadow-2xl shadow-[#B8860B]/50">
                  <Wrench size={26} className="text-white" />
                </div>
              </div>

              {/* 4 icons at top / right / bottom / left */}
              {[
                { Icon: Car,      label: 'Book',    angle: -90 },
                { Icon: Settings, label: 'Track',   angle: 0   },
                { Icon: Zap,      label: 'Alerts',  angle: 90  },
                { Icon: Phone,    label: 'Support', angle: 180 },
              ].map(({ Icon, label, angle }, i) => {
                const rad = (angle * Math.PI) / 180
                const r   = 72
                const x   = 100 + r * Math.cos(rad) - 22
                const y   = 100 + r * Math.sin(rad) - 22
                return (
                  <div key={i} className="absolute flex flex-col items-center gap-1" style={{ left: x, top: y, width: 44 }}>
                    <div className="w-[44px] h-[44px] bg-white/8 border border-[#B8860B]/25 rounded-xl flex items-center justify-center backdrop-blur-sm hover:bg-[#B8860B]/20 hover:border-[#B8860B]/50 transition-all">
                      <Icon size={18} className="text-[#B8860B]" />
                    </div>
                    <span className="text-white/40 text-[9px] font-semibold text-center">{label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Bottom tagline */}
          <div className="mt-auto">
            <h1 className="font-display text-3xl text-white leading-tight mb-2">
              Lilongwe's Premier<br/>
              <span className="text-[#B8860B]">Garage Platform</span>
            </h1>
            <p className="text-white/45 text-sm">Professional service. Full digital transparency.</p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — form, scrolls independently ── */}
      <div className="flex-1 flex items-start justify-center p-6 bg-white overflow-y-auto min-h-screen">
        <div className="w-full max-w-[380px] py-10">

          {/* Mode tabs */}
          {mode !== 'forgot' && (
            <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-8">
              <button onClick={() => { setMode('login'); setError(''); setInfo(''); setGoogleOnly(false) }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${mode==='login' ? 'bg-white text-[#B8860B] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                Sign In
              </button>
              <button onClick={() => { setMode('register'); setError(''); setInfo(''); setGoogleOnly(false) }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${mode==='register' ? 'bg-white text-[#B8860B] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                Create Account
              </button>
            </div>
          )}

          {/* Title */}
          <div className="mb-7">
            {mode === 'forgot' && (
              <button onClick={() => { setMode('login'); setError(''); setInfo('') }}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#B8860B] transition-colors mb-4">
                <ArrowLeft size={13} /> Back to sign in
              </button>
            )}
            <h2 className="font-display text-2xl font-bold text-[#1A1A2E]">
              {mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create your account' : 'Reset password'}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {mode === 'login' ? 'Enter your credentials to access your dashboard' :
               mode === 'register' ? 'Join AutoMedic — free for customers' :
               "Enter your email and we'll send a reset link"}
            </p>
          </div>

          {/* Alerts */}
          {googleOnly && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl mb-5 overflow-hidden">
              <div className="flex items-start gap-3 px-4 py-3.5">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <GoogleIcon />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-blue-800 text-sm">This account uses Google Sign-In</p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    You created this account with Google. Use the button below to sign in.
                  </p>
                </div>
              </div>
              <button onClick={handleGoogle} disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 py-3 bg-white border-t border-blue-100 text-sm font-semibold text-gray-700 hover:bg-blue-50 transition-colors disabled:opacity-60">
                <GoogleIcon /> Continue with Google
              </button>
            </div>
          )}
          {!googleOnly && error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-5 text-sm">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />{error}
            </div>
          )}
          {info && (
            <div className="flex items-start gap-2.5 bg-green-50 border border-green-100 text-green-600 px-4 py-3 rounded-xl mb-5 text-sm">
              <CheckCircle size={15} className="mt-0.5 flex-shrink-0" />{info}
            </div>
          )}

          {/* Google button — register only (not login) */}
          {mode === 'register' && (
            <>
              <button onClick={handleGoogle} disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 border-2 border-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-60 mb-5">
                <GoogleIcon /> Sign up with Google
              </button>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-300 font-medium">or with email</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
            </>
          )}

          {/* LOGIN FORM — no role tabs, just email + password */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <Field label="Email address" icon={<Mail size={15}/>} type="email" value={email} onChange={setEmail} placeholder="your@email.com" required autoComplete="email"/>
              <div>
                <Field label="Password" icon={<Lock size={15}/>} type={showPwd?'text':'password'} value={password} onChange={setPassword} placeholder="Your password" required autoComplete="current-password"
                  suffix={<button type="button" onClick={()=>setShowPwd(!showPwd)} className="text-gray-400 hover:text-gray-600">{showPwd?<EyeOff size={14}/>:<Eye size={14}/>}</button>} />
                <div className="flex justify-end mt-1.5">
                  <button type="button" onClick={() => { setMode('forgot'); setError(''); setInfo('') }}
                    className="text-xs text-[#B8860B] hover:text-[#8B6508] font-medium">Forgot password?</button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3.5 bg-[#B8860B] text-white font-bold rounded-xl hover:bg-[#8B6508] transition-all disabled:opacity-60 hover:shadow-lg hover:shadow-[#B8860B]/30 text-sm mt-1">
                {loading
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Signing in...</span>
                  : 'Sign In'}
              </button>
              {/* Google option for customers on login too */}
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-300 font-medium">or</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <button type="button" onClick={handleGoogle} disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 border-2 border-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-60">
                <GoogleIcon /> Continue with Google
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <Field label="Full Name" icon={<User size={15}/>} type="text" value={name} onChange={setName} placeholder="e.g. John Banda" required autoComplete="name"/>
              <Field label="Email address" icon={<Mail size={15}/>} type="email" value={email} onChange={setEmail} placeholder="your@email.com" required autoComplete="email"/>
              <Field label="Phone (WhatsApp)" icon={<Phone size={15}/>} type="tel" value={phone} onChange={setPhone} placeholder="+265 999 000 000" autoComplete="tel"/>
              <Field label="Password" icon={<Lock size={15}/>} type={showPwd?'text':'password'} value={password} onChange={setPassword} placeholder="Min 6 characters" required autoComplete="new-password"
                suffix={<button type="button" onClick={()=>setShowPwd(!showPwd)} className="text-gray-400">{showPwd?<EyeOff size={14}/>:<Eye size={14}/>}</button>}/>
              <Field label="Confirm Password" icon={<Lock size={15}/>} type="password" value={confirm} onChange={setConfirm} placeholder="Repeat password" required autoComplete="new-password"/>
              <button type="submit" disabled={loading}
                className="w-full py-3.5 bg-[#B8860B] text-white font-bold rounded-xl hover:bg-[#8B6508] transition-all disabled:opacity-60 hover:shadow-lg hover:shadow-[#B8860B]/30 text-sm">
                {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Creating account...</span> : 'Create Account'}
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <Field label="Email address" icon={<Mail size={15}/>} type="email" value={email} onChange={setEmail} placeholder="your@email.com" required autoComplete="email"/>
              <button type="submit" disabled={loading}
                className="w-full py-3.5 bg-[#B8860B] text-white font-bold rounded-xl hover:bg-[#8B6508] transition-all disabled:opacity-60 text-sm">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <Link to="/" className="text-xs text-gray-300 hover:text-[#B8860B] transition-colors flex items-center justify-center gap-1">
              <ArrowLeft size={11} /> Back to AutoMedic website
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}


