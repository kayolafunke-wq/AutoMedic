import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import {
  Battery, Zap, Filter, Settings, X,
  Search, ChevronDown, CheckCircle, Package, ShoppingBag,
  CalendarCheck, Car, Wrench, Shield,
} from 'lucide-react'
import WhatsAppIcon from '../components/icons/WhatsAppIcon'
import api from '../services/api'

// ── Icon by category ──────────────────────────────────────────────────────────
const getCatIcon = (cat = '') => {
  const c = cat.toLowerCase()
  if (c === 'batteries'  || c === 'electrical') return Battery
  if (c === 'oils')                             return Zap
  if (c === 'filters')                          return Filter
  if (c === 'tyres')                            return Package
  if (c === 'brakes')                           return Settings
  return Settings
}

const GRADIENTS = [
  'from-[#1A1A2E] to-[#0F3460]',
  'from-[#0F3460] to-[#1A2744]',
  'from-[#1A1A2E] to-[#0a2a3a]',
  'from-[#162032] to-[#1A1A2E]',
  'from-[#0F3460] to-[#162032]',
  'from-[#1A2744] to-[#1A1A2E]',
]

const fmt = (p) => p ? `MK ${Number(p).toLocaleString()}` : '—'

const stockInfo = (qty) => {
  if (!qty || qty === 0) return { label: 'Out of Stock', cls: 'bg-red-50 text-red-600 border border-red-100' }
  if (qty <= 5)          return { label: 'Low Stock',    cls: 'bg-amber-50 text-amber-600 border border-amber-100' }
  return                        { label: 'In Stock',     cls: 'bg-green-50 text-green-600 border border-green-100' }
}

const FALLBACK = [
  { id:'f1', name:'Bridgestone Tyres 185/65R15', category:'tyres',       price:45000, stock_quantity:20, description:'All-season performance tyre with excellent grip and wet braking.' },
  { id:'f2', name:'Exide 60Ah Car Battery',      category:'batteries',   price:95000, stock_quantity:10, description:'Maintenance-free sealed battery, 24-month warranty.' },
  { id:'f3', name:'Castrol EDGE 5W-30 4L',       category:'oils',        price:28000, stock_quantity:30, description:'Full synthetic engine oil with Fluid Titanium technology.' },
  { id:'f4', name:'Mann Oil Filter',             category:'filters',     price:4500,  stock_quantity:40, description:'OEM-quality oil filter for Toyota Corolla, Nissan Tiida.' },
  { id:'f5', name:'Brembo Brake Pads Front',     category:'brakes',      price:18000, stock_quantity:15, description:'High-performance ceramic brake pads, low dust formula.' },
  { id:'f6', name:'NGK Spark Plugs Set of 4',    category:'parts',       price:12000, stock_quantity:25, description:'Premium iridium spark plugs for improved fuel efficiency.' },
  { id:'f7', name:'Michelin SUV 265/65R17',      category:'tyres',       price:78000, stock_quantity:5,  description:'All-terrain tyre for SUVs and 4x4 vehicles.' },
  { id:'f8', name:'Gates Timing Belt Kit',       category:'parts',       price:35000, stock_quantity:8,  description:'Complete timing belt kit with tensioner and idler pulley.' },
]

const PAGE_STEP = 8

