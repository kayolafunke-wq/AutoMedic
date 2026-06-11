import { Link } from 'react-router-dom'
import { MapPin, Phone, Clock, Facebook, Instagram } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-dark text-white/80 pt-16">
      <div className="max-w-7xl mx-auto px-6 pb-10 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-white font-black text-sm">AM</div>
            <span className="font-black text-xl text-white">AutoMedic</span>
          </div>
          <p className="text-sm text-white/60 leading-relaxed mb-5">Lilongwe's most trusted garage management platform. Professional service with full digital transparency.</p>
          <div className="flex gap-2">
            {[Facebook, Instagram].map((Icon, i) => (
              <a key={i} href="#" className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-primary transition-colors">
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4">Platform</h4>
          <ul className="flex flex-col gap-2.5">
            {[['/services', 'Services'], ['/products', 'Products'], ['/booking', 'Book Appointment'], ['/track', 'Track Vehicle']].map(([path, label]) => (
              <li key={path}><Link to={path} className="text-sm text-white/70 hover:text-primary transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4">Account</h4>
          <ul className="flex flex-col gap-2.5">
            {[['/login', 'Customer Login'], ['/login', 'Technician Login'], ['/login', 'Admin Login']].map(([path, label], i) => (
              <li key={i}><Link to={path} className="text-sm text-white/70 hover:text-primary transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4">Contact</h4>
          <div className="flex flex-col gap-3">
            <p className="flex items-center gap-2.5 text-sm text-white/70"><MapPin size={15} className="text-primary flex-shrink-0" /> Area 47, Lilongwe, Malawi</p>
            <p className="flex items-center gap-2.5 text-sm text-white/70"><Phone size={15} className="text-primary flex-shrink-0" /> +265 999 000 000</p>
            <p className="flex items-center gap-2.5 text-sm text-white/70"><Clock size={15} className="text-primary flex-shrink-0" /> Mon–Sat: 7am – 6pm</p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/40">
        © 2024 AutoMedic Garage Management Platform. Lilongwe, Malawi.
      </div>
    </footer>
  )
}
