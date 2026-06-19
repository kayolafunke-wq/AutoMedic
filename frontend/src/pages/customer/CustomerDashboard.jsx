import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import {
  Home, Settings, History, FileText, Bell, Calendar, LogOut,
  Car, CheckCircle, Clock, CreditCard, Satellite, MessageCircle,
  ChevronRight, ClipboardCheck, Printer, PenLine, Shield,
  AlertTriangle, Camera, Package, X, Download, Plus
} from 'lucide-react'

/* ─── INVOICE MODAL ─────────────────────────────────── */
function InvoiceModal({ appt, onClose }) {
  if (!appt) return null
  const subtotal = Number(appt.estimated_cost || appt.final_cost || 0)
  const tax   = Math.round(subtotal * 0.165)
  const total = subtotal + tax

  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=800,height=900')
    w.document.write(`<!DOCTYPE html><html><head><title>Invoice ${appt.tracking_number}</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:40px;color:#1A1A2E;font-size:13px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:2px solid #1A1A2E;margin-bottom:24px}
    .logo-sq{width:44px;height:44px;background:#B8860B;color:#fff;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:1rem}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px}
    .row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #eee;font-size:12px}
    table{width:100%;border-collapse:collapse;margin:20px 0}th{background:#f5f3ee;padding:9px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#888}
    td{padding:11px 12px;border-bottom:1px solid #eee;font-size:12px}.totals{width:240px;margin-left:auto}
    .total-row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #eee;font-size:12px}
    .total-final{border-top:2px solid #1A1A2E;border-bottom:none;font-size:14px;font-weight:800;padding-top:9px}
    .footer{margin-top:28px;text-align:center;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:14px}
    @media print{body{padding:20px}}</style></head><body>
    <div class="header">
      <div style="display:flex;align-items:center;gap:10px"><div class="logo-sq">AM</div><div><strong style="font-size:18px">AutoMedic</strong><div style="font-size:11px;color:#888">Area 47, Lilongwe, Malawi</div></div></div>
      <div style="text-align:right"><div style="font-size:22px;font-weight:900">INVOICE</div>
      <div style="color:#B8860B;font-weight:700;margin:4px 0">#${appt.tracking_number}</div>
      <div style="font-size:11px;color:#888">${new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</div>
      <div style="margin-top:6px"><span style="padding:3px 10px;border-radius:50px;font-size:11px;font-weight:700;background:${appt.status==='completed'?'#e8f5e9':'#fff3e0'};color:${appt.status==='completed'?'#2e7d32':'#e65100'}">${appt.status==='completed'?'PAID':'In Progress'}</span></div></div>
    </div>
    <div class="grid2">
      <div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#888;margin-bottom:8px">From</div>
      <strong>AutoMedic Garage</strong><br/>Area 47, Lilongwe, Malawi<br/>+265 999 000 000</div>
      <div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#888;margin-bottom:8px">Bill To</div>
      <strong>${appt.customer_name||'Customer'}</strong><br/>${appt.customer_phone||''}</div>
    </div>
    <div style="background:#f5f3ee;border-radius:8px;padding:10px 14px;margin-bottom:18px;font-size:12px">
      <strong>Vehicle:</strong> ${appt.make||''} ${appt.model||''} &nbsp;|&nbsp; <strong>Reg:</strong> ${appt.registration_number||''} &nbsp;|&nbsp; <strong>Date:</strong> ${appt.preferred_date||''}
    </div>
    <table><thead><tr><th>Description</th><th>Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead>
    <tbody>
      <tr><td>${appt.service_name||'Service'}</td><td>1</td><td style="text-align:right">MK ${Math.round(subtotal*0.7).toLocaleString()}</td><td style="text-align:right;font-weight:700">MK ${Math.round(subtotal*0.7).toLocaleString()}</td></tr>
      <tr><td>Labour Charges</td><td>1</td><td style="text-align:right">MK ${Math.round(subtotal*0.3).toLocaleString()}</td><td style="text-align:right;font-weight:700">MK ${Math.round(subtotal*0.3).toLocaleString()}</td></tr>
    </tbody></table>
    <div class="totals">
      <div class="total-row"><span>Subtotal</span><span>MK ${subtotal.toLocaleString()}</span></div>
      <div class="total-row"><span>VAT (16.5%)</span><span>MK ${tax.toLocaleString()}</span></div>
      <div class="total-row total-final"><span>TOTAL DUE</span><span style="color:#B8860B">MK ${total.toLocaleString()}</span></div>
    </div>
    <div class="footer"><p>Thank you for choosing AutoMedic — Lilongwe's Premier Garage</p></div>
    </body></html>`)
    w.document.close(); w.focus(); setTimeout(() => w.print(), 500)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-16 p-4 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl mb-8" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#B8860B]/10 rounded-xl flex items-center justify-center"><FileText size={16} className="text-[#B8860B]"/></div>
            <div><p className="font-bold text-[#1A1A2E] text-sm">Invoice #{appt.tracking_number}</p><p className="text-xs text-gray-400">{appt.preferred_date}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-4 py-2 bg-[#B8860B] text-white text-xs font-semibold rounded-full hover:bg-[#8B6508] transition-colors"><Printer size={12}/>Print</button>
            <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"><X size={14}/></button>
          </div>
        </div>
        <div className="p-6">
          <div className="flex justify-between items-start mb-6 pb-5 border-b-2 border-[#1A1A2E]">
            <div className="flex items-center gap-3"><div className="w-11 h-11 bg-[#B8860B] rounded-xl flex items-center justify-center text-white font-black">AM</div><div><p className="font-black text-[#1A1A2E] text-lg">AutoMedic</p><p className="text-xs text-gray-400">Garage Management Platform</p></div></div>
            <div className="text-right"><p className="text-2xl font-black text-[#1A1A2E]">INVOICE</p><p className="text-[#B8860B] font-bold text-sm mt-0.5">#{appt.tracking_number}</p><p className="text-xs text-gray-400 mt-1">{new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</p>
              <span className={`inline-block mt-2 text-[10px] font-bold px-2.5 py-1 rounded-full ${appt.status==='completed'?'bg-green-50 text-green-600':'bg-orange-50 text-orange-500'}`}>{appt.status==='completed'?'PAID':'In Progress'}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 mb-5">
            <div><p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">From</p><p className="font-bold text-[#1A1A2E] text-sm">AutoMedic Garage</p><p className="text-xs text-gray-500 mt-1 leading-relaxed">Area 47, Lilongwe, Malawi<br/>+265 999 000 000</p></div>
            <div><p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Bill To</p><p className="font-bold text-[#1A1A2E] text-sm">{appt.customer_name||'Customer'}</p></div>
          </div>
          <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5 text-xs"><span className="font-bold text-gray-600">Vehicle:</span> {appt.make} {appt.model} · <span className="font-bold text-gray-600">Reg:</span> {appt.registration_number} · <span className="font-bold text-gray-600">Date:</span> {appt.preferred_date}</div>
          <table className="w-full text-sm mb-4">
            <thead><tr className="bg-gray-50">{['Description','Qty','Unit Price','Total'].map((h,i)=><th key={h} className={`px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 ${i>1?'text-right':''}`}>{h}</th>)}</tr></thead>
            <tbody>
              <tr className="border-b border-gray-50"><td className="px-3 py-3 text-[#1A1A2E]">{appt.service_name||'Service'}</td><td className="px-3 py-3 text-gray-500 text-center">1</td><td className="px-3 py-3 text-gray-500 text-right">MK {Math.round(subtotal*0.7).toLocaleString()}</td><td className="px-3 py-3 font-bold text-[#1A1A2E] text-right">MK {Math.round(subtotal*0.7).toLocaleString()}</td></tr>
              <tr className="border-b border-gray-50"><td className="px-3 py-3 text-[#1A1A2E]">Labour Charges</td><td className="px-3 py-3 text-gray-500 text-center">1</td><td className="px-3 py-3 text-gray-500 text-right">MK {Math.round(subtotal*0.3).toLocaleString()}</td><td className="px-3 py-3 font-bold text-[#1A1A2E] text-right">MK {Math.round(subtotal*0.3).toLocaleString()}</td></tr>
            </tbody>
          </table>
          <div className="ml-auto w-56 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-semibold">MK {subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">VAT (16.5%)</span><span className="font-semibold">MK {tax.toLocaleString()}</span></div>
            <div className="flex justify-between text-base font-black border-t-2 border-[#1A1A2E] pt-2.5"><span>TOTAL DUE</span><span className="text-[#B8860B]">MK {total.toLocaleString()}</span></div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 text-center"><p className="text-xs text-gray-400">Thank you for choosing AutoMedic — Lilongwe's Premier Garage</p></div>
        </div>
      </div>
    </div>
  )
}

/* ─── STEP PILL ─────────────────────────────────────── */
function StepPill({ done, active, label }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border
      ${done?'bg-green-50 border-green-200 text-green-600':active?'bg-[#B8860B]/10 border-[#B8860B]/30 text-[#B8860B]':'bg-gray-50 border-gray-200 text-gray-400'}`}>
      {done?<CheckCircle size={11}/>:active?<Settings size={11} className="animate-spin"/>:<Clock size={10}/>}
      {label}
    </div>
  )
}

/* ─── SIDEBAR ────────────────────────────────────────── */
function Sidebar({ active, onChange, unread, pendingInspection, logout }) {
  const items = [
    { id:'overview',     icon:Home,          label:'Overview' },
    { id:'repairs',      icon:Settings,      label:'My Repairs' },
    { id:'inspection',   icon:ClipboardCheck,label:'Inspection Sign-Off', badge:pendingInspection?'1':null, badgeColor:'bg-orange-500' },
    { id:'history',      icon:History,       label:'Service History' },
    { id:'invoices',     icon:FileText,      label:'Invoices' },
    { id:'notifications',icon:Bell,          label:'Notifications', badge:unread||null },
  ]
  return (
    <aside className="w-[220px] fixed top-16 left-0 bottom-0 bg-white border-r border-gray-100 flex flex-col py-5 z-40">
      <nav className="flex flex-col gap-0.5 px-3 flex-1">
        {items.map(({id,icon:Icon,label,badge,badgeColor})=>(
          <button key={id} onClick={()=>onChange(id)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left w-full transition-all
              ${active===id?'bg-[#B8860B]/10 text-[#B8860B] font-semibold':'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}>
            <Icon size={16}/><span className="flex-1">{label}</span>
            {badge&&<span className={`${badgeColor||'bg-red-500'} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full`}>{badge}</span>}
          </button>
        ))}
        <Link to="/booking" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all">
          <Calendar size={16}/>Book Service
        </Link>
      </nav>
      <div className="px-3 pt-3 border-t border-gray-100">
        <button onClick={logout} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all w-full">
          <LogOut size={16}/>Logout
        </button>
      </div>
    </aside>
  )
}

/* ─── MAIN DASHBOARD ────────────────────────────────── */
export default function CustomerDashboard() {
  const { user, logout } = useAuth()
  const [section, setSection]       = useState('overview')
  const [appointments, setAppts]    = useState([])
  const [notifications, setNotifs]  = useState([])
  const [loading, setLoading]       = useState(true)
  const [invoiceAppt, setInvoice]   = useState(null)
  const [signed, setSigned]         = useState(false)
  const [signedAt, setSignedAt]     = useState('')
  const sigRef = useRef(null)

  const SECTIONS = ['overview','repairs','inspection','history','invoices','notifications']

  const navTo = (id) => { setSection(id); window.scrollTo(0,0) }

  useEffect(() => {
    const s = localStorage.getItem('am_insp_signed')
    if (s) { setSigned(true); setSignedAt(s) }

    Promise.all([
      api.get('/appointments/my'),
      api.get('/notifications')
    ]).then(([a,n]) => {
      setAppts(a.data.data||[])
      setNotifs(n.data.data||[])
    }).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  const current  = appointments.find(a=>a.status==='in_progress')||appointments.find(a=>a.status==='confirmed')
  const unread   = notifications.filter(n=>!n.is_read).length
  const total    = appointments.length
  const done     = appointments.filter(a=>a.status==='completed').length
  const inProg   = appointments.filter(a=>['in_progress','confirmed'].includes(a.status)).length
  const spent    = appointments.reduce((s,a)=>s+Number(a.estimated_cost||0),0)

  const confirmSign = () => {
    const c = sigRef.current
    if (c) {
      const data = c.getContext('2d').getImageData(0,0,c.width,c.height).data
      const ok = Array.from(data).some((v,i)=>i%4===3&&v>0)
      if (!ok) { alert('Please sign first.'); return }
    }
    const now = new Date().toLocaleString('en-GB',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})
    setSigned(true); setSignedAt(now)
    localStorage.setItem('am_insp_signed', now)
  }

  useEffect(() => {
    const c = sigRef.current; if (!c) return
    const ctx = c.getContext('2d')
    ctx.strokeStyle='#1A1A2E'; ctx.lineWidth=2.5; ctx.lineCap='round'
    let drawing=false
    const pos=(e)=>{const r=c.getBoundingClientRect(),sx=c.width/r.width,sy=c.height/r.height;const s=e.touches?.[0]||e;return{x:(s.clientX-r.left)*sx,y:(s.clientY-r.top)*sy}}
    const d=(e)=>{drawing=true;const p=pos(e);ctx.beginPath();ctx.moveTo(p.x,p.y)}
    const m=(e)=>{if(!drawing)return;const p=pos(e);ctx.lineTo(p.x,p.y);ctx.stroke()}
    const u=()=>{drawing=false}
    c.addEventListener('mousedown',d);c.addEventListener('mousemove',m);c.addEventListener('mouseup',u);c.addEventListener('mouseleave',u)
    c.addEventListener('touchstart',(e)=>{e.preventDefault();d(e)},{passive:false})
    c.addEventListener('touchmove',(e)=>{e.preventDefault();m(e)},{passive:false})
    c.addEventListener('touchend',u)
    return()=>{c.removeEventListener('mousedown',d);c.removeEventListener('mousemove',m)}
  }, [section])

  if (loading) return (
    <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
      <div className="text-center"><div className="w-12 h-12 border-4 border-[#B8860B] border-t-transparent rounded-full animate-spin mx-auto mb-3"/><p className="text-gray-400 text-sm">Loading your dashboard...</p></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {invoiceAppt && <InvoiceModal appt={invoiceAppt} onClose={()=>setInvoice(null)}/>}

      {/* TOPBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-gray-100 shadow-sm flex items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#B8860B] rounded-lg flex items-center justify-center text-white font-black text-xs">AM</div>
          <span className="font-black text-[#1A1A2E] text-lg">AutoMedic</span>
        </Link>
        <div className="flex items-center gap-2.5">
          {current&&<span className="bg-orange-50 text-orange-500 text-xs font-bold px-3 py-1.5 rounded-full border border-orange-100">Active Repair</span>}
          <Link to="/" className="text-xs text-gray-500 hover:text-[#B8860B] transition-colors font-medium px-2">← Back to Site</Link>
          <Link to="/track" className="flex items-center gap-1.5 px-4 py-2 bg-[#B8860B] text-white text-xs font-semibold rounded-full hover:bg-[#8B6508] transition-all hover:shadow-lg hover:shadow-[#B8860B]/30">
            <Satellite size={13}/>Track Vehicle
          </Link>
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden"
            style={{background:'#B8860B'}}>
            {user?.photoURL
              ? <img src={user.photoURL} alt="" className="w-full h-full object-cover"/>
              : <>{user?.name?.charAt(0)}{user?.name?.split(' ')[1]?.charAt(0)||''}</>}
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        <Sidebar active={section} onChange={navTo} unread={unread} pendingInspection={!signed} logout={logout}/>
        <main className="ml-[220px] flex-1 p-7">

          {/* ── OVERVIEW ── */}
          {section==='overview'&&(
            <div>
              <div className="flex justify-between items-start mb-7">
                <div><h1 className="font-display text-2xl font-bold text-[#1A1A2E]">Welcome back, {user?.displayName||user?.name||'there'} 👋</h1><p className="text-gray-400 text-sm mt-0.5">Here's your vehicle service overview</p></div>
                <Link to="/booking" className="flex items-center gap-2 px-5 py-2.5 bg-[#B8860B] text-white text-sm font-semibold rounded-full hover:bg-[#8B6508] transition-all hover:shadow-lg hover:shadow-[#B8860B]/30">
                  <Plus size={15}/>New Booking
                </Link>
              </div>
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[[Car,total,'Total Services','bg-blue-50 text-blue-500'],[CheckCircle,done,'Completed','bg-green-50 text-green-500'],[Clock,inProg,'In Progress','bg-orange-50 text-orange-500'],[CreditCard,`MK ${(spent/1000).toFixed(0)}K`,'Total Spent','bg-pink-50 text-pink-500']].map(([Icon,val,lbl,cls],i)=>(
                  <div key={i} className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm border border-gray-50">
                    <div className={`w-12 h-12 ${cls} rounded-xl flex items-center justify-center flex-shrink-0`}><Icon size={20}/></div>
                    <div><div className="text-2xl font-black text-[#1A1A2E] leading-none">{val}</div><div className="text-xs text-gray-400 mt-1">{lbl}</div></div>
                  </div>
                ))}
              </div>
              {total===0?(
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-50">
                  <div className="w-20 h-20 bg-[#B8860B]/10 rounded-full flex items-center justify-center mx-auto mb-4"><Car size={32} className="text-[#B8860B]"/></div>
                  <h3 className="font-bold text-[#1A1A2E] text-lg mb-2">No services yet</h3>
                  <p className="text-gray-400 text-sm mb-6">Book your first service appointment with AutoMedic</p>
                  <Link to="/booking" className="inline-flex items-center gap-2 px-6 py-3 bg-[#B8860B] text-white font-semibold rounded-full hover:bg-[#8B6508] transition-all text-sm">
                    <Calendar size={15}/>Book an Appointment
                  </Link>
                </div>
              ):(
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {id:'repairs',icon:Settings,bg:'bg-orange-50',color:'text-orange-500',title:'Current Repair',desc:current?`${current.make} ${current.model} — ${current.service_name}`:'No active repairs',badge:current?`${current.progress||0}%`:null,alert:false},
                    {id:'inspection',icon:ClipboardCheck,bg:!signed?'bg-amber-50':'bg-green-50',color:!signed?'text-amber-600':'text-green-500',title:'Inspection Sign-Off',desc:!signed?'⚠ Awaiting your signature':'✓ Signed & confirmed',alert:!signed},
                    {id:'history',icon:History,bg:'bg-green-50',color:'text-green-500',title:'Service History',desc:`${total} service${total!==1?'s':''}${total>0?` — last on ${appointments[0]?.preferred_date}`:''}`},
                    {id:'invoices',icon:FileText,bg:'bg-purple-50',color:'text-purple-500',title:'Invoices',desc:`${total} invoice${total!==1?'s':''} available`},
                  ].map(({id,icon:Icon,bg,color,title,desc,badge,alert})=>(
                    <button key={id} onClick={()=>navTo(id)}
                      className={`bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm border hover:shadow-md hover:-translate-y-0.5 transition-all text-left w-full
                        ${alert?'border-amber-200 bg-amber-50/40':'border-gray-50'}`}>
                      <div className={`w-14 h-14 ${bg} ${color} rounded-xl flex items-center justify-center flex-shrink-0`}><Icon size={22}/></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#1A1A2E] text-sm">{title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{desc}
                          {badge&&<span className="ml-1.5 bg-orange-100 text-orange-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{badge}</span>}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 flex-shrink-0"/>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── MY REPAIRS ── */}
          {section==='repairs'&&(
            <div>
              <div className="mb-6"><h1 className="font-display text-2xl font-bold text-[#1A1A2E]">My Repairs</h1><p className="text-gray-400 text-sm">Current and recent repair jobs</p></div>
              {!current?(
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><Settings size={28} className="text-gray-400"/></div>
                  <h3 className="font-bold text-[#1A1A2E] mb-2">No active repairs</h3>
                  <p className="text-gray-400 text-sm mb-5">You don't have any ongoing repairs at the moment.</p>
                  <Link to="/booking" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#B8860B] text-white font-semibold rounded-full text-sm hover:bg-[#8B6508] transition-all">
                    Book a Service
                  </Link>
                </div>
              ):(
                <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
                  <div className="flex justify-between items-center px-6 pt-5 pb-0">
                    <h2 className="font-bold text-[#1A1A2E]">Current Repair — {current.make} {current.model} ({current.registration_number})</h2>
                    <span className="bg-orange-50 text-orange-500 text-xs font-bold px-3 py-1.5 rounded-full border border-orange-100 capitalize">{current.status?.replace('_',' ')}</span>
                  </div>
                  <div className="flex gap-6 p-6">
                    <div className="w-56 h-40 bg-gradient-to-br from-[#1A1A2E] to-[#0F3460] rounded-2xl flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(184,134,11,0.2),transparent_70%)]"/>
                      <span className="text-6xl relative z-10">🚗</span>
                    </div>
                    <div className="flex-1">
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        {[['TRACKING #',current.tracking_number],['SERVICE',current.service_name],['TECHNICIAN',current.technician_name||'Assigned'],['STARTED',current.preferred_date],['EST. COMPLETE','TBD'],['EST. COST',current.estimated_cost?`MK ${Number(current.estimated_cost).toLocaleString()}`:'TBD']].map(([k,v],i)=>(
                          <div key={i}><p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{k}</p>
                          <p className={`text-sm font-bold ${k==='EST. COST'?'text-[#B8860B]':'text-[#1A1A2E]'}`}>{v}</p></div>
                        ))}
                      </div>
                      <div className="mb-4">
                        <div className="flex justify-between text-xs font-semibold mb-1.5"><span className="text-gray-600">Repair Progress</span><span className="text-[#B8860B] font-bold">{current.progress||0}%</span></div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#B8860B] to-yellow-400 rounded-full" style={{width:`${current.progress||0}%`}}/></div>
                      </div>
                      <div className="flex gap-2 flex-wrap mb-4">
                        {[['Appointment',true],['Received',['confirmed','in_progress'].includes(current.status)],['Inspection',['in_progress'].includes(current.status)],['Diagnosis',['in_progress'].includes(current.status)],['Repair',current.status==='in_progress'],['Quality Check',current.status==='quality_check'],['Ready',current.status==='ready']].map(([lbl,isDone],i)=>(
                          <StepPill key={i} done={isDone&&current.status!==lbl.toLowerCase()} active={false} label={lbl}/>
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <Link to={`/track/${current.tracking_number}`} className="flex items-center gap-2 px-5 py-2.5 bg-[#B8860B] text-white text-sm font-semibold rounded-full hover:bg-[#8B6508] transition-all">
                          <Satellite size={14}/>Full Tracking
                        </Link>
                        <a href="https://wa.me/265999000000" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white text-sm font-semibold rounded-full hover:bg-green-600 transition-all">
                          <MessageCircle size={14}/>WhatsApp Update
                        </a>
                        {current.estimated_cost&&<button onClick={()=>setInvoice(current)} className="flex items-center gap-2 px-5 py-2.5 border-2 border-[#B8860B] text-[#B8860B] text-sm font-semibold rounded-full hover:bg-[#B8860B] hover:text-white transition-all">
                          <FileText size={14}/>View Invoice
                        </button>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── INSPECTION ── */}
          {section==='inspection'&&(
            <div>
              <div className="mb-6"><h1 className="font-display text-2xl font-bold text-[#1A1A2E]">Inspection Sign-Off</h1><p className="text-gray-400 text-sm">Review and digitally confirm your vehicle inspection report</p></div>
              {!signed&&<div className="flex items-start gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6">
                <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5"/>
                <div><p className="font-bold text-amber-700 text-sm">Action Required — Please Review & Sign</p><p className="text-xs text-amber-600/80 mt-0.5">AutoMedic has completed a vehicle inspection. Please review and confirm by signing digitally.</p></div>
              </div>}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
                  <div className="flex items-center gap-3"><div className="w-10 h-10 bg-[#B8860B]/10 rounded-xl flex items-center justify-center"><ClipboardCheck size={18} className="text-[#B8860B]"/></div>
                    <div><h2 className="font-bold text-[#1A1A2E] text-sm">Vehicle Inspection Report</h2><p className="text-xs text-gray-400">Area 47 Workshop</p></div>
                  </div>
                  {signed?<span className="flex items-center gap-1.5 bg-green-50 text-green-600 text-xs font-bold px-3 py-1.5 rounded-full border border-green-100"><CheckCircle size={12}/>Signed</span>
                  :<span className="bg-blue-50 text-blue-500 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-100">Awaiting Signature</span>}
                </div>
                <div className="p-6 space-y-5">
                  {current?(
                    <div className="grid grid-cols-2 gap-x-8 gap-y-0">
                      {[['Vehicle',`${current.make} ${current.model}`],['Registration',current.registration_number],['Service',current.service_name],['Technician',current.technician_name||'TBD']].map(([k,v],i)=>(
                        <div key={i} className="flex justify-between py-2.5 border-b border-gray-50 text-sm"><span className="text-gray-400">{k}</span><span className="font-semibold text-[#1A1A2E]">{v}</span>
                        </div>
                      ))}
                    </div>
                  ):<p className="text-sm text-gray-400 text-center py-4">No active inspection at this time.</p>}
                  <div className="bg-[#B8860B]/5 border border-[#B8860B]/15 rounded-xl p-5">
                    <p className="text-sm text-gray-600 mb-3">By signing below, <strong className="text-[#1A1A2E]">{user?.displayName||user?.name}</strong>, I confirm that the vehicle details are accurate and I authorise AutoMedic to proceed with the requested service.</p>
                    <ul className="space-y-1.5">{['The vehicle inspection report is accurate','The damage recorded existed before handover','The accessories listed have been handed over','I authorise AutoMedic to proceed with the service'].map((t,i)=><li key={i} className="flex items-start gap-2 text-xs text-gray-500"><span className="text-[#B8860B] font-bold mt-0.5 flex-shrink-0">✓</span>{t}</li>)}</ul>
                  </div>
                  {!signed?(
                    <div>
                      <div className="flex items-center gap-2 mb-3"><div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center"><PenLine size={13} className="text-purple-400"/></div><p className="font-bold text-[#1A1A2E] text-sm">Your Signature</p><span className="text-xs text-gray-400">— finger on mobile, mouse on desktop</span></div>
                      <div className="border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:border-[#B8860B] transition-colors overflow-hidden relative">
                        <canvas ref={sigRef} width={580} height={150} className="w-full cursor-crosshair touch-none block" style={{height:150}}/>
                        <p className="absolute bottom-2 left-3 text-[10px] text-gray-300 pointer-events-none select-none">Sign here ✍</p>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button onClick={()=>{const c=sigRef.current;if(c)c.getContext('2d').clearRect(0,0,c.width,c.height)}} className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-full text-xs font-semibold text-gray-500 hover:bg-gray-50"><X size={12}/>Clear</button>
                        <button onClick={confirmSign} className="flex items-center gap-1.5 px-5 py-2 bg-[#B8860B] text-white rounded-full text-xs font-semibold hover:bg-[#8B6508] transition-colors"><CheckCircle size={12}/>Confirm Signature</button>
                        <a href="https://wa.me/265999000000" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-5 py-2 bg-green-500 text-white rounded-full text-xs font-semibold hover:bg-green-600 transition-colors"><MessageCircle size={12}/>Ask a Question</a>
                      </div>
                    </div>
                  ):(
                    <div className="flex flex-col items-center py-6 gap-3">
                      <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center"><CheckCircle size={32} className="text-green-500"/></div>
                      <p className="font-bold text-green-600 text-lg">Inspection Confirmed & Signed</p>
                      <p className="text-xs text-gray-400">Signed by <strong>{user?.displayName||user?.name}</strong> on {signedAt}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── SERVICE HISTORY ── */}
          {section==='history'&&(
            <div>
              <div className="mb-6"><h1 className="font-display text-2xl font-bold text-[#1A1A2E]">Service History</h1><p className="text-gray-400 text-sm">All your past and current repairs</p></div>
              {appointments.length===0?(
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm"><div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><History size={28} className="text-gray-400"/></div><h3 className="font-bold text-[#1A1A2E] mb-2">No service history yet</h3><p className="text-gray-400 text-sm">Your service history will appear here after your first appointment.</p></div>
              ):(
                <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
                  <table className="w-full text-sm"><thead><tr className="bg-gray-50/80">{['#','Vehicle','Service','Date','Cost','Status','Invoice'].map(h=><th key={h} className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</th>)}</tr></thead>
                  <tbody>{appointments.map((a,i)=>(
                    <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-[#B8860B] text-xs">{a.tracking_number}</td>
                      <td className="px-4 py-3.5 font-medium text-[#1A1A2E] text-xs">{a.make} {a.model} <span className="text-gray-400">{a.registration_number}</span></td>
                      <td className="px-4 py-3.5 text-gray-500 text-xs">{a.service_name||'—'}</td>
                      <td className="px-4 py-3.5 text-gray-400 text-xs">{a.preferred_date}</td>
                      <td className="px-4 py-3.5 font-semibold text-xs">{a.estimated_cost?`MK ${Number(a.estimated_cost).toLocaleString()}`:'TBD'}</td>
                      <td className="px-4 py-3.5"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${a.status==='completed'?'bg-green-50 text-green-600 border border-green-100':'bg-orange-50 text-orange-500 border border-orange-100'}`}>{a.status?.replace('_',' ')}</span></td>
                      <td className="px-4 py-3.5">{a.estimated_cost&&<button onClick={()=>setInvoice(a)} className="text-[10px] font-semibold text-[#B8860B] border border-[#B8860B]/30 px-2.5 py-1.5 rounded-lg hover:bg-[#B8860B]/5 transition-colors flex items-center gap-1"><Printer size={10}/>View</button>}</td>
                    </tr>
                  ))}</tbody></table>
                </div>
              )}
            </div>
          )}

          {/* ── INVOICES ── */}
          {section==='invoices'&&(
            <div>
              <div className="mb-6"><h1 className="font-display text-2xl font-bold text-[#1A1A2E]">Invoices</h1></div>
              {appointments.filter(a=>a.estimated_cost).length===0?(
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm"><div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><FileText size={28} className="text-gray-400"/></div><h3 className="font-bold text-[#1A1A2E] mb-2">No invoices yet</h3><p className="text-gray-400 text-sm">Invoices will appear here after services are completed.</p></div>
              ):(
                <div className="grid grid-cols-2 gap-5">
                  {appointments.filter(a=>a.estimated_cost).map((a,i)=>(
                    <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50">
                      <div className="flex justify-between items-start mb-3"><div className="flex items-center gap-2"><span className="font-bold text-[#1A1A2E] text-sm">#{a.tracking_number}</span><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${a.status==='completed'?'bg-green-50 text-green-600':'bg-orange-50 text-orange-500'}`}>{a.status==='completed'?'Paid':'In Progress'}</span></div><span className="font-black text-[#B8860B]">MK {Number(a.estimated_cost).toLocaleString()}</span></div>
                      <p className="text-sm text-gray-500 mb-1">{a.service_name} — {a.make} {a.model}</p>
                      <p className="text-xs text-gray-400 mb-4 flex items-center gap-1"><Calendar size={11}/>{a.preferred_date}</p>
                      <button onClick={()=>setInvoice(a)} className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#B8860B] text-white text-sm font-semibold rounded-xl hover:bg-[#8B6508] transition-colors">
                        <Printer size={14}/>View Invoice
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {section==='notifications'&&(
            <div>
              <div className="mb-6"><h1 className="font-display text-2xl font-bold text-[#1A1A2E]">Notifications</h1></div>
              {notifications.length===0?(
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm"><div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><Bell size={28} className="text-gray-400"/></div><h3 className="font-bold text-[#1A1A2E] mb-2">No notifications</h3><p className="text-gray-400 text-sm">You'll see updates about your vehicles here.</p></div>
              ):(
                <div className="space-y-3">
                  {notifications.map((n,i)=>(
                    <div key={i} className={`flex items-start gap-4 p-5 rounded-2xl border-[1.5px] transition-colors ${!n.is_read?'bg-[#B8860B]/3 border-[#B8860B]/15':'bg-white border-gray-100'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${!n.is_read?'bg-[#B8860B] text-white':'bg-gray-100 text-gray-400'}`}><Bell size={16}/></div>
                      <div className="flex-1"><div className="flex justify-between items-start"><p className="font-bold text-[#1A1A2E] text-sm">{n.title}</p>{!n.is_read&&<span className="w-2 h-2 bg-[#B8860B] rounded-full flex-shrink-0 mt-1.5 ml-2"/>}</div><p className="text-xs text-gray-500 mt-0.5">{n.message}</p><p className="text-[10px] text-gray-300 mt-1.5">{new Date(n.created_at).toLocaleDateString('en-GB')}</p></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
