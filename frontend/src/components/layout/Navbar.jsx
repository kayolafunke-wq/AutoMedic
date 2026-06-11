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

  const dashLink = user?.role === 'admin' ? '/admin' : user?.role === 'technician' ? '/technician' : '/dashboard'

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

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-2">
          {[['/', 'Home'], ['/services', 'Services'], ['/products', 'Products'], ['/booking', 'Book Appointment'], ['/track', 'Track Vehicle']].map(([path, label]) => (
            <Link key={path} to={path} onClick={() => setOpen(false)} className={`py-2 text-sm font-medium ${isActive(path) ? 'text-primary' : 'text-gray-600'}`}>{label}</Link>
          ))}
          {user
            ? <button onClick={() => { logout(); setOpen(false) }} className="py-2 text-sm font-medium text-left text-gray-600">Logout</button>
            : <Link to="/login" onClick={() => setOpen(false)} className="py-2 text-sm font-medium text-gray-600">Login</Link>
          }
        </div>
      )}
    </nav>
  )
}
