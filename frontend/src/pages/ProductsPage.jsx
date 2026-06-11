import { useState, useEffect } from 'react'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { MessageCircle, Circle, Battery, Zap, Filter, Settings, X } from 'lucide-react'
import api from '../services/api'

const CATEGORIES = ['All', 'tyres', 'batteries', 'oils', 'filters', 'brakes', 'parts']

const iconMap = { tyres: Circle, batteries: Battery, oils: Zap, filters: Filter, brakes: Circle, parts: Settings }
const gradients = ['from-dark via-dark-2 to-[#1565C0]','from-dark to-[#0F3460]','from-dark-2 to-[#2E7D32]','from-dark to-[#6A1B9A]','from-dark-2 to-[#AD1457]','from-dark to-dark-2']

const FALLBACK = [
  { id:1, name:'Bridgestone Tyres 185/65R15', description:'All-season performance tyre with excellent grip.', category:'tyres', price:45000, stock_quantity:20 },
  { id:2, name:'Exide 60Ah Car Battery', description:'Maintenance-free sealed battery, 24-month warranty.', category:'batteries', price:95000, stock_quantity:10 },
  { id:3, name:'Castrol EDGE 5W-30 4L', description:'Full synthetic engine oil with fluid titanium technology.', category:'oils', price:28000, stock_quantity:30 },
  { id:4, name:'Mann Oil Filter Toyota/Nissan', description:'OEM-quality oil filter for Toyota Corolla, Nissan Tiida.', category:'filters', price:4500, stock_quantity:40 },
  { id:5, name:'Brembo Brake Pads Front Set', description:'High-performance ceramic brake pads, low dust.', category:'brakes', price:18000, stock_quantity:15 },
  { id:6, name:'NGK Spark Plugs Set of 4', description:'Premium iridium spark plugs for improved fuel efficiency.', category:'parts', price:12000, stock_quantity:25 },
  { id:7, name:'Michelin SUV 265/65R17', description:'All-terrain tyre for SUVs and 4x4 vehicles.', category:'tyres', price:78000, stock_quantity:5 },
  { id:8, name:'Gates Timing Belt Kit', description:'Complete timing belt kit with tensioner and idler pulley.', category:'parts', price:35000, stock_quantity:8 },
]

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [inquiryProduct, setInquiryProduct] = useState(null)

  useEffect(() => {
    api.get('/products')
      .then(r => setProducts(r.data.data))
      .catch(() => setProducts(FALLBACK))
      .finally(() => setLoading(false))
  }, [])

  const filtered = category === 'All' ? products : products.filter(p => p.category === category)

  const openWhatsApp = (name) => {
    const msg = encodeURIComponent(`Hi AutoMedic! I'm interested in: ${name}. Is it available and what's the price?`)
    window.open(`https://wa.me/265999000000?text=${msg}`, '_blank')
  }

  return (
    <div>
      <Navbar />

      <section className="relative pt-[140px] pb-20 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark-2 to-[#0F3460]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(184,134,11,0.18),transparent_70%)]" />
        <div className="relative z-10">
          <div className="text-xs font-bold tracking-widest text-primary/80 uppercase mb-3">Parts & Products</div>
          <h1 className="font-display text-5xl text-white mb-3">Spare Parts & Products</h1>
          <p className="text-white/70 text-lg">Quality parts and automotive products in stock</p>
        </div>
      </section>

      <section className="bg-[#F5F3EE] py-20">
        <div className="max-w-7xl mx-auto px-6">
          {/* Filter */}
          <div className="flex gap-2 flex-wrap mb-10">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-5 py-2 rounded-full border-[1.5px] font-medium text-sm transition-all capitalize ${category === cat ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-primary hover:text-primary'}`}>
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((p, i) => {
              const Icon = iconMap[p.category] || Settings
              return (
                <div key={p.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all flex flex-col">
                  <div className={`h-48 bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center relative`}>
                    <Icon size={52} className="text-primary/60" />
                    <span className={`absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full ${p.stock_quantity > 10 ? 'bg-green-50 text-green-600' : p.stock_quantity > 0 ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'}`}>
                      {p.stock_quantity > 10 ? 'In Stock' : p.stock_quantity > 0 ? 'Low Stock' : 'Out of Stock'}
                    </span>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <span className="text-xs font-bold text-primary uppercase tracking-widest mb-1 capitalize">{p.category}</span>
                    <h3 className="font-bold text-dark text-sm mb-1">{p.name}</h3>
                    <p className="text-xs text-gray-500 flex-1 leading-relaxed">{p.description}</p>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                      <span className="font-black text-dark">MK {p.price.toLocaleString()}</span>
                      <button onClick={() => setInquiryProduct(p)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-600 text-xs font-semibold rounded-full hover:bg-green-500 hover:text-white transition-colors">
                        <MessageCircle size={12} /> Inquire
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Inquiry Modal */}
      {inquiryProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setInquiryProduct(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-dark text-lg">Product Inquiry</h3>
              <button onClick={() => setInquiryProduct(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"><X size={14} /></button>
            </div>
            <p className="text-sm text-gray-600 mb-1">Interested in:</p>
            <p className="font-bold text-dark mb-4">{inquiryProduct.name}</p>
            <p className="text-sm text-gray-500 mb-6">Send us a WhatsApp message and we'll confirm availability and pricing within 30 minutes.</p>
            <button onClick={() => openWhatsApp(inquiryProduct.name)}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-500 text-white font-semibold rounded-full hover:bg-green-600 transition-colors">
              <MessageCircle size={18} /> Chat on WhatsApp
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
