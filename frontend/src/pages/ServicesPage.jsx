import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import {
  Clock, ArrowRight, Wrench, Car, Zap, Settings, Battery,
  Wind, AlertCircle, Search, X, ChevronDown, CheckCircle, CalendarCheck, Shield,
} from 'lucide-react'
import api from '../services/api'

// ── Icon mapping by name keywords ────────────────────────────────────────────
const getIcon = (name = '', category = '') => {
  const n = name.toLowerCase()
  const c = category.toLowerCase()
  if (n.includes('engine') || c === 'engine')        return Settings
  if (n.includes('brake') || c === 'brakes')         return AlertCircle
  if (n.includes('oil'))                             return Zap
  if (n.includes('wheel') || n.includes('tyre') || c === 'tyres') return Car
  if (n.includes('diagnostic'))                      return Wrench
  if (n.includes('battery') || c === 'electrical')  return Battery
  if (n.includes('suspension') || c === 'suspension') return Car
  if (n.includes('air') || n.includes('ac') || c === 'ac') return Wind
  return Wrench
}

const GRADIENTS = [
  'from-[#1A1A2E] to-[#0F3460]',
  'from-[#0F3460] to-[#1A2744]',
  'from-[#1A1A2E] to-[#0a2a3a]',
  'from-[#162032] to-[#1A1A2E]',
]

const fmtPrice    = (p) => p ? `MK ${Number(p).toLocaleString()}` : 'Call for price'
const fmtDuration = (h) => {
  if (!h) return null
  if (h >= 24)  return `${Math.round(h / 8)} day${Math.round(h/8) !== 1 ? 's' : ''}`
  if (h < 1)    return `${Math.round(h * 60)} min`
  if (h === 1)  return '1 hr'
  return `${h} hrs`
}

const FALLBACK = [
  { id:'f1', name:'Engine Repair',         category:'engine',      base_price:25000, duration_hours:8,   description:'Complete engine diagnostics and repair services, from minor tune-ups to full engine overhauls.' },
  { id:'f2', name:'Brake Repair',          category:'brakes',      base_price:12000, duration_hours:3,   description:'Full brake system inspection, pad replacement, rotor resurfacing, and brake fluid service.' },
  { id:'f3', name:'Oil Change',            category:'general',     base_price:5000,  duration_hours:1,   description:'Fast oil and filter change using premium quality oils to keep your engine running smooth.' },
  { id:'f4', name:'Wheel Alignment',       category:'tyres',       base_price:8000,  duration_hours:1.5, description:'Precision wheel alignment and balancing to reduce tyre wear and improve handling.' },
  { id:'f5', name:'Car Diagnostics',       category:'diagnostics', base_price:7000,  duration_hours:1.5, description:'Advanced electronic diagnostics to identify faults, warning lights, and hidden issues.' },
  { id:'f6', name:'Battery Replacement',   category:'electrical',  base_price:15000, duration_hours:0.5, description:'Battery testing, charging, and replacement with quality batteries for all vehicle makes.' },
  { id:'f7', name:'Suspension Repair',     category:'suspension',  base_price:18000, duration_hours:3,   description:'Shock absorbers, struts, springs, and full suspension overhaul to restore ride comfort.' },
  { id:'f8', name:'Air Conditioning',      category:'ac',          base_price:10000, duration_hours:2,   description:'AC regas, leak detection, compressor repair, and full air conditioning system service.' },
]

const PAGE_STEP = 6  // how many to show at once

