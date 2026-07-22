import { useState, useRef, useEffect } from 'react'
import {
  Car, User, ClipboardCheck, Camera, Package, PenLine,
  CheckCircle, ChevronRight, ChevronLeft, AlertTriangle,
  X, Printer, Plus, Trash2
} from 'lucide-react'
import InspectionReportDetails from '../../components/InspectionReportDetails'

/* ─── STEP BAR ──────────────────────────────────────────────────── */
function StepBar({ current, onGoto }) {
  const steps = ['Vehicle Info', 'Condition Check', 'Photos', 'Accessories', 'Submit to Portal']
  return (
    <div className="flex items-center justify-center bg-white border-b border-gray-100 px-6 py-4 mb-6 rounded-2xl shadow-sm">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center">
          <button onClick={() => onGoto(i)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all
              ${current === i ? 'bg-[#B8860B] text-white shadow' : i < current ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:text-gray-600'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0
              ${current === i ? 'bg-white text-[#B8860B]' : i < current ? 'bg-green-500 text-white' : 'bg-gray-100'}`}>
              {i < current ? '✓' : i + 1}
            </span>
            <span className="hidden md:inline">{label}</span>
          </button>
          {i < steps.length - 1 && <div className={`w-8 h-0.5 mx-1 ${i < current ? 'bg-green-400' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  )
}

/* ─── SIGNATURE PAD ─────────────────────────────────────────────── */
function SigPad({ label, id }) {
  const ref = useRef(null)
  const drawing = useRef(false)

  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')
    ctx.strokeStyle = '#1A1A2E'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    const pos = (e) => {
      const r = c.getBoundingClientRect(), sx = c.width / r.width, sy = c.height / r.height
      const src = e.touches?.[0] || e
      return { x: (src.clientX - r.left) * sx, y: (src.clientY - r.top) * sy }
    }
    const d = (e) => { drawing.current = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y) }
    const m = (e) => { if (!drawing.current) return; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke() }
    const u = () => { drawing.current = false }
    c.addEventListener('mousedown', d); c.addEventListener('mousemove', m); c.addEventListener('mouseup', u); c.addEventListener('mouseleave', u)
    c.addEventListener('touchstart', (e) => { e.preventDefault(); d(e) }, { passive: false })
    c.addEventListener('touchmove', (e) => { e.preventDefault(); m(e) }, { passive: false })
    c.addEventListener('touchend', u)
    return () => { c.removeEventListener('mousedown', d); c.removeEventListener('mousemove', m) }
  }, [])

  const clear = () => { const c = ref.current; c.getContext('2d').clearRect(0, 0, c.width, c.height) }

  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 mb-2">{label}</p>
      <div className="border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:border-[#B8860B] transition-colors overflow-hidden relative">
        <canvas ref={ref} id={id} width={560} height={130} className="w-full cursor-crosshair touch-none block" style={{ height: 130 }} />
        <p className="absolute bottom-2 left-3 text-[10px] text-gray-300 pointer-events-none select-none">Sign here ✍</p>
      </div>
      <button onClick={clear} className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
        <X size={11} /> Clear
      </button>
    </div>
  )
}

