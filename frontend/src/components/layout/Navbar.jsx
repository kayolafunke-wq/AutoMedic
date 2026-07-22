import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isActive = (path) => location.pathname === path

  const dashLink = user?.role === 'admin' ? '/admin' : user?.role === 'technician' ? '/technician' : user?.role === 'stockkeeper' ? '/stockkeeper' : '/dashboard'

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 transition-shadow ${scrolled ? 'shadow-md' : ''}`}>
      <div className="max-w-7xl mx-auto px-6 h-[70px] flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-white font-black text-sm">AM</div>
          <span className="font-black text-xl text-dark">AutoMedic</span>
        </Link>

        {/* Desktop Nav */}
        <ul className="hidden md:flex items-center gap-1">
          {[['/', 'Home'], ['/services', 'Services'], ['/products', 'Products'], ['/booking', 'Book Appointment'], ['/track', 'Track Vehicle']].map(([path, label]) => (
            <li key={path}>
              <Link to={path} className={`px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${isActive(path) ? 'text-primary bg-primary/10' : 'text-gray-500 hover:text-primary hover:bg-primary/10'}`}>
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <Link to={dashLink} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                Dashboard
              </Link>
              <button onClick={logout} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-primary transition-colors">Login</Link>
              <Link to="/booking" className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-full hover:bg-primary-dark transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30">
                Book Now
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-1" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu - Stunning dropdown */}
      {open && (
        <div className="md:hidden absolute top-[70px] right-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 py-3 min-w-[220px] z-50 animate-fadeIn">
          {/* Decorative gradient bar */}
          <div className="h-1 bg-gradient-to-r from-primary via-yellow-500 to-primary mx-4 rounded-full mb-3"></div>
          
          {[
            ['/', 'Home'],
            ['/services', 'Services'], 
            ['/products', 'Products'], 
            ['/booking', 'Book Appointment'], 
            ['/track', 'Track Vehicle']
          ].map(([path, label]) => (
            <Link 
              key={path} 
              to={path} 
              onClick={() => setOpen(false)} 
              className={`group flex items-center gap-3 px-5 py-3.5 mx-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 ${
                isActive(path) 
                  ? 'text-white bg-gradient-to-r from-primary to-primary-dark shadow-lg shadow-primary/30' 
                  : 'text-gray-700 hover:bg-primary/10 hover:text-primary'
              }`}
            >
              <div className={`w-2 h-2 rounded-full transition-all duration-200 ${
                isActive(path) ? 'bg-white' : 'bg-primary/30 group-hover:bg-primary'
              }`}></div>
              {label}
            </Link>
          ))}
          
          {/* Elegant divider */}
          <div className="flex items-center gap-3 my-4 mx-5">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
            <div className="w-2 h-2 bg-primary/20 rounded-full"></div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
          </div>
          
          {/* User actions with icons */}
          {user ? (
            <>
              <Link 
                to={dashLink} 
                onClick={() => setOpen(false)}
                className="group flex items-center gap-3 px-5 py-3.5 mx-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 hover:scale-105"
              >
                <div className="w-2 h-2 rounded-full bg-blue-400/30 group-hover:bg-blue-500 transition-all duration-200"></div>
                Dashboard
              </Link>
              <button 
                onClick={() => { logout(); setOpen(false) }} 
                className="group flex items-center gap-3 w-full text-left px-5 py-3.5 mx-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200 hover:scale-105"
              >
                <div className="w-2 h-2 rounded-full bg-red-400/30 group-hover:bg-red-500 transition-all duration-200"></div>
                Logout
              </button>
            </>
          ) : (
            <Link 
              to="/login" 
              onClick={() => setOpen(false)} 
              className="group flex items-center gap-3 px-5 py-3.5 mx-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-green-50 hover:text-green-600 transition-all duration-200 hover:scale-105"
            >
              <div className="w-2 h-2 rounded-full bg-green-400/30 group-hover:bg-green-500 transition-all duration-200"></div>
              Login
            </Link>
          )}
          
          {/* Bottom gradient accent */}
          <div className="h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent mx-4 rounded-full mt-3"></div>
        </div>
      )}
    </nav>
  )
}
