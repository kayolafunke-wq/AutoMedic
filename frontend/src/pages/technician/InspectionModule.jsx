import { useState, useRef, useEffect } from 'react'
import {
  Car, User, ClipboardCheck, Camera, Package, PenLine,
  CheckCircle, ChevronRight, ChevronLeft, AlertTriangle,
  X, Printer, Shield, Plus, Trash2
} from 'lucide-react'

/* â”€â”€â”€ STEP BAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function StepBar({ current, onGoto }) {
  const steps = ['Vehicle Info','Condition Check','Photos','Accessories','Customer Sign-Off']
  return (
    <div className="flex items-center justify-center bg-white border-b border-gray-100 px-6 py-4 mb-6 rounded-2xl shadow-sm">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center">
          <button onClick={() => onGoto(i)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all
              ${current === i ? 'bg-[#B8860B] text-white shadow' : i < current ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:text-gray-600'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0
              ${current === i ? 'bg-white text-[#B8860B]' : i < current ? 'bg-green-500 text-white' : 'bg-gray-100'}`}>
              {i < current ? 'âœ“' : i + 1}
            </span>
            <span className="hidden md:inline">{label}</span>
          </button>
          {i < steps.length - 1 && <div className={`w-8 h-0.5 mx-1 ${i < current ? 'bg-green-400' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  )
}

/* â”€â”€â”€ SIGNATURE PAD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function SigPad({ label, id }) {
  const ref = useRef(null)
  const drawing = useRef(false)

  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')
    ctx.strokeStyle = '#1A1A2E'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    const pos = (e) => {
      const r = c.getBoundingClientRect(), sx = c.width/r.width, sy = c.height/r.height
      const src = e.touches?.[0]||e
      return {x:(src.clientX-r.left)*sx, y:(src.clientY-r.top)*sy}
    }
    const d = (e)=>{ drawing.current=true; const p=pos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y) }
    const m = (e)=>{ if(!drawing.current) return; const p=pos(e); ctx.lineTo(p.x,p.y); ctx.stroke() }
    const u = ()=>{ drawing.current=false }
    c.addEventListener('mousedown',d); c.addEventListener('mousemove',m); c.addEventListener('mouseup',u); c.addEventListener('mouseleave',u)
    c.addEventListener('touchstart',(e)=>{e.preventDefault();d(e)},{passive:false})
    c.addEventListener('touchmove',(e)=>{e.preventDefault();m(e)},{passive:false})
    c.addEventListener('touchend',u)
    return ()=>{ c.removeEventListener('mousedown',d); c.removeEventListener('mousemove',m) }
  }, [])

  const clear = () => { const c=ref.current; c.getContext('2d').clearRect(0,0,c.width,c.height) }

  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 mb-2">{label}</p>
      <div className="border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:border-[#B8860B] transition-colors overflow-hidden relative">
        <canvas ref={ref} id={id} width={560} height={130} className="w-full cursor-crosshair touch-none block" style={{height:130}} />
        <p className="absolute bottom-2 left-3 text-[10px] text-gray-300 pointer-events-none select-none">Sign here âœ</p>
      </div>
      <button onClick={clear} className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
        <X size={11} /> Clear
      </button>
    </div>
  )
}

/* â”€â”€â”€ CHECKLIST ITEM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function CheckItem({ label, options }) {
  const [checked, setChecked] = useState(false)
  const [val, setVal] = useState(options[0])
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-50">
      <input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)}
        className="w-4 h-4 accent-[#B8860B] cursor-pointer flex-shrink-0" />
      <span className={`text-sm flex-1 ${checked ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>{label}</span>
      <select value={val} onChange={e=>setVal(e.target.value)}
        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-[#B8860B] text-gray-600">
        {options.map(o=><option key={o}>{o}</option>)}
      </select>
    </div>
  )
}

/* â”€â”€â”€ ACCESSORY ITEM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function AccItem({ icon:Icon, label, defaultChecked=false }) {
  const [checked, setChecked] = useState(defaultChecked)
  return (
    <button onClick={()=>setChecked(!checked)}
      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-[1.5px] text-sm font-medium transition-all text-left
        ${checked ? 'bg-[#B8860B]/8 border-[#B8860B]/40 text-[#B8860B]' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'}`}>
      <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${checked ? 'bg-[#B8860B] text-white' : 'bg-gray-200 text-gray-400'}`}>
        {checked ? <CheckCircle size={13} /> : <Icon size={13} />}
      </div>
      {label}
    </button>
  )
}

/* â”€â”€â”€ DAMAGE MAP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function DamageMap({ damages, onChange }) {
  const zones = [
    { id:'front',  label:'Front',    style:{left:'4%',   top:'42%'} },
    { id:'rear',   label:'Rear',     style:{right:'4%',  top:'42%'} },
    { id:'roof',   label:'Roof',     style:{left:'43%',  top:'4%'} },
    { id:'hood',   label:'Hood',     style:{left:'12%',  top:'18%'} },
    { id:'boot',   label:'Boot',     style:{right:'12%', top:'18%'} },
    { id:'left',   label:'Left Side',style:{left:'43%',  top:'75%'} },
    { id:'right',  label:'R. Side',  style:{left:'43%',  bottom:'4%'} },
    { id:'windsh', label:'Windshield',style:{left:'23%', top:'35%'} },
  ]

  const toggle = (label) => {
    onChange(damages.includes(label) ? damages.filter(d=>d!==label) : [...damages, label])
  }

  return (
    <div>
      {/* SVG Car Diagram */}
      <div className="bg-[#F5F3EE] rounded-2xl p-4 mb-4 relative" style={{minHeight:220}}>
        <svg viewBox="0 0 500 200" className="w-full max-w-lg mx-auto block" style={{maxHeight:180}}>
          {/* Car body */}
          <rect x="60" y="90" width="380" height="80" rx="10" fill="#D0D8E4" stroke="#9BA8B5" strokeWidth="1.5"/>
          {/* Cabin */}
          <rect x="120" y="55" width="260" height="60" rx="10" fill="#BFC9D6" stroke="#9BA8B5" strokeWidth="1.5"/>
          {/* Windows */}
          <rect x="130" y="60" width="105" height="48" rx="5" fill="#90CAF9" opacity="0.6"/>
          <rect x="265" y="60" width="105" height="48" rx="5" fill="#90CAF9" opacity="0.6"/>
          {/* Front wheel */}
          <circle cx="140" cy="174" r="22" fill="#37474F" stroke="#263238" strokeWidth="2"/>
          <circle cx="140" cy="174" r="11" fill="#607D8B"/>
          {/* Rear wheel */}
          <circle cx="360" cy="174" r="22" fill="#37474F" stroke="#263238" strokeWidth="2"/>
          <circle cx="360" cy="174" r="11" fill="#607D8B"/>
          {/* Front bumper */}
          <rect x="44" y="96" width="22" height="50" rx="6" fill="#B0BEC5" stroke="#9BA8B5" strokeWidth="1"/>
          {/* Rear bumper */}
          <rect x="434" y="96" width="22" height="50" rx="6" fill="#B0BEC5" stroke="#9BA8B5" strokeWidth="1"/>
          {/* Front lights */}
          <rect x="46" y="100" width="16" height="18" rx="3" fill="#FFF176" opacity="0.9"/>
          {/* Rear lights */}
          <rect x="438" y="100" width="16" height="18" rx="3" fill="#EF9A9A" opacity="0.9"/>
          {/* Door line */}
          <line x1="250" y1="92" x2="250" y2="168" stroke="#9BA8B5" strokeWidth="1" strokeDasharray="4,3"/>
          {/* A-pillar */}
          <line x1="125" y1="108" x2="145" y2="92" stroke="#9BA8B5" strokeWidth="1.5"/>
          {/* C-pillar */}
          <line x1="375" y1="108" x2="355" y2="92" stroke="#9BA8B5" strokeWidth="1.5"/>
        </svg>

        {/* Clickable zone buttons overlaid */}
        <div className="absolute inset-0 pointer-events-none">
          {zones.map(({ id, label, style }) => {
            const marked = damages.includes(label)
            return (
              <button key={id} onClick={() => toggle(label)}
                style={{ ...style, position:'absolute', transform:'translate(-50%,-50%)', pointerEvents:'all' }}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border-[1.5px] whitespace-nowrap transition-all shadow-sm
                  ${marked
                    ? 'bg-red-500 border-red-500 text-white shadow-red-200'
                    : 'bg-white/90 border-gray-300 text-gray-600 hover:border-[#B8860B] hover:text-[#B8860B]'}`}>
                {marked ? 'âœ• ' : ''}{label}
              </button>
            )
          })}
        </div>

        <p className="text-center text-[10px] text-gray-400 mt-1">Click any area to mark damage</p>
      </div>

      {/* Damage tags */}
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

      {/* Manual damage zones grid */}
      <div className="grid grid-cols-4 gap-2">
        {['Front Bumper','Rear Bumper','Roof','Hood/Bonnet','Boot/Trunk','Left Side','Right Side','Windshield','Left Wing','Right Wing','Rear Window','Underbody'].map(z => {
          const marked = damages.includes(z)
          return (
            <button key={z} onClick={() => toggle(z)}
              className={`px-2 py-2 rounded-xl text-[10px] font-semibold border-[1.5px] transition-all
                ${marked ? 'bg-red-50 border-red-300 text-red-600' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-[#B8860B] hover:text-[#B8860B]'}`}>
              {marked ? 'âœ• ' : ''}{z}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* â”€â”€â”€ PHOTO UPLOAD ZONE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function PhotoZone({ title, type, icon:Icon, hint, photos, setPhotos }) {
  const handleFiles = (e) => {
    Array.from(e.target.files).forEach(f => {
      const r = new FileReader()
      r.onload = ev => setPhotos(prev => [...prev, { type, url: ev.target.result, name: f.name }])
      r.readAsDataURL(f)
    })
  }
  const mine = photos.filter(p=>p.type===type)
  const inputId = `photo-${type}`
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#B8860B]/10 rounded-lg flex items-center justify-center"><Icon size={15} className="text-[#B8860B]"/></div>
          <h3 className="font-bold text-[#1A1A2E] text-sm">{title}</h3>
        </div>
        <span className="bg-[#B8860B]/10 text-[#B8860B] text-[10px] font-bold px-2 py-0.5 rounded-full">{mine.length} photo{mine.length!==1?'s':''}</span>
      </div>
      <p className="text-xs text-gray-400 mb-3">{hint}</p>
      <div onClick={()=>document.getElementById(inputId).click()}
        className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#B8860B] hover:bg-[#B8860B]/3 transition-all group">
        <Camera size={24} className="text-gray-300 mx-auto mb-1.5 group-hover:text-[#B8860B] transition-colors"/>
        <p className="text-xs text-gray-400 group-hover:text-[#B8860B] transition-colors">Click or drag to upload</p>
        <input id={inputId} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles}/>
      </div>
      {mine.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {mine.map((p,i)=>(
            <div key={i} className="relative">
              <img src={p.url} alt={p.name} className="w-16 h-14 object-cover rounded-lg border border-gray-200"/>
              <button onClick={()=>setPhotos(prev=>prev.filter((_,j)=>j!==photos.indexOf(p)))}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white">
                <X size={8}/>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* â”€â”€â”€ MAIN MODULE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function InspectionModule({ jobs }) {
  const [step, setStep] = useState(0)
  const [damages, setDamages] = useState([])
  const [photos, setPhotos] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [fuelLevel, setFuelLevel] = useState('1/2')
  const inspRef = `INS-${Math.floor(1000+Math.random()*9000)}`

  const fuels = ['E','1/4','1/2','3/4','F']

  const next = () => { if(step<4) setStep(s=>s+1); window.scrollTo(0,0) }
  const back = () => { if(step>0) setStep(s=>s-1); window.scrollTo(0,0) }

  const submit = () => {
    const cust = document.getElementById('custSigCanvas')
    if (cust) {
      const data = cust.getContext('2d').getImageData(0,0,cust.width,cust.height).data
      const signed = Array.from(data).some((v,i)=>i%4===3&&v>0)
      if (!signed) { alert('Please have the customer sign before completing the inspection.'); return }
    }
    setSubmitted(true)
    window.scrollTo(0,0)
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-5 shadow-lg">
          <CheckCircle size={36} className="text-green-500"/>
        </div>
        <h2 className="font-display text-3xl text-[#1A1A2E] mb-2">Inspection Complete!</h2>
        <p className="text-gray-500 mb-3">Vehicle reception and inspection saved successfully.</p>
        <div className="bg-[#B8860B]/10 text-[#B8860B] font-bold px-6 py-2.5 rounded-full text-sm mb-8">
          Reference: {inspRef}
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-3 bg-[#B8860B] text-white font-semibold rounded-full hover:bg-[#8B6508] transition-colors text-sm">
            <Printer size={14}/> Print Report
          </button>
          <button onClick={() => { setSubmitted(false); setStep(0); setDamages([]); setPhotos([]) }}
            className="flex items-center gap-2 px-6 py-3 border border-gray-200 text-gray-600 font-semibold rounded-full hover:bg-gray-50 transition-colors text-sm">
            <Plus size={14}/> New Inspection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display text-2xl text-[#1A1A2E]">Vehicle Reception & Inspection</h1>
          <p className="text-gray-400 text-sm mt-0.5">Record vehicle condition upon arrival â€” Ref: <span className="text-[#B8860B] font-bold">{inspRef}</span></p>
        </div>
      </div>

      <StepBar current={step} onGoto={setStep} />

      {/* â”€â”€ STEP 1: VEHICLE INFO â”€â”€ */}
      {step === 0 && (
        <div className="space-y-5">
          {/* Customer info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center"><User size={15} className="text-blue-500"/></div>
              <h3 className="font-bold text-[#1A1A2E] text-sm">Customer Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[['Full Name *','text','e.g. John Banda'],['Phone (WhatsApp) *','tel','+265 999 000 000'],['ID / Passport','text','National ID or Passport'],['Email Address','email','email@example.com']].map(([label,type,ph])=>(
                <div key={label}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
                  <input type={type} placeholder={ph} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10"/>
                </div>
              ))}
            </div>
          </div>

          {/* Vehicle info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 bg-[#B8860B]/10 rounded-lg flex items-center justify-center"><Car size={15} className="text-[#B8860B]"/></div>
              <h3 className="font-bold text-[#1A1A2E] text-sm">Vehicle Information</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[['Vehicle Make *','Toyota'],['Vehicle Model *','Corolla'],['Year','2018'],['Color','Silver'],['Registration No. *',''],['Chassis/VIN','JT2AE...']].map(([label,ph])=>(
                <div key={label}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
                  <input placeholder={ph} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] focus:ring-2 focus:ring-[#B8860B]/10"/>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Odometer / Mileage (km) *</label>
                <input type="number" placeholder="e.g. 87500" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B]"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Fuel Level *</label>
                <div className="flex gap-2">
                  {fuels.map(f=>(
                    <button key={f} onClick={()=>setFuelLevel(f)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-[1.5px] transition-all
                        ${fuelLevel===f ? 'bg-[#B8860B] border-[#B8860B] text-white' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-[#B8860B]'}`}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Service Requested *</label>
                <select className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] bg-white">
                  {['','Brake Repair','Oil Change','Wheel Alignment','Car Diagnostics','Battery Replacement','Suspension Repair','Air Conditioning','Other'].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Assigned Technician</label>
                <select className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] bg-white">
                  {['','Charles Banda','Eric Phiri'].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Expected Completion Date</label>
                <input type="date" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B]"/>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Customer's Complaint / Problem Description</label>
              <textarea rows={3} placeholder="Describe the problem the customer is reporting..." className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] resize-none"/>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ STEP 2: CONDITION CHECK â”€â”€ */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Damage map */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center"><AlertTriangle size={15} className="text-red-400"/></div>
              <h3 className="font-bold text-[#1A1A2E] text-sm">Damage Map â€” Click areas to mark damage</h3>
            </div>
            <DamageMap damages={damages} onChange={setDamages}/>
            <div className="mt-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Additional Damage Notes</label>
              <textarea rows={2} placeholder="Describe any other damage in detail..." className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] resize-none"/>
            </div>
          </div>

          {/* Checklist grid */}
          <div className="grid grid-cols-2 gap-5">
            {/* Exterior */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">ðŸš— Exterior</h4>
              <CheckItem label="Scratches" options={['None','Minor','Moderate','Severe']}/>
              <CheckItem label="Dents" options={['None','Minor','Moderate','Severe']}/>
              <CheckItem label="Cracked Windshield" options={['None','Minor','Moderate','Severe']}/>
              <CheckItem label="Broken Lights" options={['None','Front','Rear','Both']}/>
              <CheckItem label="Missing/Broken Mirrors" options={['None','Left','Right','Both']}/>
              <CheckItem label="Tyre Condition" options={['Good','Fair','Poor','Bald']}/>
            </div>
            {/* Interior */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">ðŸª‘ Interior</h4>
              <CheckItem label="Seat Condition" options={['Good','Fair','Poor']}/>
              <CheckItem label="Dashboard Damage" options={['None','Minor','Moderate']}/>
              <CheckItem label="Radio/Infotainment" options={['Working','Not Working','Missing']}/>
              <CheckItem label="Air Conditioning" options={['Working','Not Working','Partial']}/>
              <CheckItem label="Floor Mats/Carpet" options={['Good','Fair','Poor']}/>
              <CheckItem label="Seat Belts" options={['All OK','1 Faulty','Multiple']}/>
            </div>
            {/* Mechanical */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">âš™ï¸ Mechanical</h4>
              <CheckItem label="Engine Noise" options={['None','Minor','Loud']}/>
              <CheckItem label="Oil Leak" options={['None','Minor','Severe']}/>
              <CheckItem label="Battery Status" options={['Good','Weak','Dead']}/>
              <CheckItem label="Brake Feel" options={['Good','Soft','Hard','Grinding']}/>
              <CheckItem label="Warning Lights On" options={['None','1â€“2 Lights','Multiple']}/>
            </div>
            {/* Under Bonnet */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">ðŸ”§ Under Bonnet</h4>
              <CheckItem label="Coolant Level" options={['Full','Low','Empty']}/>
              <CheckItem label="Engine Oil Level" options={['Full','Low','Empty']}/>
              <CheckItem label="Brake Fluid" options={['Full','Low','Empty']}/>
              <CheckItem label="Air Filter" options={['Clean','Dirty','Blocked']}/>
              <CheckItem label="Timing Belt (visual)" options={['OK','Worn','Unknown']}/>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ STEP 3: PHOTOS â”€â”€ */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-5">
            <PhotoZone title="Before Repair Photos" type="before" icon={Car}
              hint="Front, rear, left side, right side, interior" photos={photos} setPhotos={setPhotos}/>
            <PhotoZone title="Damage Evidence" type="damage" icon={AlertTriangle}
              hint="Close-ups of all identified damages and faults" photos={photos} setPhotos={setPhotos}/>
            <PhotoZone title="Dashboard & Odometer" type="dashboard" icon={Camera}
              hint="Fuel gauge, odometer reading, warning lights" photos={photos} setPhotos={setPhotos}/>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
            <Camera size={16} className="text-blue-400 flex-shrink-0 mt-0.5"/>
            <p className="text-xs text-blue-600">Upload clear photos from all angles. These photos serve as legal evidence and will be visible to the customer through their dashboard.</p>
          </div>
        </div>
      )}

      {/* â”€â”€ STEP 4: ACCESSORIES â”€â”€ */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center"><Package size={15} className="text-green-500"/></div>
              <h3 className="font-bold text-[#1A1A2E] text-sm">Keys & Documents</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[['ðŸ”‘','Car Keys',true],['ðŸ”‘','Spare Key',false],['ðŸ“’','Vehicle Logbook',false],['ðŸ“„','Insurance Card',false],['ðŸ“‹','Road Tax',false],['ðŸ…','Fitness Certificate',false]].map(([icon,label,def])=>(
                <AccItem key={label} icon={Package} label={`${icon} ${label}`} defaultChecked={def}/>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center"><Car size={15} className="text-purple-500"/></div>
              <h3 className="font-bold text-[#1A1A2E] text-sm">Equipment & Accessories</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[['ðŸ›ž','Spare Tyre'],['ðŸ”§','Car Jack'],['âš ï¸','Warning Triangle'],['ðŸ“»','Radio Remote'],['ðŸŽ¯','Floor Mats'],['ðŸŽ¥','Dash Camera'],['ðŸ‘¶','Child Seat'],['ðŸ”Œ','Phone Charger']].map(([icon,label])=>(
                <AccItem key={label} icon={Package} label={`${icon} ${label}`}/>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
            <div className="flex items-start gap-3 bg-orange-50 border border-orange-100 rounded-xl p-4 mb-4">
              <AlertTriangle size={16} className="text-orange-500 flex-shrink-0 mt-0.5"/>
              <p className="text-xs text-orange-600"><strong>Important:</strong> AutoMedic is not responsible for valuables left in the vehicle. Advise the customer to remove all valuables.</p>
            </div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Valuables Left in Vehicle (customer acknowledges risk)</label>
            <textarea rows={2} placeholder="e.g. Sunglasses in glove box, USB cables..." className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] resize-none"/>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 mt-4">Additional Notes</label>
            <textarea rows={2} placeholder="Any other items or special instructions..." className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] resize-none"/>
          </div>
        </div>
      )}

      {/* â”€â”€ STEP 5: CUSTOMER SIGN-OFF â”€â”€ */}
      {step === 4 && (
        <div className="space-y-5">
          {/* Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-[#B8860B]/10 rounded-lg flex items-center justify-center"><ClipboardCheck size={15} className="text-[#B8860B]"/></div>
              <h3 className="font-bold text-[#1A1A2E] text-sm">Inspection Summary</h3>
              <span className="ml-auto text-[#B8860B] font-bold text-sm">{inspRef}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-0">
              {[['Reference',inspRef],['Vehicle','Toyota Corolla 2018'],['Registration',''],['Mileage','87,542 km'],['Fuel Level',fuelLevel],['Service',''],['Damages Recorded',damages.length > 0 ? damages.join(', ') : 'None'],['Photos Taken',`${photos.length} photos`]].map(([k,v],i)=>(
                <div key={i} className="flex justify-between py-2 border-b border-gray-50 text-sm">
                  <span className="text-gray-400">{k}</span>
                  <span className="font-semibold text-[#1A1A2E] text-right max-w-[60%] truncate">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Declaration */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-[#B8860B]/10 rounded-lg flex items-center justify-center"><Shield size={15} className="text-[#B8860B]"/></div>
              <h3 className="font-bold text-[#1A1A2E] text-sm">Customer Declaration</h3>
            </div>
            <div className="bg-[#B8860B]/5 border border-[#B8860B]/15 rounded-xl p-5 mb-5">
              <p className="text-sm text-gray-600 mb-3">I, <strong className="text-[#1A1A2E]">the customer</strong>, hereby confirm that:</p>
              <ul className="space-y-2">
                {['The vehicle details and inspection report are accurate','The damage recorded existed before the vehicle was handed over to AutoMedic','The accessories and items listed have been handed over','The fuel level and odometer reading recorded are correct','I authorise AutoMedic to proceed with the requested service','I understand AutoMedic is not responsible for valuables left in the vehicle'].map((item,i)=>(
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
                    <span className="text-[#B8860B] font-bold mt-0.5 flex-shrink-0">âœ“</span>{item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Customer Signature */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center"><PenLine size={13} className="text-purple-400"/></div>
                <p className="font-bold text-[#1A1A2E] text-sm">Customer Signature</p>
                <span className="text-xs text-gray-400">â€” finger on mobile, mouse on desktop</span>
              </div>
              <SigPad label="" id="custSigCanvas"/>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Customer Full Name (Print)</label>
                  <input placeholder="Print name here" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B]"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date & Time</label>
                  <input type="datetime-local" defaultValue={new Date().toISOString().slice(0,16)} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B]"/>
                </div>
              </div>
            </div>

            {/* Advisor Signature */}
            <div className="border-t border-gray-100 pt-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center"><User size={13} className="text-blue-400"/></div>
                <p className="font-bold text-[#1A1A2E] text-sm">Service Advisor Signature</p>
              </div>
              <SigPad label="" id="advisorSigCanvas"/>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Advisor Name</label>
                  <input defaultValue="" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B]"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Staff ID</label>
                  <input defaultValue="" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B]"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ NAV BUTTONS â”€â”€ */}
      <div className="flex justify-between items-center mt-6 pt-4">
        <button onClick={back} disabled={step===0}
          className="flex items-center gap-2 px-6 py-3 border border-gray-200 text-gray-600 font-semibold rounded-full hover:bg-gray-50 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm">
          <ChevronLeft size={15}/> Back
        </button>
        <div className="flex gap-3">
          {step < 4 ? (
            <button onClick={next}
              className="flex items-center gap-2 px-7 py-3 bg-[#B8860B] text-white font-semibold rounded-full hover:bg-[#8B6508] transition-all hover:shadow-lg hover:shadow-[#B8860B]/30 text-sm">
              Next <ChevronRight size={15}/>
            </button>
          ) : (
            <>
              <button onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-3 border border-gray-200 text-gray-600 font-semibold rounded-full hover:bg-gray-50 transition-all text-sm">
                <Printer size={14}/> Print Report
              </button>
              <button onClick={submit}
                className="flex items-center gap-2 px-7 py-3 bg-[#B8860B] text-white font-semibold rounded-full hover:bg-[#8B6508] transition-all hover:shadow-lg hover:shadow-[#B8860B]/30 text-sm">
                <CheckCircle size={15}/> Complete & Save
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