export default function ServicesPage() {
  const [services, setServices] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('all')
  const [visible,  setVisible]  = useState(PAGE_STEP)

  useEffect(() => {
    api.get('/services')
      .then(r => setServices(r.data.data || []))
      .catch(() => setServices(FALLBACK))
      .finally(() => setLoading(false))
  }, [])

  // Reset visible count when filter changes
  useEffect(() => { setVisible(PAGE_STEP) }, [search, category])

  // Derive unique categories from loaded services
  const categories = useMemo(() => {
    const cats = [...new Set(services.map(s => s.category).filter(Boolean))]
    return cats.sort()
  }, [services])

  // Filter pipeline
  const filtered = useMemo(() => {
    return services.filter(s => {
      const matchCat    = category === 'all' || s.category === category
      const matchSearch = !search.trim() ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.category || '').toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
  }, [services, search, category])

  const shown      = filtered.slice(0, visible)
  const hasMore    = visible < filtered.length
  const remaining  = filtered.length - visible

  return (
    <div className="min-h-screen bg-[#F5F3EE]">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative pt-[140px] pb-16 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark-2 to-[#0F3460]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(184,134,11,0.18),transparent_70%)]" />
        <div className="relative z-10 max-w-2xl mx-auto px-6">
          <div className="text-xs font-bold tracking-widest text-primary/80 uppercase mb-3">What We Offer</div>
          <h1 className="font-display text-4xl sm:text-5xl text-white mb-3">Our Services</h1>
          <p className="text-white/70 text-base md:text-lg mb-8">
            Professional automotive services at transparent prices
          </p>

          {/* Search bar in hero */}
          <div className="relative max-w-md mx-auto">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search services — e.g. brakes, oil change..."
              className="w-full pl-11 pr-10 py-3.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white placeholder-white/40 text-sm focus:outline-none focus:border-primary focus:bg-white/15 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors">
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── CATEGORY FILTER TABS ── */}
      <div className="sticky top-[70px] z-30 bg-[#F5F3EE]/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setCategory('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all border
              ${category === 'all'
                ? 'bg-[#1A1A2E] text-white border-[#1A1A2E]'
                : 'bg-white text-gray-500 border-gray-200 hover:border-[#1A1A2E] hover:text-[#1A1A2E]'}`}>
            All Services
            <span className={`ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${category === 'all' ? 'bg-white/20' : 'bg-gray-100'}`}>
              {services.length}
            </span>
          </button>

          {categories.map(cat => {
            const Icon = getIcon('', cat)
            const count = services.filter(s => s.category === cat).length
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all border capitalize
                  ${category === cat
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-primary hover:text-primary'}`}>
                <Icon size={11} />
                {cat}
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${category === cat ? 'bg-white/25' : 'bg-gray-100'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── SERVICES GRID ── */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-6">

          {/* Results summary */}
          {!loading && (search || category !== 'all') && (
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500">
                {filtered.length === 0
                  ? 'No services found'
                  : <><strong className="text-[#1A1A2E]">{filtered.length}</strong> service{filtered.length !== 1 ? 's' : ''} found
                    {search && <> for "<em>{search}</em>"</>}
                    {category !== 'all' && <> in <em className="capitalize">{category}</em></>}
                  </>
                }
              </p>
              {(search || category !== 'all') && (
                <button
                  onClick={() => { setSearch(''); setCategory('all') }}
                  className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                  <X size={12} /> Clear filters
                </button>
              )}
            </div>
          )}

          {/* Loading skeleton */}
          {loading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                  <div className="h-44 bg-gray-200 animate-pulse" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-4/5" />
                    <div className="h-9 bg-gray-200 rounded-xl animate-pulse mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            /* Empty state */
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wrench size={32} className="text-gray-300" />
              </div>
              <h3 className="font-bold text-[#1A1A2E] text-lg mb-2">No services found</h3>
              <p className="text-gray-400 text-sm mb-6">
                Try a different search term or category
              </p>
              <button
                onClick={() => { setSearch(''); setCategory('all') }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A1A2E] text-white text-sm font-semibold rounded-full hover:bg-black transition-colors">
                Show All Services
              </button>
            </div>
          ) : (
            <>
              {/* Cards grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                {shown.map((svc, i) => {
                  const Icon = getIcon(svc.name, svc.category)
                  const dur  = fmtDuration(svc.duration_hours)
                  const isQuick = svc.duration_hours && svc.duration_hours <= 1

                  return (
                    <div key={svc.id}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 group flex flex-col border border-gray-100">

                      {/* Card top image */}
                      <div className={`h-44 bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center relative overflow-hidden`}>
                        {svc.image_url ? (
                          <>
                            <img 
                              src={svc.image_url} 
                              alt={svc.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to icon if image fails to load
                                e.target.style.display = 'none'
                              }}
                            />
                            {/* Gradient overlay for text readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          </>
                        ) : (
                          <>
                            {/* Glow */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_70%,rgba(184,134,11,0.15),transparent_70%)]" />
                            {/* Icon */}
                            <div className="w-18 h-18 w-[72px] h-[72px] rounded-2xl bg-white/8 border border-white/15 flex items-center justify-center group-hover:scale-110 group-hover:border-primary/40 transition-all">
                              <Icon size={34} className="text-primary drop-shadow-[0_0_14px_rgba(184,134,11,0.6)]" />
                            </div>
                          </>
                        )}

                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex gap-1.5">
                          {isQuick && (
                            <span className="bg-green-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                              ⚡ Quick
                            </span>
                          )}
                          {i === 0 && category === 'all' && !search && (
                            <span className="bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                              ★ Popular
                            </span>
                          )}
                        </div>

                        {/* Category pill */}
                        <div className="absolute bottom-3 right-3">
                          <span className="bg-white/10 backdrop-blur-sm text-white/80 text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize border border-white/15">
                            {svc.category || 'general'}
                          </span>
                        </div>
                      </div>

                      {/* Card body */}
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-bold text-[#1A1A2E] text-base mb-1.5">{svc.name}</h3>
                        <p className="text-sm text-gray-500 leading-relaxed flex-1 line-clamp-3">
                          {svc.description || 'Professional service by certified AutoMedic technicians.'}
                        </p>

                        {/* Price + duration row */}
                        <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-gray-100">
                          <div>
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">Starting from</p>
                            <p className="font-black text-primary text-base">{fmtPrice(svc.base_price)}</p>
                          </div>
                          {dur && (
                            <div className="text-right">
                              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">Est. Time</p>
                              <p className="flex items-center gap-1 text-sm font-semibold text-gray-600">
                                <Clock size={13} className="text-gray-400" />
                                {dur}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Book button */}
                        <Link
                          to="/booking"
                          className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-[#1A1A2E] text-white text-sm font-semibold rounded-xl hover:bg-primary transition-colors group-hover:bg-primary">
                          Book This Service <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Show more / Show less */}
              <div className="mt-10 flex flex-col items-center gap-3">
                {hasMore && (
                  <button
                    onClick={() => setVisible(v => v + PAGE_STEP)}
                    className="flex items-center gap-2 px-7 py-3.5 bg-white border-2 border-[#1A1A2E] text-[#1A1A2E] font-bold rounded-full hover:bg-[#1A1A2E] hover:text-white transition-all text-sm">
                    <ChevronDown size={16} />
                    Show {Math.min(PAGE_STEP, remaining)} more service{Math.min(PAGE_STEP, remaining) !== 1 ? 's' : ''}
                    <span className="text-xs opacity-50 ml-1">({remaining} remaining)</span>
                  </button>
                )}
                {visible > PAGE_STEP && (
                  <button
                    onClick={() => { setVisible(PAGE_STEP); window.scrollTo({ top: 300, behavior: 'smooth' }) }}
                    className="text-xs text-gray-400 hover:text-gray-600 font-semibold transition-colors">
                    Show less ↑
                  </button>
                )}
                {!hasMore && filtered.length > PAGE_STEP && (
                  <p className="text-xs text-gray-400 flex items-center gap-1.5">
                    <CheckCircle size={13} className="text-green-500" />
                    All {filtered.length} services shown
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-20 bg-dark text-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src="/cta-bg.jpg" 
            alt="Automotive workshop" 
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none' }}
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-dark/90" />
          {/* Radial gradient overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(184,134,11,0.15),transparent_70%)]" />
        </div>
        <div className="relative z-10 max-w-lg mx-auto px-6">
          <h2 className="font-display text-3xl text-white mb-3">Not Sure What You Need?</h2>
          <p className="text-white/70 mb-6">Book a diagnostic and let our certified technicians assess your vehicle for you.</p>
          <Link to="/booking"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-white font-semibold rounded-full hover:bg-primary-dark transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30">
            Book a Diagnostic <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