export default function ProductsPage() {
  const [products,        setProducts]        = useState([])
  const [loading,         setLoading]         = useState(true)
  const [search,          setSearch]          = useState('')
  const [category,        setCategory]        = useState('all')
  const [visible,         setVisible]         = useState(PAGE_STEP)
  const [inquiryProduct,  setInquiryProduct]  = useState(null)

  useEffect(() => {
    api.get('/products')
      .then(r => setProducts(r.data.data || []))
      .catch(() => setProducts(FALLBACK))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { setVisible(PAGE_STEP) }, [search, category])

  // Unique categories from loaded data
  const categories = useMemo(() => (
    [...new Set(products.map(p => p.category).filter(Boolean))].sort()
  ), [products])

  // Filter pipeline
  const filtered = useMemo(() => products.filter(p => {
    const matchCat    = category === 'all' || p.category === category
    const matchSearch = !search.trim() ||
      (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  }), [products, search, category])

  const shown     = filtered.slice(0, visible)
  const hasMore   = visible < filtered.length
  const remaining = filtered.length - visible

  const openWhatsApp = (name) => {
    const msg = encodeURIComponent(`Hi AutoMedic! I'm interested in: ${name}. Is it available and what's the price?`)
    window.open(`https://wa.me/265994040900?text=${msg}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-[#F5F3EE]">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative pt-[140px] pb-16 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark-2 to-[#0F3460]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(184,134,11,0.18),transparent_70%)]" />
        <div className="relative z-10 max-w-2xl mx-auto px-6">
          <div className="text-xs font-bold tracking-widest text-primary/80 uppercase mb-3">Parts & Products</div>
          <h1 className="font-display text-4xl sm:text-5xl text-white mb-3">Spare Parts & Products</h1>
          <p className="text-white/70 text-base md:text-lg mb-8">Quality parts and automotive products in stock</p>

          {/* Search bar in hero */}
          <div className="relative max-w-md mx-auto">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search parts — e.g. brake pads, battery..."
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

      {/* ── STICKY CATEGORY FILTER BAR ── */}
      <div className="sticky top-[70px] z-30 bg-[#F5F3EE]/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setCategory('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all border
              ${category === 'all'
                ? 'bg-[#1A1A2E] text-white border-[#1A1A2E]'
                : 'bg-white text-gray-500 border-gray-200 hover:border-[#1A1A2E] hover:text-[#1A1A2E]'}`}>
            All Products
            <span className={`ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${category === 'all' ? 'bg-white/20' : 'bg-gray-100'}`}>
              {products.length}
            </span>
          </button>

          {categories.map(cat => {
            const Icon  = getCatIcon(cat)
            const count = products.filter(p => p.category === cat).length
            return (
              <button key={cat} onClick={() => setCategory(cat)}
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

      {/* ── PRODUCTS GRID ── */}
      <section className="py-14">
        <div className="max-w-7xl mx-auto px-6">

          {/* Results summary */}
          {!loading && (search || category !== 'all') && (
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500">
                {filtered.length === 0
                  ? 'No products found'
                  : <><strong className="text-[#1A1A2E]">{filtered.length}</strong> product{filtered.length !== 1 ? 's' : ''} found
                    {search && <> for "<em>{search}</em>"</>}
                    {category !== 'all' && <> in <em className="capitalize">{category}</em></>}
                  </>
                }
              </p>
              <button onClick={() => { setSearch(''); setCategory('all') }}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                <X size={12} /> Clear filters
              </button>
            </div>
          )}

          {/* Loading skeleton */}
          {loading ? (
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                  <div className="h-44 bg-gray-200 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse" />
                    <div className="h-9 bg-gray-200 rounded-xl animate-pulse mt-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag size={32} className="text-gray-300" />
              </div>
              <h3 className="font-bold text-[#1A1A2E] text-lg mb-2">No products found</h3>
              <p className="text-gray-400 text-sm mb-6">Try a different search term or category</p>
              <button onClick={() => { setSearch(''); setCategory('all') }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A1A2E] text-white text-sm font-semibold rounded-full hover:bg-black transition-colors">
                Show All Products
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                {shown.map((p, i) => {
                  const Icon  = getCatIcon(p.category)
                  const stock = stockInfo(p.stock_quantity)

                  return (
                    <div key={p.id}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 group flex flex-col border border-gray-100">

                      {/* Card image area */}
                      <div className={`h-44 sm:h-48 bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center relative overflow-hidden`}>
                        {p.image_url ? (
                          <>
                            <img 
                              src={p.image_url} 
                              alt={p.name}
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
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_70%,rgba(184,134,11,0.15),transparent_70%)]" />
                            <div className="w-[68px] h-[68px] rounded-2xl bg-white/8 border border-white/15 flex items-center justify-center group-hover:scale-110 group-hover:border-primary/40 transition-all">
                              <Icon size={32} className="text-primary drop-shadow-[0_0_12px_rgba(184,134,11,0.6)]" />
                            </div>
                          </>
                        )}

                        {/* Stock badge */}
                        <div className="absolute top-3 right-3">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${stock.cls}`}>
                            {stock.label}
                          </span>
                        </div>

                        {/* Category pill */}
                        <div className="absolute bottom-3 left-3">
                          <span className="bg-white/10 backdrop-blur-sm text-white/80 text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize border border-white/15">
                            {p.category || 'parts'}
                          </span>
                        </div>
                      </div>

                      {/* Card body */}
                      <div className="p-3.5 sm:p-4 flex flex-col flex-1">
                        <h3 className="font-bold text-[#1A1A2E] text-sm sm:text-base mb-1.5 leading-snug">{p.name}</h3>
                        <p className="text-xs text-gray-500 leading-relaxed flex-1 line-clamp-2 mb-3">
                          {p.description || 'Quality automotive part from AutoMedic.'}
                        </p>

                        {/* Price row */}
                        <div className="flex items-end justify-between mb-3 pb-3 border-b border-gray-100">
                          <div>
                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">Price</p>
                            <p className="font-black text-primary text-base sm:text-lg">{fmt(p.price)}</p>
                          </div>
                          {p.stock_quantity > 0 && (
                            <div className="text-right">
                              <p className={`text-xs sm:text-sm font-bold ${
                                p.stock_quantity <= 3 ? 'text-red-500' : 
                                p.stock_quantity <= 8 ? 'text-orange-500' : 
                                'text-green-600'
                              }`}>
                                {p.stock_quantity} left
                              </p>
                              {p.stock_quantity <= 3 && (
                                <p className="text-[9px] text-red-400 mt-0.5">Low stock!</p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Inquire button */}
                        <button
                          onClick={() => setInquiryProduct(p)}
                          disabled={!p.stock_quantity || p.stock_quantity === 0}
                          className="w-full flex items-center justify-center gap-1.5 py-2.5 sm:py-3 px-3 bg-green-500 text-white text-sm font-semibold rounded-xl hover:bg-green-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed group-hover:shadow-md">
                          <WhatsAppIcon size={18} className="flex-shrink-0" />
                          <span>{p.stock_quantity === 0 ? 'Out of Stock' : 'Inquire on WhatsApp'}</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Show more / less */}
              <div className="mt-10 flex flex-col items-center gap-3">
                {hasMore && (
                  <button onClick={() => setVisible(v => v + PAGE_STEP)}
                    className="flex items-center gap-2 px-7 py-3.5 bg-white border-2 border-[#1A1A2E] text-[#1A1A2E] font-bold rounded-full hover:bg-[#1A1A2E] hover:text-white transition-all text-sm">
                    <ChevronDown size={16} />
                    Show {Math.min(PAGE_STEP, remaining)} more product{Math.min(PAGE_STEP, remaining) !== 1 ? 's' : ''}
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
                    All {filtered.length} products shown
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
          <h2 className="font-display text-3xl text-white mb-3">Can't Find What You Need?</h2>
          <p className="text-white/70 mb-6">Contact us on WhatsApp and we'll source any part for your vehicle.</p>
          <a href="https://wa.me/265994040900?text=Hi%20AutoMedic!%20I%20need%20help%20finding%20a%20spare%20part."
            target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-green-500 text-white font-semibold rounded-full hover:bg-green-600 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-500/30">
            <WhatsAppIcon size={20} /> Chat on WhatsApp
          </a>
        </div>
      </section>

      {/* ── INQUIRY MODAL ── */}
      {inquiryProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setInquiryProduct(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                  <WhatsAppIcon size={20} className="text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1A1A2E] text-base">Product Inquiry</h3>
                  <p className="text-xs text-gray-400">We respond within 30 minutes</p>
                </div>
              </div>
              <button onClick={() => setInquiryProduct(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <X size={14} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <p className="text-xs text-gray-400 mb-0.5">Product</p>
              <p className="font-bold text-[#1A1A2E]">{inquiryProduct.name}</p>
              <p className="text-sm text-primary font-black mt-1">{fmt(inquiryProduct.price)}</p>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              Send us a WhatsApp message and we'll confirm availability and arrange collection or delivery.
            </p>
            <button onClick={() => { openWhatsApp(inquiryProduct.name); setInquiryProduct(null) }}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-500 text-white font-bold rounded-full hover:bg-green-600 transition-colors text-sm">
              <WhatsAppIcon size={18} /> Send WhatsApp Message
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
