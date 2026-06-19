import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle, CheckCircle, ArrowLeft, Car, Wrench, Settings, Zap } from 'lucide-react'

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
  const { login, loginWithGoogle, register, resetPassword } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from

  const [mode,     setMode]     = useState('login')
  const [role,     setRole]     = useState('customer')
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [phone,    setPhone]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [error,    setError]    = useState('')
  const [info,     setInfo]     = useState('')
  const [loading,  setLoading]  = useState(false)

  const goAfterLogin = (userRole) => {
    const dest = from || (userRole === 'admin' ? '/admin' : userRole === 'technician' ? '/technician' : '/dashboard')
    navigate(dest, { replace: true })
  }

  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await login(email, password)
      setTimeout(() => {
        const stored = JSON.parse(localStorage.getItem('am_user') || '{}')
        goAfterLogin(stored.role || 'customer')
      }, 1000)
    } catch (err) {
      const c = err.code
      setError(
        c === 'auth/user-not-found'    ? 'No account found with this email.' :
        c === 'auth/wrong-password'    ? 'Incorrect password.' :
        c === 'auth/invalid-credential'? 'Invalid email or password.' :
        c === 'auth/too-many-requests' ? 'Too many failed attempts. Try again later.' :
        c === 'auth/invalid-email'     ? 'Invalid email address.' :
        err.message || 'Sign in failed.'
      )
    } finally { setLoading(false) }
  }

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
        err.code === 'auth/invalid-email'        ? 'Invalid email address.' :
        err.message || 'Registration failed.'
      )
    } finally { setLoading(false) }
  }

  const handleForgot = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await resetPassword(email)
      setInfo('Password reset email sent! Check your inbox.')
    } catch (err) {
      setError(err.code === 'auth/user-not-found' ? 'No account with this email.' : 'Failed to send reset email.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-[520px] flex-col relative overflow-hidden bg-[#1A1A2E] flex-shrink-0">
        {/* Background gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-[#0F3460]" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#B8860B]/15 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-1/4 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl translate-x-1/2" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-[#B8860B] rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-xl shadow-[#B8860B]/40">AM</div>
            <span className="font-black text-2xl text-white tracking-tight">AutoMedic</span>
          </Link>

          {/* Main heading */}
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="font-display text-4xl text-white leading-tight mb-4">
              Lilongwe's Premier<br/>
              <span className="text-[#B8860B]">Garage Platform</span>
            </h1>
            <p className="text-white/50 text-sm leading-relaxed mb-10">
              Book services, track your repairs in real-time, and manage your vehicle with full digital transparency.
            </p>

            {/* Feature list */}
            <div className="space-y-4">
              {[
                [Car,      'Book appointments 24/7 from your phone'],
                [Settings, 'Real-time vehicle repair tracking'],
                [Zap,      'Instant WhatsApp & email notifications'],
                [Wrench,   'Digital inspection & sign-off'],
              ].map(([Icon, text], i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#B8860B]/15 border border-[#B8860B]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className="text-[#B8860B]" />
                  </div>
                  <span className="text-white/60 text-sm">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <p className="text-white/25 text-xs mt-10">© 2024 AutoMedic · Area 47, Lilongwe</p>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white overflow-y-auto">
        <div className="w-full max-w-[400px] py-8">

          {/* Mode tabs */}
          {mode !== 'forgot' && (
            <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-8">
              <button onClick={() => { setMode('login'); setError(''); setInfo('') }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${mode==='login' ? 'bg-white text-[#B8860B] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                Sign In
              </button>
              <button onClick={() => { setMode('register'); setError(''); setInfo('') }}
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
              {mode === 'login'    ? 'Welcome back' :
               mode === 'register' ? 'Create your account' :
               'Reset password'}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {mode === 'login'    ? 'Sign in to manage your vehicle services' :
               mode === 'register' ? 'Join AutoMedic — free for customers' :
               'Enter your email and we\'ll send a reset link'}
            </p>
          </div>

          {/* Role tabs — login only */}
          {mode === 'login' && (
            <div className="flex gap-1.5 mb-6">
              {[['customer','Customer'],['technician','Technician'],['admin','Admin']].map(([r,label]) => (
                <button key={r} onClick={() => setRole(r)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${role===r ? 'bg-[#B8860B] border-[#B8860B] text-white shadow-md shadow-[#B8860B]/30' : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200 hover:text-gray-600'}`}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Alerts */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-5 text-sm">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />{error}
            </div>
          )}
          {info && (
            <div className="flex items-start gap-2.5 bg-green-50 border border-green-100 text-green-600 px-4 py-3 rounded-xl mb-5 text-sm">
              <CheckCircle size={15} className="mt-0.5 flex-shrink-0" />{info}
            </div>
          )}

          {/* Google button — customer + register */}
          {(mode === 'register' || (mode === 'login' && role === 'customer')) && (
            <>
              <button onClick={handleGoogle} disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 border-2 border-gray-100 rounded-xl text-sm font-semibold text-gray-700 hover:border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-60 mb-5 group">
                <GoogleIcon />
                {mode === 'register' ? 'Sign up with Google' : 'Continue with Google'}
              </button>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-300 font-medium">or with email</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
            </>
          )}

          {/* LOGIN FORM */}
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
                {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Signing in...</span> : 'Sign In'}
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
                suffix={<button type="button" onClick={()=>setShowPwd(!showPwd)} className="text-gray-400 hover:text-gray-600">{showPwd?<EyeOff size={14}/>:<Eye size={14}/>}</button>}/>
              <Field label="Confirm Password" icon={<Lock size={15}/>} type="password" value={confirm} onChange={setConfirm} placeholder="Repeat password" required autoComplete="new-password"/>
              <button type="submit" disabled={loading}
                className="w-full py-3.5 bg-[#B8860B] text-white font-bold rounded-xl hover:bg-[#8B6508] transition-all disabled:opacity-60 hover:shadow-lg hover:shadow-[#B8860B]/30 text-sm">
                {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Creating account...</span> : 'Create Account'}
              </button>
              <p className="text-xs text-gray-400 text-center">By creating an account you agree to our Terms of Service</p>
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

          {/* Back to site */}
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
