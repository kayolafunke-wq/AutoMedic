import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { CheckCircle, Circle, ArrowRight, Search, User, Wrench, Calendar, Car } from 'lucide-react'
import WhatsAppIcon from '../components/icons/WhatsAppIcon'
import api from '../services/api'

const STEPS = [
  { key: 'pending',        label: 'Appointment Confirmed' },
  { key: 'confirmed',      label: 'Vehicle Received' },
  { key: 'inspection',     label: 'Physical Inspection' },
  { key: 'diagnosis',      label: 'Diagnosis Complete' },
  { key: 'in_progress',    label: 'Repair In Progress' },
  { key: 'quality_check',  label: 'Quality Inspection' },
  { key: 'completed',      label: 'Ready for Collection' },
]

const stepIndex = (status) => {
  const map = { pending:0, confirmed:1, inspection:2, diagnosis:3, in_progress:4, quality_check:5, completed:6 }
  return map[status] ?? 0
}

export default function TrackingPage() {
  const { ref } = useParams()
  const [input, setInput] = useState(ref || '')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (ref) search(ref)
  }, [ref])

  const search = async (val) => {
    const q = (val || input).trim().toUpperCase()
    if (!q) return
    setLoading(true); setError(''); setData(null)

    try {
      const res = await api.get(`/appointments/track/${q}`)
      setData(res.data.data)
    } catch {
      setError('Vehicle not found. Please check the tracking number or registration.')
    } finally { setLoading(false) }
  }

  const currentIdx = data ? stepIndex(data.job_status || data.status) : 0
  const progress = data?.progress || [0, 15, 30, 50, 65, 85, 100][currentIdx] || 0

  return (
    <div>
      <Navbar />

      <section className="relative pt-[130px] pb-16 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark-2 to-[#0F3460]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(184,134,11,0.18),transparent_70%)]" />
        <div className="relative z-10">
          <div className="text-xs font-bold tracking-widest text-primary/80 uppercase mb-3">Live Status</div>
          <h1 className="font-display text-4xl sm:text-5xl text-white mb-3">Track Your Vehicle</h1>
          <p className="text-white/70">Enter your tracking number or registration to see live status</p>
        </div>
      </section>

      <section className="bg-[#F5F3EE] py-20">
        <div className="max-w-4xl mx-auto px-6">
          {/* Search */}
          <div className="bg-white rounded-2xl p-8 shadow-sm mb-8 max-w-2xl mx-auto">
            <h3 className="font-bold text-dark mb-4">Enter Your Details</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>e.key==='Enter' && search()}
                placeholder="Tracking Number or Registration e.g. AC-2847"
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
              <button onClick={() => search()} disabled={loading}
                className="flex items-center gap-2 px-5 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-60">
                <Search size={16} />{loading ? '...' : 'Search'}
              </button>
            </div>
            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          </div>

          {/* Result */}
          {data && (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
              <div className="space-y-5">
                {/* Vehicle info */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-4 md:gap-5 items-center">
                    <div className="h-32 bg-gradient-to-br from-dark to-dark-2 rounded-xl flex items-center justify-center">
                      <Car size={48} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold mb-1">Tracking #: <span className="text-primary">{data.tracking_number}</span></p>
                      <h2 className="font-bold text-xl text-dark mb-2">{data.make} {data.model} — {data.registration_number}</h2>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${data.job_status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                        {data.job_status || data.status}
                      </span>
                      <div className="flex flex-wrap gap-4 mt-3">
                        {[['customer', User, data.customer_name], ['tech', Wrench, data.technician_name], ['date', Calendar, data.preferred_date]].filter(([,, v]) => v).map(([key, Icon, val], i) => (
                          <span key={i} className="flex items-center gap-1 text-xs text-gray-500">
                            <Icon size={12} /> {val}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex justify-between font-semibold text-sm mb-3"><span>Overall Progress</span><span>{progress}%</span></div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-6">
                    <div className="h-full bg-gradient-to-r from-primary to-yellow-500 rounded-full transition-all duration-700" style={{width:`${progress}%`}} />
                  </div>

                  {/* Timeline */}
                  <div className="space-y-0">
                    {STEPS.map((step, i) => {
                      const done = i < currentIdx
                      const active = i === currentIdx
                      return (
                        <div key={i} className="flex gap-4 relative pb-5 last:pb-0">
                          {i < STEPS.length - 1 && <div className="absolute left-[17px] top-9 bottom-0 w-0.5 bg-gray-100" />}
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10 text-sm ${done ? 'bg-green-50 text-green-600' : active ? 'bg-primary text-white animate-pulse-ring' : 'bg-gray-50 text-gray-400'}`}>
                            {done ? <CheckCircle size={16} /> : active ? <ArrowRight size={14} /> : <Circle size={14} />}
                          </div>
                          <div className="pt-1">
                            <p className={`font-semibold text-sm ${done ? 'text-green-600' : active ? 'text-primary' : 'text-gray-400'}`}>{step.label}</p>
                            {active && <p className="text-xs text-gray-400 mt-0.5">Currently in progress...</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Side panel */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h4 className="font-bold text-dark text-sm mb-4">Repair Summary</h4>
                  {[['Service', data.service_name], ['Technician', data.technician_name], ['Date', data.preferred_date], ['Est. Cost', data.estimated_cost ? `MK ${Number(data.estimated_cost).toLocaleString()}` : 'TBD']].map(([k,v],i) => (
                    <div key={i} className="flex justify-between py-2 border-b border-gray-50 last:border-0 text-sm">
                      <span className="text-gray-500">{k}</span>
                      <span className="font-semibold text-dark">{v || '—'}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h4 className="font-bold text-dark text-sm mb-2">Need an update?</h4>
                  <p className="text-xs text-gray-500 mb-3">Message us directly on WhatsApp.</p>
                  <a href={`https://wa.me/265994040900?text=Hi AutoMedic, please update me on ${data.tracking_number}`} target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-500 text-white font-semibold text-sm rounded-xl hover:bg-green-600 transition-colors">
                    <WhatsAppIcon size={16} /> WhatsApp Us
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}

