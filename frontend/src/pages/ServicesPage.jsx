import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { Clock, ArrowRight, Wrench, Car, Zap, Thermometer, Settings, Battery, Wind, AlertCircle } from 'lucide-react'
import api from '../services/api'

const iconMap = {
  'Engine Repair': Settings,
  'Brake Repair': AlertCircle,
  'Oil Change': Zap,
  'Wheel Alignment': Car,
  'Car Diagnostics': Wrench,
  'Battery Replacement': Battery,
  'Suspension Repair': Car,
  'Air Conditioning Service': Wind,
}

const gradients = [
  'from-dark via-dark-2 to-[#0F3460]',
  'from-dark-2 via-dark to-[#1A1A2E]',
  'from-[#1A1A2E] via-[#0a2a4a] to-dark-2',
  'from-dark via-[#0F3460] to-dark-2',
]

export default function ServicesPage() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/services')
      .then(r => setServices(r.data.data))
      .catch(() => setServices([
        { id:1, name:'Engine Repair', description:'Complete engine diagnostics and repair services. From minor tune-ups to full engine overhauls by certified technicians.', base_price:25000, duration_hours:24 },
        { id:2, name:'Brake Repair', description:'Full brake system inspection, pad replacement, rotor resurfacing, and brake fluid service for your safety.', base_price:12000, duration_hours:3 },
        { id:3, name:'Oil Change', description:'Fast and efficient oil and filter change using premium quality oils. Keeps your engine running smooth.', base_price:5000, duration_hours:1 },
        { id:4, name:'Wheel Alignment', description:'Precision wheel alignment and balancing to reduce tyre wear, improve handling, and ensure a smooth ride.', base_price:8000, duration_hours:1.5 },
        { id:5, name:'Car Diagnostics', description:'Advanced electronic diagnostics to identify faults, warning lights, and hidden issues.', base_price:7000, duration_hours:1.5 },
        { id:6, name:'Battery Replacement', description:'Battery testing, charging, and replacement with quality batteries for all vehicle makes.', base_price:15000, duration_hours:0.5 },
        { id:7, name:'Suspension Repair', description:'Shock absorbers, struts, springs, and full suspension overhaul to restore ride comfort.', base_price:18000, duration_hours:3 },
        { id:8, name:'Air Conditioning Service', description:'AC regas, leak detection, compressor repair, and full air conditioning system service.', base_price:10000, duration_hours:2 },
      ]))
      .finally(() => setLoading(false))
  }, [])

  const formatDuration = (h) => h >= 24 ? `${Math.round(h/8)} days` : h < 1 ? '30 min' : `${h}–${h+1} hrs`
  const formatPrice = (p) => `MK ${p.toLocaleString()}`

  return (
    <div>
      <Navbar />

      {/* PAGE HERO */}
      <section className="relative pt-[140px] pb-20 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark-2 to-[#0F3460]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(184,134,11,0.18),transparent_70%)]" />
        <div className="relative z-10">
          <div className="text-xs font-bold tracking-widest text-primary/80 uppercase mb-3">What We Offer</div>
          <h1 className="font-display text-5xl text-white mb-3">Our Services</h1>
          <p className="text-white/70 text-lg">Professional automotive services at transparent prices</p>
        </div>
      </section>

      {/* SERVICES GRID */}
      <section className="bg-[#F5F3EE] py-20">
        <div className="max-w-7xl mx-auto px-6">
          {loading ? (
            <div className="grid md:grid-cols-3 gap-7">
              {[...Array(6)].map((_,i) => <div key={i} className="h-80 bg-gray-200 rounded-2xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-7">
              {services.map((svc, i) => {
                const Icon = iconMap[svc.name] || Wrench
                return (
                  <div key={svc.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:-translate-y-1.5 hover:shadow-xl transition-all group flex flex-col">
                    {/* Card image area */}
                    <div className={`h-48 bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center relative overflow-hidden`}>
                      <div className="w-20 h-20 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon size={36} className="text-primary drop-shadow-[0_0_12px_rgba(184,134,11,0.5)]" />
                      </div>
                      {i === 0 && <span className="absolute top-3 left-3 bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-full">Most Popular</span>}
                      {svc.duration_hours <= 1 && <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">Quick Service</span>}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <Icon size={20} className="text-primary mb-2" />
                      <h3 className="font-bold text-dark mb-2">{svc.name}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed flex-1">{svc.description}</p>
                      <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                        <span className="font-bold text-primary text-sm">From {formatPrice(svc.base_price)}</span>
                        <span className="flex items-center gap-1 text-xs text-gray-400"><Clock size={12} />{formatDuration(svc.duration_hours)}</span>
                      </div>
                      <Link to="/booking" className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors">
                        Book This Service <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 bg-dark text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(184,134,11,0.15),transparent_70%)]" />
        <div className="relative z-10 max-w-lg mx-auto px-6">
          <h2 className="font-display text-3xl text-white mb-3">Not Sure What You Need?</h2>
          <p className="text-white/70 mb-6">Book a diagnostic and let our experts assess your vehicle</p>
          <Link to="/booking" className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-white font-semibold rounded-full hover:bg-primary-dark transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30">
            Book a Diagnostic
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
