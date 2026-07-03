import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { CalendarCheck, CheckCircle, Satellite, MessageCircle, Tag } from 'lucide-react'

export default function BookingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [services, setServices] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [submitted, setSubmitted] = useState(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    make: '', model: '', year: '', color: '', registration_number: '', chassis_number: '',
    service_id: '', preferred_date: '', problem_description: ''
  })

  useEffect(() => {
    // Sync with backend on mount to ensure token is valid
    const syncUser = async () => {
      try {
        const { auth } = await import('../config/firebase')
        const firebaseUser = auth.currentUser
        if (firebaseUser) {
          const idToken = await firebaseUser.getIdToken(true)
          const res = await api.post('/auth/firebase-sync', { idToken })
          localStorage.setItem('am_token', res.data.token)
        }
      } catch {}
    }
    syncUser()

    api.get('/services').then(r => setServices(r.data.data)).catch(() => {})
    api.get('/vehicles/my').then(r => setVehicles(r.data.data)).catch(() => {})
    const today = new Date().toISOString().split('T')[0]
    setForm(f => ({ ...f, preferred_date: today }))
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Step 1: Get/refresh backend token
      const { auth } = await import('../config/firebase')
      const firebaseUser = auth.currentUser
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken(true)
        const syncRes = await api.post('/auth/firebase-sync', { idToken })
        // Store backend JWT so subsequent calls use it
        if (syncRes.data.token) {
          localStorage.setItem('am_token', syncRes.data.token)
          localStorage.setItem('am_user', JSON.stringify(syncRes.data.user))
        }
      }

      // Step 2: Create/find vehicle
      let vehicleId
      const existingVeh = vehicles.find(v => v.registration_number === form.registration_number)
      if (existingVeh) {
        vehicleId = existingVeh.id
      } else {
        const vRes = await api.post('/vehicles', {
          make: form.make, model: form.model,
          year: form.year || null, color: form.color || null,
          registration_number: form.registration_number,
          chassis_number: form.chassis_number || null,
        })
        vehicleId = vRes.data.data.id
      }

      // Step 3: Create appointment
      const res = await api.post('/appointments', {
        vehicle_id:          vehicleId,
        service_id:          form.service_id || null,
        preferred_date:      form.preferred_date,
        problem_description: form.problem_description
      })
      setSubmitted(res.data.data)
    } catch (err) {
      console.error('Booking error:', err)
      alert(err.response?.data?.message || 'Booking failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const redirectTimer = useRef(null)

  // Auto-redirect to dashboard after 60s on success screen
  useEffect(() => {
    if (submitted) {
      redirectTimer.current = setTimeout(() => navigate('/dashboard'), 60000)
    }
    return () => { if (redirectTimer.current) clearTimeout(redirectTimer.current) }
  }, [submitted, navigate])

  return (
    <div>
      <Navbar />

      <section className="relative pt-[130px] pb-16 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark-2 to-[#0F3460]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(184,134,11,0.18),transparent_70%)]" />
        <div className="relative z-10">
          <div className="text-xs font-bold tracking-widest text-primary/80 uppercase mb-3">Book Online</div>
          <h1 className="font-display text-5xl text-white mb-3">Book an Appointment</h1>
          <p className="text-white/70">Fill in your details and we'll confirm within 1 hour</p>
        </div>
      </section>

      <section className="bg-[#F5F3EE] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-[1.4fr_1fr] gap-12 items-start">

            {/* FORM */}
            <div className="bg-white rounded-2xl p-10 shadow-sm">
              <h2 className="font-display text-2xl text-dark mb-1">Your Appointment Details</h2>
              <p className="text-sm text-gray-500 mb-7">We'll confirm your booking via WhatsApp within 1 hour.</p>

              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={36} className="text-green-500" />
                  </div>
                  <h3 className="font-bold text-dark text-xl mb-2">Appointment Submitted!</h3>
                  <p className="text-gray-500 mb-4">We'll confirm via WhatsApp within 1 hour.</p>
                  <div className="inline-block bg-primary/10 text-primary font-bold px-5 py-2 rounded-full mb-6">
                    Tracking: {submitted.tracking_number}
                  </div>
                   <div className="flex flex-wrap gap-3 justify-center">
                    <button onClick={() => navigate('/track/' + submitted.tracking_number)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-full text-sm hover:bg-primary-dark transition-colors">
                      <Satellite size={15} /> Track Vehicle
                    </button>
                    <a href={`https://wa.me/265999000000?text=${encodeURIComponent(
                      `Hello AutoMedic!\n\nNew Appointment:\nName: ${user?.name || 'Customer'}\nVehicle: ${form.make} ${form.model}\nReg: ${form.registration_number}\nService: ${services.find(s => s.id === form.service_id)?.name || 'Repair Service'}\nDate: ${form.preferred_date}\nTracking: ${submitted.tracking_number}`
                    )}`}
                      target="_blank" rel="noreferrer"
                      onClick={() => { setTimeout(() => navigate('/dashboard'), 500) }}
                      className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white font-semibold rounded-full text-sm hover:bg-green-600 transition-colors">
                      <MessageCircle size={15} /> Send WhatsApp Confirm
                    </a>
                    <button onClick={() => navigate('/dashboard')}
                      className="px-5 py-2.5 border-2 border-primary text-primary font-semibold rounded-full text-sm hover:bg-primary hover:text-white transition-colors">
                      Go to Dashboard
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Row 1: Make + Model */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Vehicle Make <span className="text-red-500">*</span></label>
                      <input value={form.make} onChange={e=>set('make',e.target.value)} required placeholder="e.g. Toyota"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Vehicle Model <span className="text-red-500">*</span></label>
                      <input value={form.model} onChange={e=>set('model',e.target.value)} required placeholder="e.g. Corolla"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
                    </div>
                  </div>

                  {/* Row 2: Year + Color */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Year</label>
                      <input type="number" min="1990" max={new Date().getFullYear() + 1}
                        value={form.year} onChange={e=>set('year',e.target.value)}
                        placeholder="e.g. 2019"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Vehicle Colour</label>
                      <input value={form.color} onChange={e=>set('color',e.target.value)}
                        placeholder="e.g. Silver, White, Black"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
                    </div>
                  </div>

                  {/* Row 3: Registration + Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Registration <span className="text-red-500">*</span></label>
                      <input value={form.registration_number} onChange={e=>set('registration_number',e.target.value)} required placeholder="MK 1234"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Preferred Date <span className="text-red-500">*</span></label>
                      <input type="date" min={today} value={form.preferred_date} onChange={e=>set('preferred_date',e.target.value)} required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
                    </div>
                  </div>

                  {/* Row 4: VIN + Service */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        VIN / Chassis Number
                        <span className="ml-1.5 text-[11px] font-normal text-gray-400">(optional)</span>
                      </label>
                      <input value={form.chassis_number} onChange={e=>set('chassis_number',e.target.value)}
                        placeholder="e.g. JN1AZ4EH2FM301234"
                        maxLength={17}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-mono tracking-wider uppercase placeholder-normal placeholder:font-sans placeholder:tracking-normal placeholder:normal-case" />
                      <p className="text-[10px] text-gray-400 mt-1">17-character Vehicle Identification Number found on your dashboard or logbook</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Service Needed <span className="text-red-500">*</span></label>
                      <select value={form.service_id} onChange={e=>set('service_id',e.target.value)} required className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 bg-white h-[50px]">
                        <option value="">-- Select a service --</option>
                        {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Problem Description</label>
                    <textarea rows={4} value={form.problem_description} onChange={e=>set('problem_description',e.target.value)} placeholder="Describe the issue with your vehicle..." className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none" />
                  </div>
                  <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all disabled:opacity-60">
                    <CalendarCheck size={18} /> {loading ? 'Submitting...' : 'Submit Appointment'}
                  </button>
                </form>
              )}
            </div>

            {/* SIDEBAR INFO */}
            <div className="sticky top-24">
              <div className="h-52 bg-gradient-to-br from-dark to-[#0F3460] rounded-2xl flex items-center justify-center mb-7 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(184,134,11,0.2),transparent_70%)]" />
                <CalendarCheck size={56} className="text-primary/70 relative z-10 drop-shadow-[0_0_20px_rgba(184,134,11,0.4)]" />
              </div>
              <h3 className="font-display text-2xl text-dark mb-1">Quick & Easy</h3>
              <p className="font-bold text-primary mb-3 text-sm">Book in Under 2 Minutes</p>
              <p className="text-sm text-gray-500 mb-7">Our online booking system means you don't have to call or drive to the garage just to schedule a service.</p>
              <div className="flex flex-col gap-4">
                {[
                  [CheckCircle, 'Instant Confirmation', 'Get a WhatsApp confirmation within 1 hour'],
                  [Satellite, 'Track Progress', "After booking, track your vehicle's repair status live"],
                  [MessageCircle, 'WhatsApp Updates', "Get notified at every stage of your vehicle's repair"],
                  [Tag, 'Transparent Pricing', 'All prices shown upfront — no surprise bills'],
                ].map(([Icon, title, desc], i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center flex-shrink-0"><Icon size={16} /></div>
                    <div><p className="font-bold text-dark text-sm">{title}</p><p className="text-xs text-gray-500">{desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