/* ─── CHECKLIST ITEM (controlled) ──────────────────────────────── */
function CheckItem({ label, options, value, onChange }) {
  const [checked, setChecked] = useState(false)
  const handleCheck = (e) => {
    setChecked(e.target.checked)
    onChange({ checked: e.target.checked, value })
  }
  const handleVal = (e) => {
    onChange({ checked, value: e.target.value })
  }
  return (
    <div className="flex items-start gap-2 py-2 border-b border-gray-50">
      <input type="checkbox" checked={checked} onChange={handleCheck}
        className="w-4 h-4 mt-0.5 accent-[#B8860B] cursor-pointer flex-shrink-0" />
      <span className={`text-xs sm:text-sm flex-1 leading-snug ${checked ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>{label}</span>
      <select value={value} onChange={handleVal}
        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-[#B8860B] text-gray-600 flex-shrink-0 min-w-[80px]">
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  )
}

/* ─── ACCESSORY ITEM (controlled) ──────────────────────────────── */
function AccItem({ icon: Icon, label, checked, onToggle }) {
  return (
    <button onClick={onToggle}
      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-[1.5px] text-sm font-medium transition-all text-left
        ${checked ? 'bg-[#B8860B]/8 border-[#B8860B]/40 text-[#B8860B]' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'}`}>
      <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${checked ? 'bg-[#B8860B] text-white' : 'bg-gray-200 text-gray-400'}`}>
        {checked ? <CheckCircle size={13} /> : <Icon size={13} />}
      </div>
      {label}
    </button>
  )
}

/* ─── DAMAGE MAP ────────────────────────────────────────────────── */
function DamageMap({ damages, onChange }) {
  const zones = [
    { id: 'front', label: 'Front', style: { left: '4%', top: '42%' } },
    { id: 'rear', label: 'Rear', style: { right: '4%', top: '42%' } },
    { id: 'roof', label: 'Roof', style: { left: '43%', top: '4%' } },
    { id: 'hood', label: 'Hood', style: { left: '12%', top: '18%' } },
    { id: 'boot', label: 'Boot', style: { right: '12%', top: '18%' } },
    { id: 'left', label: 'Left Side', style: { left: '43%', top: '75%' } },
    { id: 'right', label: 'R. Side', style: { left: '43%', bottom: '4%' } },
    { id: 'windsh', label: 'Windshield', style: { left: '23%', top: '35%' } },
  ]

  const toggle = (label) => {
    onChange(damages.includes(label) ? damages.filter(d => d !== label) : [...damages, label])
  }

  return (
    <div>
      <div className="bg-[#F5F3EE] rounded-2xl p-4 mb-4 relative" style={{ minHeight: 220 }}>
        <svg viewBox="0 0 500 200" className="w-full max-w-lg mx-auto block" style={{ maxHeight: 180 }}>
          <rect x="60" y="90" width="380" height="80" rx="10" fill="#D0D8E4" stroke="#9BA8B5" strokeWidth="1.5" />
          <rect x="120" y="55" width="260" height="60" rx="10" fill="#BFC9D6" stroke="#9BA8B5" strokeWidth="1.5" />
          <rect x="130" y="60" width="105" height="48" rx="5" fill="#90CAF9" opacity="0.6" />
          <rect x="265" y="60" width="105" height="48" rx="5" fill="#90CAF9" opacity="0.6" />
          <circle cx="140" cy="174" r="22" fill="#37474F" stroke="#263238" strokeWidth="2" />
          <circle cx="140" cy="174" r="11" fill="#607D8B" />
          <circle cx="360" cy="174" r="22" fill="#37474F" stroke="#263238" strokeWidth="2" />
          <circle cx="360" cy="174" r="11" fill="#607D8B" />
          <rect x="44" y="96" width="22" height="50" rx="6" fill="#B0BEC5" stroke="#9BA8B5" strokeWidth="1" />
          <rect x="434" y="96" width="22" height="50" rx="6" fill="#B0BEC5" stroke="#9BA8B5" strokeWidth="1" />
          <rect x="46" y="100" width="16" height="18" rx="3" fill="#FFF176" opacity="0.9" />
          <rect x="438" y="100" width="16" height="18" rx="3" fill="#EF9A9A" opacity="0.9" />
          <line x1="250" y1="92" x2="250" y2="168" stroke="#9BA8B5" strokeWidth="1" strokeDasharray="4,3" />
          <line x1="125" y1="108" x2="145" y2="92" stroke="#9BA8B5" strokeWidth="1.5" />
          <line x1="375" y1="108" x2="355" y2="92" stroke="#9BA8B5" strokeWidth="1.5" />
        </svg>

        <div className="absolute inset-0 pointer-events-none">
          {zones.map(({ id, label, style }) => {
            const marked = damages.includes(label)
            return (
              <button key={id} onClick={() => toggle(label)}
                style={{ ...style, position: 'absolute', transform: 'translate(-50%,-50%)', pointerEvents: 'all' }}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border-[1.5px] whitespace-nowrap transition-all shadow-sm
                  ${marked
                    ? 'bg-red-500 border-red-500 text-white shadow-red-200'
                    : 'bg-white/90 border-gray-300 text-gray-600 hover:border-[#B8860B] hover:text-[#B8860B]'}`}>
                {marked ? '✕ ' : ''}{label}
              </button>
            )
          })}
        </div>

        <p className="text-center text-[10px] text-gray-400 mt-1">Click any area to mark damage</p>
      </div>

      {damages.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-3">
          <p className="text-xs font-bold text-red-500 mb-2">Marked Damages:</p>
          <div className="flex flex-wrap gap-2">
            {damages.map(d => (
              <span key={d} className="flex items-center gap-1 text-xs bg-red-100 text-red-600 px-2.5 py-1 rounded-full font-semibold">
                {d}
                <button onClick={() => onChange(damages.filter(x => x !== d))} className="hover:text-red-800">
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {['Front Bumper', 'Rear Bumper', 'Roof', 'Hood/Bonnet', 'Boot/Trunk', 'Left Side', 'Right Side', 'Windshield', 'Left Wing', 'Right Wing', 'Rear Window', 'Underbody'].map(z => {
          const marked = damages.includes(z)
          return (
            <button key={z} onClick={() => toggle(z)}
              className={`px-2 py-2 rounded-xl text-[10px] font-semibold border-[1.5px] transition-all
                ${marked ? 'bg-red-50 border-red-300 text-red-600' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-[#B8860B] hover:text-[#B8860B]'}`}>
              {marked ? '✕ ' : ''}{z}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── PHOTO UPLOAD ZONE ─────────────────────────────────────────── */
function PhotoZone({ title, type, icon: Icon, hint, photos, setPhotos }) {
  const handleFiles = (e) => {
    Array.from(e.target.files).forEach(f => {
      const r = new FileReader()
      r.onload = ev => setPhotos(prev => [...prev, { type, url: ev.target.result, name: f.name, file: f }])
      r.readAsDataURL(f)
    })
  }
  const mine = photos.filter(p => p.type === type)
  const inputId = `photo-${type}`
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#B8860B]/10 rounded-lg flex items-center justify-center"><Icon size={15} className="text-[#B8860B]" /></div>
          <h3 className="font-bold text-[#1A1A2E] text-sm">{title}</h3>
        </div>
        <span className="bg-[#B8860B]/10 text-[#B8860B] text-[10px] font-bold px-2 py-0.5 rounded-full">{mine.length} photo{mine.length !== 1 ? 's' : ''}</span>
      </div>
      <p className="text-xs text-gray-400 mb-3">{hint}</p>
      <div onClick={() => document.getElementById(inputId).click()}
        className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#B8860B] hover:bg-[#B8860B]/3 transition-all group">
        <Camera size={24} className="text-gray-300 mx-auto mb-1.5 group-hover:text-[#B8860B] transition-colors" />
        <p className="text-xs text-gray-400 group-hover:text-[#B8860B] transition-colors">Click or drag to upload</p>
        <input id={inputId} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
      </div>
      {mine.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {mine.map((p, i) => (
            <div key={i} className="relative">
              <img src={p.url} alt={p.name} className="w-16 h-14 object-cover rounded-lg border border-gray-200" />
              <button onClick={() => setPhotos(prev => prev.filter((_, j) => j !== photos.indexOf(p)))}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white">
                <X size={8} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── MAIN MODULE ───────────────────────────────────────────────── */
export default function InspectionModule({ jobs }) {
  const [selectedJob, setSelectedJob] = useState(null)
  const [existingInsp, setExistingInsp] = useState(null)
  const [loadingInsp, setLoadingInsp] = useState(false)

  const pickJob = async (job) => {
    setLoadingInsp(true)
    try {
      const apiMod = (await import('../../services/api')).default
      const r = await apiMod.get('/inspections/assigned').catch(() => ({ data: { data: [] } }))
      const insp = (r.data.data || []).find(i => i.appointment_id === job.appointment_id)
      if (insp) {
        const detailRes = await apiMod.get(`/inspections/${insp.id}`)
        setExistingInsp(detailRes.data.data)
      } else {
        setExistingInsp(null)
      }
    } catch { setExistingInsp(null) }
    setSelectedJob(job)
    setLoadingInsp(false)
  }

  // ── JOB LIST ─────────────────────────────────────────────────────
  if (!selectedJob) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="font-display text-2xl text-[#1A1A2E]">Vehicle Inspection</h1>
          <p className="text-gray-400 text-sm mt-0.5">Select a job to start or view its inspection</p>
        </div>
        {jobs.length === 0 ? (
          <div className="bg-white rounded-2xl p-14 text-center shadow-sm border border-gray-50">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">🔍</div>
            <h3 className="font-bold text-[#1A1A2E] text-base mb-1">No jobs assigned</h3>
            <p className="text-sm text-gray-400">Jobs assigned to you will appear here.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {jobs.map(job => (
              <button key={job.id} onClick={() => pickJob(job)} disabled={loadingInsp}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 hover:border-[#B8860B]/40 hover:shadow-md hover:-translate-y-0.5 transition-all text-left group disabled:opacity-60">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#1A1A2E] to-[#0F3460] rounded-xl flex items-center justify-center text-2xl flex-shrink-0 relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(184,134,11,0.25),transparent_70%)]" />
                      <span className="relative z-10">🚗</span>
                    </div>
                    <div>
                      <p className="font-bold text-[#1A1A2E] text-sm">{job.make} {job.model}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{job.registration_number}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border capitalize flex-shrink-0
                    ${job.status === 'in_progress' ? 'bg-orange-50 border-orange-100 text-orange-500' : 'bg-blue-50 border-blue-100 text-blue-500'}`}>
                    {job.status?.replace('_', ' ')}
                  </span>
                </div>
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <User size={11} className="text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-[#1A1A2E]">{job.customer_name}</span>
                    {job.customer_phone && <span className="text-gray-400">· {job.customer_phone}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Car size={11} className="text-gray-400 flex-shrink-0" />
                    {job.service_name || 'Service not specified'}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <ClipboardCheck size={11} className="flex-shrink-0" />
                    Tracking: <span className="text-[#B8860B] font-bold ml-1">{job.tracking_number}</span>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-gray-400">Repair Progress</span>
                    <span className="text-[#B8860B]">{job.progress || 0}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#B8860B] to-yellow-400 rounded-full"
                      style={{ width: `${job.progress || 0}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{job.preferred_date || '—'}</span>
                  <div className="flex items-center gap-1 text-xs font-bold text-[#B8860B] group-hover:gap-2 transition-all">
                    {loadingInsp ? 'Loading...' : 'View / Start Inspection'}
                    <ChevronRight size={13} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── ALREADY SUBMITTED → SHOW REPORT + STATUS ──────────────────
  if (existingInsp && existingInsp.advisor_signature && ['pending', 'completed', 'customer_signed'].includes(existingInsp.status)) {
    const damages = (() => { try { return JSON.parse(existingInsp.damage_notes || '[]') } catch { return [] } })()
    const isPending = existingInsp.status === 'pending'
    return (
      <div>
        <button onClick={() => { setSelectedJob(null); setExistingInsp(null) }}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#B8860B] transition-colors mb-5 font-medium">
          <ChevronLeft size={13} /> Back to job list
        </button>
        {isPending ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6 flex items-center gap-3">
            <ClipboardCheck size={20} className="text-amber-500 flex-shrink-0" />
            <div>
              <p className="font-bold text-amber-700 text-sm">Inspection Report Submitted — Awaiting Customer Sign-Off</p>
              <p className="text-xs text-amber-600/80">Ref: <strong>{existingInsp.reference_number}</strong> · The customer must review and sign on their portal before work can begin.</p>
            </div>
            <button onClick={() => window.print()}
              className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white text-xs font-semibold rounded-full hover:bg-amber-700 transition-colors flex-shrink-0">
              <Printer size={12} /> Print
            </button>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 mb-6 flex items-center gap-3">
            <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
            <div>
              <p className="font-bold text-green-700 text-sm">Customer Signed — Ready to Start Work ✓</p>
              <p className="text-xs text-green-600/80">Ref: <strong>{existingInsp.reference_number}</strong> · Customer has confirmed the inspection report.</p>
            </div>
            <button onClick={() => window.print()}
              className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-full hover:bg-green-700 transition-colors flex-shrink-0">
              <Printer size={12} /> Print
            </button>
          </div>
        )}
        <div className="mt-6">
          <InspectionReportDetails inspection={existingInsp} job={selectedJob} />
        </div>
      </div>
    )
  }

  // ── NOT YET INSPECTED → SHOW FORM ─────────────────────────────
  return <InspectionForm job={selectedJob} existingInsp={existingInsp} onBack={() => { setSelectedJob(null); setExistingInsp(null) }} />
}

// ── INSPECTION FORM ────────────────────────────────────────────────
function InspectionForm({ job, existingInsp, onBack }) {
  const [step, setStep] = useState(0)
  const [damages, setDamages] = useState(() => {
    try {
      return existingInsp?.damage_notes ? (typeof existingInsp.damage_notes === 'string' ? JSON.parse(existingInsp.damage_notes) : existingInsp.damage_notes) : []
    } catch { return [] }
  })
  const [photos, setPhotos] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fuelLevel, setFuelLevel] = useState(existingInsp?.fuel_level || '1/2')
  const [inspRef, setInspRef] = useState(existingInsp?.reference_number || `INS-${Math.floor(1000 + Math.random() * 9000)}`)
  const [inspId, setInspId] = useState(existingInsp?.id || null)
  const [additionalDamageNotes, setAdditionalDamageNotes] = useState('')
  const [valuablesNotes, setValuablesNotes] = useState(existingInsp?.valuables_notes || '')

  // Odometer — controlled
  const [odometer, setOdometer] = useState(existingInsp?.odometer_reading || '')

  // Checklist state — { label: { checked: bool, value: string } }
  const [checklist, setChecklist] = useState(() => {
    try {
      return existingInsp?.checklist ? (typeof existingInsp.checklist === 'string' ? JSON.parse(existingInsp.checklist) : existingInsp.checklist) : {}
    } catch { return {} }
  })

  // Accessories state — { label: bool }
  const [accessories, setAccessories] = useState(() => {
    try {
      const saved = existingInsp?.accessories ? (typeof existingInsp.accessories === 'string' ? JSON.parse(existingInsp.accessories) : existingInsp.accessories) : {}
      const defaults = {
        '🔑 Car Keys': true,
        '🔑 Spare Key': false,
        '📒 Vehicle Logbook': false,
        '📄 Insurance Card': false,
        '📋 Road Tax': false,
        '🏅 Fitness Certificate': false,
        '🛞 Spare Tyre': false,
        '🔧 Car Jack': false,
        '⚠️ Warning Triangle': false,
        '📻 Radio Remote': false,
        '🎯 Floor Mats': false,
        '🎥 Dash Camera': false,
        '👶 Child Seat': false,
        '🔌 Phone Charger': false,
      }
      return Object.keys(saved).length > 0 ? { ...defaults, ...saved } : defaults
    } catch {
      return {
        '🔑 Car Keys': true,
        '🔑 Spare Key': false,
        '📒 Vehicle Logbook': false,
        '📄 Insurance Card': false,
        '📋 Road Tax': false,
        '🏅 Fitness Certificate': false,
        '🛞 Spare Tyre': false,
        '🔧 Car Jack': false,
        '⚠️ Warning Triangle': false,
        '📻 Radio Remote': false,
        '🎯 Floor Mats': false,
        '🎥 Dash Camera': false,
        '👶 Child Seat': false,
        '🔌 Phone Charger': false,
      }
    }
  })

  const fuels = ['E', '1/4', '1/2', '3/4', 'F']

  const next = () => { if (step < 4) setStep(s => s + 1); window.scrollTo(0, 0) }
  const back = () => { if (step > 0) setStep(s => s - 1); window.scrollTo(0, 0) }

  const updateChecklist = (label, data) => {
    setChecklist(prev => ({ ...prev, [label]: data }))
  }

  const toggleAcc = (key) => {
    setAccessories(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const submit = async () => {
    // Capture advisor signature
    const advisor = document.getElementById('advisorSigCanvas')
    let advisorSig = null
    if (advisor) {
      advisorSig = advisor.toDataURL('image/png')
    }

    setSaving(true)
    try {
      const apiMod = (await import('../../services/api')).default
      let id = inspId

      // Build the checklist and accessories payload
      const checklistPayload = checklist
      const accessoriesPayload = accessories

      if (!id) {
        const res = await apiMod.post('/inspections', {
          appointment_id: job.appointment_id,
          vehicle_id: job.vehicle_id,
          customer_id: job.customer_id,
          fuel_level: fuelLevel,
          odometer_reading: odometer ? Number(odometer) : null,
          damage_notes: damages,
          checklist: checklistPayload,
          accessories: accessoriesPayload,
          valuables_notes: valuablesNotes || null,
        })
        id = res.data.data.id
        setInspId(id)
        setInspRef(res.data.data.reference_number)
      }

      // Complete/update with all data — status 'pending' means awaiting customer sign-off
      await apiMod.patch(`/inspections/${id}/complete`, {
        fuel_level: fuelLevel,
        odometer_reading: odometer ? Number(odometer) : null,
        damage_notes: damages,
        checklist: checklistPayload,
        accessories: accessoriesPayload,
        valuables_notes: valuablesNotes || null,
        advisor_signature: advisorSig,
        status: 'pending',
      })

      // Upload photos if any
      const toUpload = photos.filter(p => p.file)
      if (toUpload.length > 0) {
        for (const p of toUpload) {
          const formData = new FormData()
          formData.append('photos', p.file)
          formData.append('photo_type', p.type)
          await apiMod.post(`/inspections/${id}/photos`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        }
      }

      setSubmitted(true)
      window.scrollTo(0, 0)
    } catch (err) {
      alert('Failed to save inspection: ' + (err.response?.data?.message || err.message))
    } finally { setSaving(false) }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-5 shadow-lg">
          <ClipboardCheck size={36} className="text-amber-500" />
        </div>
        <h2 className="font-display text-3xl text-[#1A1A2E] mb-2">Report Submitted!</h2>
        <p className="text-gray-500 mb-1">Inspection report for <strong>{job.make} {job.model}</strong> has been sent to the customer portal.</p>
        <p className="text-sm text-amber-600 mb-4">⏳ Work can begin once the customer reviews and signs off on their dashboard.</p>
        <div className="bg-[#B8860B]/10 text-[#B8860B] font-bold px-6 py-2.5 rounded-full text-sm mb-8">
          Reference: {inspRef}
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 max-w-sm w-full text-left mb-8">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-widest mb-3">Next Steps</p>
          <ul className="space-y-2 text-sm text-amber-800">
            <li className="flex items-start gap-2"><span className="font-bold flex-shrink-0">1.</span>Customer receives notification on their portal</li>
            <li className="flex items-start gap-2"><span className="font-bold flex-shrink-0">2.</span>Customer reviews inspection report &amp; signs digitally</li>
            <li className="flex items-start gap-2"><span className="font-bold flex-shrink-0">3.</span>Once signed, you will be notified to begin repair work</li>
          </ul>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-3 bg-[#B8860B] text-white font-semibold rounded-full hover:bg-[#8B6508] transition-colors text-sm">
            <Printer size={14} /> Print Report
          </button>
          <button onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 border border-gray-200 text-gray-600 font-semibold rounded-full hover:bg-gray-50 transition-colors text-sm">
            <ChevronLeft size={14} /> Back to Jobs
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Back + header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack}
          className="w-8 h-8 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:border-[#B8860B] hover:text-[#B8860B] transition-colors flex-shrink-0">
          <ChevronLeft size={15} />
        </button>
        <div>
          <h1 className="font-display text-2xl text-[#1A1A2E]">Vehicle Reception &amp; Inspection</h1>
          <p className="text-gray-400 text-sm">
            {job.make} {job.model} · {job.registration_number} · {job.customer_name}
            &nbsp;— Ref: <span className="text-[#B8860B] font-bold">{inspRef}</span>
          </p>
        </div>
      </div>

      <StepBar current={step} onGoto={setStep} />

      {/* ─ STEP 1: VEHICLE INFO ─ */}
      {step === 0 && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center"><User size={15} className="text-blue-500" /></div>
              <h3 className="font-bold text-[#1A1A2E] text-sm">Customer Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[['Full Name *', 'text', job.customer_name || ''], ['Phone (WhatsApp) *', 'tel', job.customer_phone || ''], ['ID / Passport', 'text', ''], ['Email Address', 'email', '']].map(([label, type, def]) => (
                <div key={label}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
                  <input type={type} defaultValue={def} placeholder={label} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B]" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 bg-[#B8860B]/10 rounded-lg flex items-center justify-center"><Car size={15} className="text-[#B8860B]" /></div>
              <h3 className="font-bold text-[#1A1A2E] text-sm">Vehicle Information</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[['Make *', job.make || ''], ['Model *', job.model || ''], ['Year', job.year || ''], ['Color', job.color || ''], ['Registration No. *', job.registration_number || ''], ['Chassis/VIN', '']].map(([label, def]) => (
                <div key={label}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
                  <input defaultValue={def} placeholder={label} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B]" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Odometer (km) *</label>
                <input
                  type="number"
                  placeholder="e.g. 87500"
                  value={odometer}
                  onChange={e => setOdometer(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Fuel Level *</label>
                <div className="flex gap-2">
                  {fuels.map(f => (
                    <button key={f} type="button" onClick={() => setFuelLevel(f)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-[1.5px] transition-all
                        ${fuelLevel === f ? 'bg-[#B8860B] border-[#B8860B] text-white' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-[#B8860B]'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Service</label>
                <input defaultValue={job.service_name || ''} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] bg-gray-50" readOnly />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Customer Complaint / Problem Description</label>
              <textarea rows={3} defaultValue={job.problem_description || ''} placeholder="Describe the problem..."
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] resize-none" />
            </div>
          </div>
        </div>
      )}

      {/* ─ STEP 2: CONDITION CHECK ─ */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center"><AlertTriangle size={15} className="text-red-400" /></div>
              <h3 className="font-bold text-[#1A1A2E] text-sm">Damage Map — Click areas to mark</h3>
            </div>
            <DamageMap damages={damages} onChange={setDamages} />
            <div className="mt-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Additional Damage Notes</label>
              <textarea
                rows={2}
                placeholder="Describe any other damage..."
                value={additionalDamageNotes}
                onChange={e => setAdditionalDamageNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] resize-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
            {/* Exterior */}
            <div className="bg-white rounded-2xl p-4 lg:p-5 shadow-sm border border-gray-50">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">🚗 Exterior</h4>
              {[
                ['Scratches', ['None', 'Minor', 'Moderate', 'Severe']],
                ['Dents', ['None', 'Minor', 'Moderate', 'Severe']],
                ['Cracked Windshield', ['None', 'Minor', 'Moderate', 'Severe']],
                ['Broken Lights', ['None', 'Front', 'Rear', 'Both']],
                ['Tyre Condition', ['Good', 'Fair', 'Poor', 'Bald']],
              ].map(([label, options]) => (
                <CheckItem key={label} label={label} options={options}
                  value={checklist[label]?.value || options[0]}
                  onChange={(data) => updateChecklist(label, data)} />
              ))}
            </div>
            {/* Interior */}
            <div className="bg-white rounded-2xl p-4 lg:p-5 shadow-sm border border-gray-50">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">🪑 Interior</h4>
              {[
                ['Seat Condition', ['Good', 'Fair', 'Poor']],
                ['Dashboard Damage', ['None', 'Minor', 'Moderate']],
                ['Radio/Infotainment', ['Working', 'Not Working', 'Missing']],
                ['Air Conditioning', ['Working', 'Not Working', 'Partial']],
                ['Seat Belts', ['All OK', '1 Faulty', 'Multiple']],
              ].map(([label, options]) => (
                <CheckItem key={label} label={label} options={options}
                  value={checklist[label]?.value || options[0]}
                  onChange={(data) => updateChecklist(label, data)} />
              ))}
            </div>
            {/* Mechanical */}
            <div className="bg-white rounded-2xl p-4 lg:p-5 shadow-sm border border-gray-50">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">⚙️ Mechanical</h4>
              {[
                ['Engine Noise', ['None', 'Minor', 'Loud']],
                ['Oil Leak', ['None', 'Minor', 'Severe']],
                ['Battery Status', ['Good', 'Weak', 'Dead']],
                ['Brake Feel', ['Good', 'Soft', 'Hard', 'Grinding']],
                ['Warning Lights', ['None', '1-2 Lights', 'Multiple']],
              ].map(([label, options]) => (
                <CheckItem key={label} label={label} options={options}
                  value={checklist[label]?.value || options[0]}
                  onChange={(data) => updateChecklist(label, data)} />
              ))}
            </div>
            {/* Under Bonnet */}
            <div className="bg-white rounded-2xl p-4 lg:p-5 shadow-sm border border-gray-50">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">🔧 Under Bonnet</h4>
              {[
                ['Coolant Level', ['Full', 'Low', 'Empty']],
                ['Engine Oil Level', ['Full', 'Low', 'Empty']],
                ['Brake Fluid', ['Full', 'Low', 'Empty']],
                ['Air Filter', ['Clean', 'Dirty', 'Blocked']],
                ['Timing Belt (visual)', ['OK', 'Worn', 'Unknown']],
              ].map(([label, options]) => (
                <CheckItem key={label} label={label} options={options}
                  value={checklist[label]?.value || options[0]}
                  onChange={(data) => updateChecklist(label, data)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─ STEP 3: PHOTOS ─ */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            <PhotoZone title="Before Repair" type="before" icon={Car} hint="Front, rear, left side, right side, interior" photos={photos} setPhotos={setPhotos} />
            <PhotoZone title="Damage Evidence" type="damage" icon={AlertTriangle} hint="Close-ups of all identified damages" photos={photos} setPhotos={setPhotos} />
            <PhotoZone title="Dashboard & Odometer" type="dashboard" icon={Camera} hint="Fuel gauge, odometer, warning lights" photos={photos} setPhotos={setPhotos} />
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
            <Camera size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-600">Photos serve as legal evidence and will be visible to the customer on their dashboard.</p>
          </div>
        </div>
      )}

      {/* ─ STEP 4: ACCESSORIES ─ */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-50">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center"><Package size={15} className="text-green-500" /></div>
              <h3 className="font-bold text-[#1A1A2E] text-sm">Keys &amp; Documents</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {['🔑 Car Keys', '🔑 Spare Key', '📒 Vehicle Logbook', '📄 Insurance Card', '📋 Road Tax', '🏅 Fitness Certificate'].map(label => (
                <AccItem key={label} icon={Package} label={label}
                  checked={!!accessories[label]}
                  onToggle={() => toggleAcc(label)} />
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-50">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center"><Car size={15} className="text-purple-500" /></div>
              <h3 className="font-bold text-[#1A1A2E] text-sm">Equipment &amp; Accessories</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {['🛞 Spare Tyre', '🔧 Car Jack', '⚠️ Warning Triangle', '📻 Radio Remote', '🎯 Floor Mats', '🎥 Dash Camera', '👶 Child Seat', '🔌 Phone Charger'].map(label => (
                <AccItem key={label} icon={Package} label={label}
                  checked={!!accessories[label]}
                  onToggle={() => toggleAcc(label)} />
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-50">
            <div className="flex items-start gap-3 bg-orange-50 border border-orange-100 rounded-xl p-4 mb-4">
              <AlertTriangle size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-orange-600"><strong>Important:</strong> AutoMedic is not responsible for valuables left in the vehicle.</p>
            </div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Valuables Left in Vehicle</label>
            <textarea
              rows={2}
              placeholder="e.g. Sunglasses in glove box, USB cables..."
              value={valuablesNotes}
              onChange={e => setValuablesNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] resize-none"
            />
          </div>
        </div>
      )}

      {/* ─ STEP 5: SUBMIT TO CUSTOMER PORTAL ─ */}
      {step === 4 && (
        <div className="space-y-5">

          {/* Info banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <ClipboardCheck size={20} className="text-amber-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-amber-800 text-sm mb-1">Customer sign-off is done on the Customer Portal</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                Once you submit this report, the customer will receive a notification on their dashboard.
                They must review the full inspection report and sign digitally before work can begin on the vehicle.
              </p>
            </div>
          </div>

          {/* Inspection summary */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-50">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-[#B8860B]/10 rounded-lg flex items-center justify-center"><ClipboardCheck size={15} className="text-[#B8860B]" /></div>
              <h3 className="font-bold text-[#1A1A2E] text-sm">Inspection Summary</h3>
              <span className="ml-auto text-[#B8860B] font-bold text-xs sm:text-sm">{inspRef}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-8">
              {[
                ['Reference', inspRef],
                ['Vehicle', `${job.make} ${job.model}`],
                ['Registration', job.registration_number],
                ['Customer', job.customer_name],
                ['Fuel Level', fuelLevel],
                ['Odometer', odometer ? `${odometer} km` : '—'],
                ['Damages Flagged', damages.length > 0 ? damages.length + ' area(s)' : 'None'],
                ['Photos Taken', photos.length > 0 ? photos.length + ' photo(s)' : 'None'],
              ].map(([k, v], i) => (
                <div key={i} className="flex justify-between py-2.5 border-b border-gray-50 text-xs sm:text-sm">
                  <span className="text-gray-400">{k}</span>
                  <span className="font-semibold text-[#1A1A2E] text-right break-words ml-2">{v}</span>
                </div>
              ))}
            </div>
            {damages.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Damages Recorded</p>
                <div className="flex flex-wrap gap-2">
                  {damages.map((d, i) => (
                    <span key={i} className="text-xs bg-red-50 text-red-600 border border-red-100 px-3 py-1 rounded-full font-semibold">{d}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Accessories summary */}
          {Object.values(accessories).some(Boolean) && (
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-50">
              <h3 className="font-bold text-[#1A1A2E] text-sm mb-3">Received With Vehicle</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(accessories).filter(([, v]) => v).map(([k]) => (
                  <span key={k} className="text-xs bg-green-50 text-green-700 border border-green-100 px-3 py-1 rounded-full font-semibold">{k}</span>
                ))}
              </div>
            </div>
          )}

          {/* Advisor signature */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-50">
            <div className="flex items-start sm:items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <User size={15} className="text-blue-500" />
              </div>
              <h3 className="font-bold text-[#1A1A2E] text-xs sm:text-sm leading-tight">Service Advisor / Technician Sign-Off</h3>
            </div>
            <p className="text-xs text-gray-400 mb-4">Sign below to confirm that this inspection report is accurate and ready to be sent to the customer.</p>
            <SigPad label="" id="advisorSigCanvas" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Technician Name</label>
                <input defaultValue={''} placeholder="Your name" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date &amp; Time</label>
                <input type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B]" />
              </div>
            </div>
          </div>

          {/* What happens next */}
          <div className="bg-[#1A1A2E] rounded-2xl p-4 sm:p-5">
            <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-3">What happens after you submit</p>
            <div className="space-y-3">
              {[
                ['📱', 'Customer is notified', 'They receive a notification on their customer dashboard'],
                ['📋', 'Customer reviews report', 'They see the full inspection details — damages, fuel level, condition'],
                ['✍️', 'Customer signs digitally', 'They sign on their own device to authorise repair work'],
                ['🔧', 'You begin repairs', 'Once signed, you get a notification and can start work immediately'],
              ].map(([icon, title, desc], i) => (
                <div key={i} className="flex items-start gap-2.5 sm:gap-3">
                  <span className="text-base sm:text-lg flex-shrink-0 mt-0.5">{icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-xs font-semibold">{title}</p>
                    <p className="text-white/50 text-[11px] leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* NAV BUTTONS */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-6 pt-4">
        <button onClick={back} disabled={step === 0}
          className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-600 font-semibold rounded-full hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm">
          <ChevronLeft size={15} /> Back
        </button>
        <div className="flex flex-col sm:flex-row gap-3">
          {step < 4 ? (
            <button onClick={next}
              className="flex items-center justify-center gap-2 px-7 py-3 bg-[#B8860B] text-white font-semibold rounded-full hover:bg-[#8B6508] transition-all text-sm">
              Next <ChevronRight size={15} />
            </button>
          ) : (
            <>
              <button onClick={() => window.print()}
                className="flex items-center justify-center gap-2 px-5 py-3 border border-gray-200 text-gray-600 font-semibold rounded-full hover:bg-gray-50 transition-all text-sm">
                <Printer size={14} /> Print
              </button>
              <button onClick={submit} disabled={saving}
                className="flex items-center justify-center gap-2 px-7 py-3 bg-[#B8860B] text-white font-semibold rounded-full hover:bg-[#8B6508] transition-all text-sm disabled:opacity-60 whitespace-nowrap">
                <ClipboardCheck size={15} /> {saving ? 'Submitting...' : 'Submit to Customer Portal'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
