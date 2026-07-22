import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useGarageSettings } from '../../hooks/useGarageSettings'
import { useTrackingSocket } from '../../hooks/useTrackingSocket'
import WhatsAppIcon from '../../components/icons/WhatsAppIcon'
import api from '../../services/api'
import {
  Home, Settings, History, FileText, Bell, Calendar, LogOut,
  Car, CheckCircle, Clock, CreditCard, Satellite,
  ChevronRight, ClipboardCheck, Printer, PenLine, Shield,
  AlertTriangle, Camera, Package, X, Download, Plus, Globe, Menu
} from 'lucide-react'
import InspectionReportDetails from '../../components/InspectionReportDetails'

/* ─── INVOICE MODAL ─────────────────────────────────── */
function InvoiceModal({ invoice, onClose, settings }) {
  if (!invoice) return null
  
  // Use provided settings or fallback
  const safeSettings = settings || {
    garage_name: 'AutoMedic Garage',
    phone: '+265 999 000 000',
    address: 'Area 47, Lilongwe, Malawi',
  }

  const refNum   = invoice.invoice_number || invoice.tracking_number
  const subtotal = Number(invoice.subtotal ?? invoice.estimated_cost ?? invoice.final_cost ?? 0)
  const tax      = Number(invoice.tax ?? Math.round(subtotal * 0.165))
  const total    = Number(invoice.total ?? subtotal + tax)
  const isPaid   = invoice.status === 'paid' || invoice.status === 'completed'
  const lineItems = (() => {
    if (invoice.items) {
      try {
        const parsed = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items
        if (Array.isArray(parsed) && parsed.length) return parsed
      } catch {}
    }
    return [
      { description: invoice.service_name || 'Service', qty: 1, unit_price: Math.round(subtotal * 0.7) },
      { description: 'Labour Charges', qty: 1, unit_price: Math.round(subtotal * 0.3) },
    ]
  })()

  const handlePrint = () => {
    const rows = lineItems.map(i => {
      const lineTotal = Number(i.qty || 1) * Number(i.unit_price || 0)
      return `<tr><td>${i.description}</td><td>${i.qty || 1}</td><td style="text-align:right">MK ${Number(i.unit_price || 0).toLocaleString()}</td><td style="text-align:right;font-weight:700">MK ${lineTotal.toLocaleString()}</td></tr>`
    }).join('')
    const w = window.open('', '_blank', 'width=800,height=900')
    w.document.write(`<!DOCTYPE html><html><head><title>Invoice ${refNum}</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:40px;color:#1A1A2E;font-size:13px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:2px solid #1A1A2E;margin-bottom:24px}
    .logo-sq{width:44px;height:44px;background:#B8860B;color:#fff;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:1rem}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px}
    table{width:100%;border-collapse:collapse;margin:20px 0}th{background:#f5f3ee;padding:9px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#888}
    td{padding:11px 12px;border-bottom:1px solid #eee;font-size:12px}.totals{width:240px;margin-left:auto}
    .total-row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #eee;font-size:12px}
    .total-final{border-top:2px solid #1A1A2E;border-bottom:none;font-size:14px;font-weight:800;padding-top:9px}
    .footer{margin-top:28px;text-align:center;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:14px}
    @media print{body{padding:20px}}</style></head><body>
    <div class="header">
      <div style="display:flex;align-items:center;gap:10px"><div class="logo-sq">AM</div><div><strong style="font-size:18px">${safeSettings.garage_name}</strong><div style="font-size:11px;color:#888">${safeSettings.address}</div></div></div>
      <div style="text-align:right"><div style="font-size:22px;font-weight:900">INVOICE</div>
      <div style="color:#B8860B;font-weight:700;margin:4px 0">#${refNum}</div>
      <div style="font-size:11px;color:#888">${new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</div>
      <div style="margin-top:6px"><span style="padding:3px 10px;border-radius:50px;font-size:11px;font-weight:700;background:${isPaid?'#e8f5e9':'#fff3e0'};color:${isPaid?'#2e7d32':'#e65100'}">${isPaid?'PAID':'Unpaid'}</span></div></div>
    </div>
    <div class="grid2">
      <div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#888;margin-bottom:8px">From</div>
      <strong>${safeSettings.garage_name}</strong><br/>${safeSettings.address}<br/>${safeSettings.phone}</div>
      <div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#888;margin-bottom:8px">Bill To</div>
      <strong>${invoice.customer_name||'Customer'}</strong><br/>${invoice.customer_phone||''}</div>
    </div>
    <div style="background:#f5f3ee;border-radius:8px;padding:10px 14px;margin-bottom:18px;font-size:12px">
      <strong>Vehicle:</strong> ${invoice.make||''} ${invoice.model||''} &nbsp;|&nbsp; <strong>Reg:</strong> ${invoice.registration_number||''} &nbsp;|&nbsp; <strong>Date:</strong> ${invoice.preferred_date||''}
    </div>
    <table><thead><tr><th>Description</th><th>Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead>
    <tbody>${rows}</tbody></table>
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
            <div><p className="font-bold text-[#1A1A2E] text-sm">Invoice #{refNum}</p><p className="text-xs text-gray-400">{invoice.preferred_date || new Date(invoice.created_at).toLocaleDateString('en-GB')}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-4 py-2 bg-[#B8860B] text-white text-xs font-semibold rounded-full hover:bg-[#8B6508] transition-colors"><Printer size={12}/>Print</button>
            <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"><X size={14}/></button>
          </div>
        </div>
        <div className="p-6">
          <div className="flex justify-between items-start mb-6 pb-5 border-b-2 border-[#1A1A2E]">
            <div className="flex items-center gap-3"><div className="w-11 h-11 bg-[#B8860B] rounded-xl flex items-center justify-center text-white font-black">AM</div><div><p className="font-black text-[#1A1A2E] text-lg">AutoMedic</p><p className="text-xs text-gray-400">Garage Management Platform</p></div></div>
            <div className="text-right"><p className="text-2xl font-black text-[#1A1A2E]">INVOICE</p><p className="text-[#B8860B] font-bold text-sm mt-0.5">#{refNum}</p>
              <span className={`inline-block mt-2 text-[10px] font-bold px-2.5 py-1 rounded-full ${isPaid?'bg-green-50 text-green-600':'bg-orange-50 text-orange-500'}`}>{isPaid?'PAID':invoice.status==='partial'?'Partial':'Unpaid'}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 mb-5">
            <div><p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">From</p><p className="font-bold text-[#1A1A2E] text-sm">{safeSettings.garage_name}</p><p className="text-xs text-gray-500 mt-1 leading-relaxed">{safeSettings.address}<br/>{safeSettings.phone}</p></div>
            <div><p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Bill To</p><p className="font-bold text-[#1A1A2E] text-sm">{invoice.customer_name||'Customer'}</p></div>
          </div>
          {(invoice.make || invoice.registration_number) && (
            <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5 text-xs"><span className="font-bold text-gray-600">Vehicle:</span> {invoice.make} {invoice.model} · <span className="font-bold text-gray-600">Reg:</span> {invoice.registration_number}</div>
          )}
          <table className="w-full text-sm mb-4">
            <thead><tr className="bg-gray-50">{['Description','Qty','Unit Price','Total'].map((h,i)=><th key={h} className={`px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 ${i>1?'text-right':''}`}>{h}</th>)}</tr></thead>
            <tbody>
              {lineItems.map((item, i) => {
                const lineTotal = Number(item.qty || 1) * Number(item.unit_price || 0)
                return (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-3 py-3 text-[#1A1A2E]">{item.description}</td>
                    <td className="px-3 py-3 text-gray-500 text-center">{item.qty || 1}</td>
                    <td className="px-3 py-3 text-gray-500 text-right">MK {Number(item.unit_price || 0).toLocaleString()}</td>
                    <td className="px-3 py-3 font-bold text-[#1A1A2E] text-right">MK {lineTotal.toLocaleString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="ml-auto w-56 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-semibold">MK {subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">VAT (16.5%)</span><span className="font-semibold">MK {tax.toLocaleString()}</span></div>
            <div className="flex justify-between text-base font-black border-t-2 border-[#1A1A2E] pt-2.5"><span>TOTAL DUE</span><span className="text-[#B8860B]">MK {total.toLocaleString()}</span></div>
          </div>
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
function Sidebar({ active, onChange, unread, pendingInspection, unpaidInvoices, logout, sidebarOpen, setSidebarOpen }) {
  const items = [
    { id:'overview',     icon:Home,          label:'Overview' },
    { id:'repairs',      icon:Settings,      label:'My Repairs' },
    { id:'inspection',   icon:ClipboardCheck,label:'Inspection', badge:pendingInspection?'1':null, badgeColor:'bg-orange-500' },
    { id:'history',      icon:History,       label:'Service History' },
    { id:'invoices',     icon:FileText,      label:'Invoices', badge:unpaidInvoices||null, badgeColor:'bg-red-500' },
    { id:'notifications',icon:Bell,          label:'Notifications', badge:unread||null },
  ]

  const closeSidebar = () => setSidebarOpen(false)
  
  return (
    <>
      {/* Sidebar */}
      <aside className={`
        w-[220px] bg-white border-r border-gray-100 flex flex-col py-5 z-40 fixed top-16 left-0 bottom-0 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Mobile sidebar header */}
        <div className="flex items-center justify-between mb-4 px-3 lg:hidden">
          <span className="text-gray-700 font-semibold text-sm">Menu</span>
          <button
            onClick={closeSidebar}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5 px-3 flex-1">
          {items.map(({id,icon:Icon,label,badge,badgeColor})=>(
            <button key={id} onClick={() => {
              onChange(id)
              closeSidebar()
            }}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left w-full transition-all
                ${active===id?'bg-[#B8860B]/10 text-[#B8860B] font-semibold':'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}>
              <Icon size={16}/><span className="flex-1">{label}</span>
              {badge&&<span className={`${badgeColor||'bg-red-500'} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full`}>{badge}</span>}
            </button>
          ))}
          <Link to="/booking" onClick={closeSidebar} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all">
            <Calendar size={16}/>Book Service
          </Link>
        </nav>
        <div className="px-3 pt-3 border-t border-gray-100">
          <Link to="/" onClick={closeSidebar} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all w-full mb-1">
            <Globe size={16}/>Back to Website
          </Link>
          <button onClick={logout} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all w-full">
            <LogOut size={16}/>Logout
          </button>
        </div>
      </aside>
    </>
  )
}

/* ─── MAIN DASHBOARD ────────────────────────────────── */
export default function CustomerDashboard() {
  const { user, logout } = useAuth()
  const { settings } = useGarageSettings()
  
  // Safety check for settings
  const safeSettings = settings || {
    garage_name: 'AutoMedic Garage',
    phone: '+265 999 000 000',
    address: 'Area 47, Lilongwe, Malawi',
  }
  const [section, setSection]       = useState('overview')
  const [appointments, setAppts]    = useState([])
  const [invoices, setInvoices]     = useState([])
  const [notifications, setNotifs]  = useState([])
  const [loading, setLoading]       = useState(true)
  const [selectedInvoice, setInvoice] = useState(null)
  const [signed, setSigned]         = useState(false)
  const [signedAt, setSignedAt]     = useState('')
  const [pendingInspection, setPendingInspection] = useState(null)
  const [activeInspection, setActiveInspection]   = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const sigRef = useRef(null)

  const SECTIONS = ['overview','repairs','inspection','history','invoices','notifications']

  const navTo = (id) => { 
    setSection(id); 
    window.scrollTo(0,0);
    
    // Mark notifications as read when user views notifications section
    if (id === 'notifications' && notifications.some(n => !n.is_read)) {
      markNotificationsAsRead();
    }
  }
  
  const markNotificationsAsRead = async () => {
    try {
      await api.patch('/notifications/read-all/all');
      // Update local state to mark all notifications as read
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
    }
  }
  const [refreshing, setRefreshing] = useState(false)

  const loadData = (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    Promise.all([
      api.get('/appointments/my'),
      api.get('/invoices/my').catch(() => ({ data: { data: [] } })),
      api.get('/notifications'),
      api.get('/inspections/my').catch(() => ({ data: { data: [] } })),
    ]).then(async ([a, inv, n, insp]) => {
      setAppts(a.data.data || [])
      setInvoices(inv.data.data || [])
      setNotifs(n.data.data || [])

      const list = insp.data.data || []
      const latest = list.find(i => i.advisor_signature && ['pending','customer_signed','completed'].includes(i.status)) || null

      if (latest) {
        try {
          const detailRes = await api.get(`/inspections/${latest.id}`)
          const fullInsp = detailRes.data.data
          setActiveInspection(fullInsp)
          if (fullInsp.status === 'pending') {
            setPendingInspection(fullInsp)
            setSigned(false)
            setSignedAt('')
          } else if ((fullInsp.status === 'customer_signed' || fullInsp.status === 'completed') && fullInsp.customer_signed_at) {
            setPendingInspection(null)
            setSigned(true)
            setSignedAt(new Date(fullInsp.customer_signed_at).toLocaleString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            }))
          } else {
            setPendingInspection(null)
            setSigned(false)
            setSignedAt('')
            setActiveInspection(null)
          }
        } catch {
          // Fallback if detail load fails
          setActiveInspection(latest)
          if (latest.status === 'pending') {
            setPendingInspection(latest)
            setSigned(false)
            setSignedAt('')
          } else if ((latest.status === 'customer_signed' || latest.status === 'completed') && latest.customer_signed_at) {
            setPendingInspection(null)
            setSigned(true)
            setSignedAt(new Date(latest.customer_signed_at).toLocaleString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            }))
          } else {
            setPendingInspection(null)
            setSigned(false)
            setSignedAt('')
            setActiveInspection(null)
          }
        }
      } else {
        setActiveInspection(null)
        setPendingInspection(null)
        setSigned(false)
        setSignedAt('')
      }
    }).catch(() => {}).finally(() => { setLoading(false); setRefreshing(false) })
  }

  // Load data on mount
  useEffect(() => { loadData() }, [])

  const handleLiveUpdate = useCallback(({ tracking, progress, status }) => {
    setAppts(prev => prev.map(a =>
      a.tracking_number === tracking
        ? { ...a, progress: progress ?? a.progress, job_status: status ?? a.job_status, status: status === 'completed' ? 'completed' : a.status }
        : a
    ))
  }, [])

  useTrackingSocket({ customerId: user?.id, onUpdate: handleLiveUpdate })

  const current  = appointments.find(a=>a.status==='in_progress')||appointments.find(a=>a.status==='confirmed')
  const unread   = notifications.filter(n=>!n.is_read).length
  const total    = appointments.length
  const done     = appointments.filter(a=>a.status==='completed').length
  const inProg   = appointments.filter(a=>['in_progress','confirmed'].includes(a.status)).length
  const spent    = invoices.reduce((s, i) => s + Number(i.total || 0), 0) ||
                   appointments.reduce((s,a)=>s+Number(a.estimated_cost||0),0)

  const confirmSign = async () => {
    const c = sigRef.current
    if (c) {
      const data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
      const ok = Array.from(data).some((v, i) => i % 4 === 3 && v > 0)
      if (!ok) { alert('Please sign first.'); return }
    }

    if (pendingInspection) {
      try {
        const signatureData = c ? c.toDataURL('image/png') : 'signed'
        await api.patch(`/inspections/${pendingInspection.id}/sign`, {
          customer_signature: signatureData
        })
        const now = new Date().toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        setSigned(true)
        setSignedAt(now)
        setPendingInspection(null)
        setActiveInspection(prev => prev ? { ...prev, status: 'customer_signed', customer_signature: signatureData, customer_signed_at: new Date().toISOString() } : null)
      } catch (err) {
        console.error('Failed to save signature:', err)
        alert('Failed to save signature: ' + (err.response?.data?.message || err.message))
      }
    }
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
      {selectedInvoice && <InvoiceModal invoice={selectedInvoice} onClose={()=>setInvoice(null)} settings={safeSettings}/>}
      
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* TOPBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-gray-100 shadow-sm flex items-center justify-between px-4 lg:px-6">
        {/* Left side - Brand and mobile menu */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger menu */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu size={18} />
          </button>
          
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#B8860B] rounded-lg flex items-center justify-center text-white font-black text-xs">AM</div>
            <span className="font-black text-[#1A1A2E] text-lg">AutoMedic</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-1.5 md:gap-2.5">
          {current&&<span className="hidden sm:inline bg-orange-50 text-orange-500 text-xs font-bold px-3 py-1.5 rounded-full border border-orange-100">Active Repair</span>}
          <Link to="/" className="hidden sm:flex items-center gap-1.5 px-3 md:px-4 py-2 border border-gray-200 text-gray-600 text-xs font-semibold rounded-full hover:border-[#B8860B] hover:text-[#B8860B] transition-all">
            <span>←</span> <span className="hidden md:inline">Back to Site</span><span className="md:hidden">Site</span>
          </Link>
          <Link to="/track" className="flex items-center gap-1.5 px-3 md:px-4 py-2 bg-[#B8860B] text-white text-xs font-semibold rounded-full hover:bg-[#8B6508] transition-all">
            <Satellite size={13}/><span className="hidden sm:inline">Track Vehicle</span>
          </Link>
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden"
            style={{background:'#B8860B'}}>
            {user?.photoURL
              ? <img src={user.photoURL} alt="" className="w-full h-full object-cover"/>
              : <>{user?.name?.charAt(0)}{user?.name?.split(' ')[1]?.charAt(0)||''}</>}
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        <Sidebar 
          active={section} 
          onChange={navTo} 
          unread={unread} 
          pendingInspection={!signed && !!pendingInspection} 
          unpaidInvoices={invoices.filter(i=>i.status==='unpaid').length||null} 
          logout={logout}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <main className="w-full lg:ml-[220px] flex-1 p-4 lg:p-7">

          {/* ── OVERVIEW ── */}
          {section==='overview'&&(
            <div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-7">
                <div><h1 className="font-display text-xl lg:text-2xl font-bold text-[#1A1A2E]">Welcome back, {user?.displayName||user?.name||'there'} 👋</h1><p className="text-gray-400 text-sm mt-0.5">Here's your vehicle service overview</p></div>
                <Link to="/booking" className="flex items-center gap-2 px-5 py-2.5 bg-[#B8860B] text-white text-sm font-semibold rounded-full hover:bg-[#8B6508] transition-all hover:shadow-lg hover:shadow-[#B8860B]/30 self-start">
                  <Plus size={15}/>New Booking
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 mb-6">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  {[
                    {id:'repairs',icon:Settings,bg:'bg-orange-50',color:'text-orange-500',title:'Current Repair',desc:current?`${current.make} ${current.model} — ${current.service_name}`:'No active repairs',badge:current?`${current.progress||0}%`:null,alert:false},
                    {
                      id: 'inspection',
                      icon: ClipboardCheck,
                      bg: activeInspection && !signed ? 'bg-amber-50' : 'bg-green-50',
                      color: activeInspection && !signed ? 'text-amber-600' : 'text-green-500',
                      title: 'Inspection Sign-Off',
                      desc: activeInspection ? (signed ? '✓ Signed & confirmed' : '⚠ Awaiting your signature') : 'No active inspections',
                      alert: activeInspection && !signed
                    },
                    {id:'history',icon:History,bg:'bg-green-50',color:'text-green-500',title:'Service History',desc:`${total} service${total!==1?'s':''}${total>0?` — last on ${appointments[0]?.preferred_date}`:''}`},
                    {
                      id:'invoices',
                      icon:FileText,
                      bg: invoices.some(i=>i.status==='unpaid') ? 'bg-red-50' : 'bg-purple-50',
                      color: invoices.some(i=>i.status==='unpaid') ? 'text-red-500' : 'text-purple-500',
                      title:'Invoices',
                      desc: invoices.length === 0 ? 'No invoices yet' : invoices.some(i=>i.status==='unpaid') ? `⚠ ${invoices.filter(i=>i.status==='unpaid').length} unpaid invoice${invoices.filter(i=>i.status==='unpaid').length!==1?'s':''} — action required` : `${invoices.length} invoice${invoices.length!==1?'s':''} — all paid`,
                      alert: invoices.some(i=>i.status==='unpaid')
                    },
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
              <div className="mb-6"><h1 className="font-display text-xl lg:text-2xl font-bold text-[#1A1A2E]">My Repairs</h1><p className="text-gray-400 text-sm">Current and recent repair jobs</p></div>
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
                  <div className="flex flex-col sm:flex-row gap-5 md:gap-6 p-5 md:p-6">
                    <div className="w-full sm:w-56 h-36 sm:h-40 bg-gradient-to-br from-[#1A1A2E] to-[#0F3460] rounded-2xl flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(184,134,11,0.2),transparent_70%)]"/>
                      <span className="text-6xl relative z-10">🚗</span>
                    </div>
                    <div className="flex-1">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 mb-4">
                        {[['TRACKING #',current.tracking_number],['SERVICE',current.service_name],['TECHNICIAN',current.technician_name||'Assigned'],['STARTED',current.preferred_date],['EST. COMPLETE','TBD'],['EST. COST',current.estimated_cost?`MK ${Number(current.estimated_cost).toLocaleString()}`:'TBD']].map(([k,v],i)=>(
                          <div key={i}><p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{k}</p>
                          <p className={`text-sm font-bold ${k==='EST. COST'?'text-[#B8860B]':'text-[#1A1A2E]'}`}>{v}</p></div>
                        ))}
                      </div>
                      <div className="mb-4">
                        <div className="flex justify-between text-xs font-semibold mb-1.5">
                          <span className="text-gray-600">Repair Progress</span>
                          <span className="text-[#B8860B] font-bold">{current.progress||0}%</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#B8860B] to-yellow-400 rounded-full" style={{width:`${current.progress||0}%`}}/></div>
                      </div>
                      {(() => {
                        const isInspectionDone = !!current.inspection_advisor_sig
                        const jStatus = current.job_status || 'pending'
                        
                        const steps = [
                          {
                            label: 'Appointment',
                            done: true,
                            active: false
                          },
                          {
                            label: 'Received',
                            done: ['confirmed', 'in_progress', 'completed'].includes(current.status),
                            active: current.status === 'confirmed' && !isInspectionDone
                          },
                          {
                            label: 'Inspection',
                            done: isInspectionDone,
                            active: isInspectionDone && current.inspection_status === 'pending'
                          },
                          {
                            label: 'Diagnosis',
                            done: ['diagnosis', 'parts_ordered', 'in_progress', 'quality_check', 'ready', 'completed'].includes(jStatus),
                            active: jStatus === 'diagnosis'
                          },
                          {
                            label: 'Repair',
                            done: ['in_progress', 'quality_check', 'ready', 'completed'].includes(jStatus),
                            active: ['parts_ordered', 'in_progress'].includes(jStatus)
                          },
                          {
                            label: 'Quality Check',
                            done: ['quality_check', 'ready', 'completed'].includes(jStatus),
                            active: jStatus === 'quality_check'
                          },
                          {
                            label: 'Ready',
                            done: ['ready', 'completed'].includes(jStatus),
                            active: jStatus === 'ready'
                          }
                        ]

                        return (
                          <div className="flex gap-2 flex-wrap mb-4">
                            {steps.map((s, i) => (
                              <StepPill key={i} done={s.done && !s.active} active={s.active} label={s.label} />
                            ))}
                          </div>
                        )
                      })()}
                      {/* Invoice Ready Banner */}
                      {(() => {
                        const inv = invoices.find(i => i.appointment_id === current?.id)
                        return inv ? (
                          <div className="mb-4 bg-gradient-to-r from-[#B8860B]/10 to-yellow-50 border-2 border-[#B8860B]/30 rounded-2xl p-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[#B8860B] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#B8860B]/30">
                                <FileText size={18} className="text-white"/>
                              </div>
                              <div>
                                <p className="font-bold text-[#1A1A2E] text-sm">📄 Invoice Ready — #{inv.invoice_number}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Total: <span className="font-bold text-[#B8860B]">MK {Number(inv.total||0).toLocaleString()}</span>
                                  &nbsp;·&nbsp;
                                  <span className={`font-semibold ${inv.status==='paid'?'text-green-600':'text-orange-500'}`}>
                                    {inv.status==='paid' ? '✓ Paid' : inv.status==='partial' ? 'Partially Paid' : 'Payment Due'}
                                  </span>
                                </p>
                              </div>
                            </div>
                            <button onClick={() => setInvoice(inv)}
                              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-[#B8860B] text-white text-xs font-bold rounded-full hover:bg-[#8B6508] transition-colors shadow-md shadow-[#B8860B]/20">
                              <FileText size={11}/>View Invoice
                            </button>
                          </div>
                        ) : current?.status === 'completed' ? (
                          <div className="mb-4 bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText size={14} className="text-gray-400"/>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-600">Invoice is being generated...</p>
                              <p className="text-xs text-gray-400 mt-0.5">Your invoice will appear here shortly. Check the Invoices section.</p>
                            </div>
                          </div>
                        ) : null
                      })()}
                      <div className="flex gap-3">
                        <Link to={`/track/${current.tracking_number}`} className="flex items-center gap-2 px-5 py-2.5 bg-[#B8860B] text-white text-sm font-semibold rounded-full hover:bg-[#8B6508] transition-all">
                          <Satellite size={14}/>Full Tracking
                        </Link>
                        <a href="https://wa.me/265994040900" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white text-sm font-semibold rounded-full hover:bg-green-600 transition-all">
                          <WhatsAppIcon size={16}/>WhatsApp Update
                        </a>
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
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="font-display text-xl lg:text-2xl font-bold text-[#1A1A2E]">Inspection Sign-Off</h1>
                  <p className="text-gray-400 text-sm">Review the full inspection report — your signature authorises AutoMedic to begin repair work</p>
                </div>
                <button onClick={() => loadData(true)} disabled={refreshing}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-xs font-semibold text-gray-500 hover:border-[#B8860B] hover:text-[#B8860B] transition-colors disabled:opacity-60">
                  {refreshing ? (
                    <><span className="w-3 h-3 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin"/> Refreshing...</>
                  ) : (
                    '↻ Refresh'
                  )}
                </button>
              </div>
              {/* No inspection yet — tech hasn't submitted a report */}
              {!activeInspection && (
                <div className="bg-white rounded-2xl p-14 text-center shadow-sm border border-gray-50">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><ClipboardCheck size={28} className="text-gray-400"/></div>
                  <h3 className="font-bold text-[#1A1A2E] mb-2">No Inspection Report Yet</h3>
                  <p className="text-gray-400 text-sm max-w-sm mx-auto">Once your vehicle is checked in and inspected by our technician, the full report will appear here. You'll also receive a notification to review and sign it.</p>
                </div>
              )}

              {/* Pending — customer needs to review and sign */}
              {activeInspection && !signed && (
                <div className="space-y-5">
                  <div className="flex items-start gap-4 bg-amber-50 border-2 border-amber-300 rounded-2xl px-5 py-5">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0"><AlertTriangle size={20} className="text-amber-600"/></div>
                    <div className="flex-1">
                      <p className="font-bold text-amber-800 text-sm">Action Required — Your Signature Is Needed</p>
                      <p className="text-xs text-amber-700 mt-1 leading-relaxed">AutoMedic has completed the vehicle inspection. Please review the full report carefully, then sign digitally to authorise repair work. <strong>Work will not begin until you sign.</strong></p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <InspectionReportDetails inspection={activeInspection} job={activeInspection} />
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-50 p-6 space-y-5">
                    {/* Declaration */}
                    <div className="bg-[#B8860B]/5 border border-[#B8860B]/15 rounded-xl p-5">
                      <p className="text-sm text-gray-700 font-semibold mb-3">By signing below, <strong className="text-[#1A1A2E]">{user?.displayName||user?.name}</strong>, you confirm:</p>
                      <ul className="space-y-2">
                        {['The vehicle inspection report above is accurate','The damages recorded existed before handover to AutoMedic','The fuel level shown is correct','You authorise AutoMedic to proceed with the requested service','Work on your vehicle will begin after this signature'].map((t,i)=>(
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-600"><span className="text-[#B8860B] font-bold mt-0.5 flex-shrink-0">✓</span>{t}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Signature pad */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center"><PenLine size={13} className="text-purple-400"/></div>
                        <p className="font-bold text-[#1A1A2E] text-sm">Your Digital Signature</p>
                        <span className="text-xs text-gray-400">— finger on mobile or mouse on desktop</span>
                      </div>
                      <div className="border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 hover:border-[#B8860B] transition-colors overflow-hidden relative">
                        <canvas ref={sigRef} width={580} height={150} className="w-full cursor-crosshair touch-none block" style={{height:150}}/>
                        <p className="absolute bottom-2 left-3 text-[10px] text-gray-300 pointer-events-none select-none">Sign here ✍</p>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button onClick={()=>{const c=sigRef.current;if(c)c.getContext('2d').clearRect(0,0,c.width,c.height)}} className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-full text-xs font-semibold text-gray-500 hover:bg-gray-50"><X size={12}/>Clear</button>
                        <button onClick={confirmSign} className="flex items-center gap-2 px-6 py-2.5 bg-[#B8860B] text-white rounded-full text-sm font-semibold hover:bg-[#8B6508] transition-colors shadow-lg shadow-[#B8860B]/20"><CheckCircle size={14}/>Confirm &amp; Authorise Repairs</button>
                        <a href="https://wa.me/265994040900" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-4 py-2.5 bg-green-500 text-white rounded-full text-xs font-semibold hover:bg-green-600 transition-colors"><MessageCircle size={12}/>Ask a Question</a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Signed — show confirmation + next steps */}
              {activeInspection && signed && (
                <div className="space-y-5">
                  <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0"><CheckCircle size={24} className="text-green-600"/></div>
                    <div>
                      <p className="font-bold text-green-700 text-base">Inspection Confirmed &amp; Signed ✓</p>
                      <p className="text-sm text-green-600 mt-0.5">Signed by <strong>{user?.displayName||user?.name}</strong> on {signedAt}</p>
                      <p className="text-xs text-green-600/80 mt-2">✅ AutoMedic technicians have been notified — repair work is now authorised to begin.</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <InspectionReportDetails inspection={activeInspection} job={activeInspection} />
                  </div>

                  <div className="bg-[#1A1A2E] rounded-2xl p-5">
                    <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-4">What Happens Next</p>
                    <div className="space-y-3">
                      {[
                        ['🔧','Repairs Begin','Your assigned technician has been notified and will start work immediately'],
                        ['📊','Track Progress','Monitor your vehicle\'s repair progress in real-time from "My Repairs"'],
                        ['📱','WhatsApp Updates','You\'ll receive updates at each stage of the repair process'],
                        ['🚗','Collection','You\'ll be notified when your vehicle is ready for collection'],
                      ].map(([icon,title,desc],i)=>(
                        <div key={i} className="flex items-start gap-3">
                          <span className="text-lg flex-shrink-0">{icon}</span>
                          <div><p className="text-white text-xs font-semibold">{title}</p><p className="text-white/50 text-[11px]">{desc}</p></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── SERVICE HISTORY ── */}
          {section==='history'&&(
            <div>
              <div className="mb-6">
                <h1 className="font-display text-xl sm:text-2xl font-bold text-[#1A1A2E]">Service History</h1>
                <p className="text-gray-400 text-sm">All your past and current repairs</p>
              </div>
              {appointments.length===0?(
                <div className="bg-white rounded-2xl p-8 sm:p-12 text-center shadow-sm">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <History size={24} className="text-gray-400 sm:w-7 sm:h-7"/>
                  </div>
                  <h3 className="font-bold text-[#1A1A2E] mb-2">No service history yet</h3>
                  <p className="text-gray-400 text-sm">Your service history will appear here after your first appointment.</p>
                </div>
              ):(
                <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
                  {/* Mobile card view */}
                  <div className="block lg:hidden">
                    {appointments.map((a,i)=>{
                      const matchedInvoice = invoices.find(inv => inv.appointment_id === a.id)
                      return (
                        <div key={i} className="border-b border-gray-50 p-4 hover:bg-gray-50/50 transition-colors">
                          {/* Row 1: Tracking + Vehicle + Status */}
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-[#B8860B] text-sm">{a.tracking_number}</span>
                            <span className="font-medium text-[#1A1A2E] mx-3 flex-1 min-w-0 truncate text-sm">
                              {a.make} {a.model} <span className="text-gray-400">{a.registration_number}</span>
                            </span>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize flex-shrink-0 ${a.status==='completed'?'bg-green-50 text-green-600 border border-green-100':'bg-orange-50 text-orange-500 border border-orange-100'}`}>
                              {a.status?.replace('_',' ')}
                            </span>
                          </div>
                          
                          {/* Row 2: Service + Date + Cost */}
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-sm text-gray-600">{a.service_name||'—'}</span>
                            <span className="text-xs text-gray-400 mx-3">{a.preferred_date}</span>
                            <span className="font-semibold text-sm text-[#B8860B] flex-shrink-0">
                              {a.estimated_cost?`MK ${Number(a.estimated_cost).toLocaleString()}`:'TBD'}
                            </span>
                          </div>
                          
                          {/* Row 3: Invoice Action */}
                          {matchedInvoice ? (
                            <div className="flex">
                              <button onClick={()=>setInvoice(matchedInvoice)} 
                                className="flex-1 flex items-center justify-center gap-2 text-[10px] font-semibold text-[#B8860B] border border-[#B8860B]/30 py-2 rounded-lg hover:bg-[#B8860B]/5 transition-colors">
                                <Printer size={12}/>View Invoice
                              </button>
                            </div>
                          ) : a.status === 'completed' ? (
                            <div className="flex justify-center">
                              <span className="text-[10px] text-gray-400 italic">Generating invoice...</span>
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>

                  {/* Desktop table view */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-sm min-w-[600px]">
                      <thead>
                        <tr className="bg-gray-50/80">
                          {['#','Vehicle','Service','Date','Cost','Status','Invoice'].map(h=>
                            <th key={h} className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.map((a,i)=>{
                          const matchedInvoice = invoices.find(inv => inv.appointment_id === a.id)
                          return (
                            <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                              <td className="px-4 py-3.5 font-bold text-[#B8860B] text-xs">{a.tracking_number}</td>
                              <td className="px-4 py-3.5 font-medium text-[#1A1A2E] text-xs">{a.make} {a.model} <span className="text-gray-400">{a.registration_number}</span></td>
                              <td className="px-4 py-3.5 text-gray-500 text-xs">{a.service_name||'—'}</td>
                              <td className="px-4 py-3.5 text-gray-400 text-xs">{a.preferred_date}</td>
                              <td className="px-4 py-3.5 font-semibold text-xs">{a.estimated_cost?`MK ${Number(a.estimated_cost).toLocaleString()}`:'TBD'}</td>
                              <td className="px-4 py-3.5">
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${a.status==='completed'?'bg-green-50 text-green-600 border border-green-100':'bg-orange-50 text-orange-500 border border-orange-100'}`}>
                                  {a.status?.replace('_',' ')}
                                </span>
                              </td>
                              <td className="px-4 py-3.5">
                                {matchedInvoice ? (
                                  <button onClick={()=>setInvoice(matchedInvoice)} className="text-[10px] font-semibold text-[#B8860B] border border-[#B8860B]/30 px-2.5 py-1.5 rounded-lg hover:bg-[#B8860B]/5 transition-colors flex items-center gap-1">
                                    <Printer size={10}/>View Invoice
                                  </button>
                                ) : a.status === 'completed' ? (
                                  <span className="text-[10px] text-gray-400 italic">Generating...</span>
                                ) : null}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── INVOICES ── */}
          {section==='invoices'&&(
            <div>
              <div className="flex items-center justify-between mb-6">
                <div><h1 className="font-display text-xl lg:text-2xl font-bold text-[#1A1A2E]">Invoices</h1><p className="text-gray-400 text-sm mt-0.5">Your service billing history</p></div>
                <button onClick={()=>loadData(true)} disabled={refreshing} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-xs font-semibold text-gray-500 hover:border-[#B8860B] hover:text-[#B8860B] transition-colors disabled:opacity-60">
                  {refreshing?<><span className="w-3 h-3 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin"/>Refreshing...</>:'↻ Refresh'}
                </button>
              </div>

              {invoices.length===0?(
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0"><FileText size={18} className="text-blue-500"/></div>
                    <div><p className="font-bold text-blue-700 text-sm">No invoices yet</p><p className="text-xs text-blue-600 mt-1 leading-relaxed">Invoices are automatically generated when your vehicle service is completed. Click Refresh to check for new invoices.</p></div>
                  </div>
                  <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-50"><div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><FileText size={28} className="text-gray-400"/></div><h3 className="font-bold text-[#1A1A2E] mb-2">No invoices yet</h3><p className="text-gray-400 text-sm">Invoices appear here once your service is completed and billed.</p></div>
                </div>
              ):(
                <div className="space-y-4">
                  {/* Unpaid banner */}
                  {invoices.some(i=>i.status==='unpaid') && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 flex items-start gap-4">
                      <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">⚠️</div>
                      <div className="flex-1">
                        <p className="font-bold text-red-700 text-sm">Payment Required</p>
                        <p className="text-xs text-red-600 mt-1 leading-relaxed">
                          You have <strong>{invoices.filter(i=>i.status==='unpaid').length} unpaid invoice{invoices.filter(i=>i.status==='unpaid').length!==1?'s':''}</strong> totalling <strong>MK {invoices.filter(i=>i.status==='unpaid').reduce((s,i)=>s+Number(i.total||0),0).toLocaleString()}</strong>.
                          Please settle payment at the AutoMedic reception desk when collecting your vehicle.
                        </p>
                        <div className="flex gap-3 mt-3">
                          <a href="https://wa.me/265994040900" target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white bg-green-500 hover:bg-green-600 transition-colors px-3 py-1.5 rounded-full">
                            💬 WhatsApp Us
                          </a>
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-red-600 bg-red-100 px-3 py-1.5 rounded-full">
                            {safeSettings.address} · {safeSettings.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* All paid banner */}
                  {invoices.length > 0 && invoices.every(i=>i.status==='paid') && (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
                      <CheckCircle size={20} className="text-green-500 flex-shrink-0"/>
                      <p className="text-sm font-semibold text-green-700">All invoices paid — thank you! 🎉</p>
                    </div>
                  )}

                  {/* Invoice cards */}
                  <div className="space-y-3">
                  {invoices.map((inv,i)=>{
                    const isPaid = inv.status === 'paid'
                    const isPartial = inv.status === 'partial'
                    const total = Number(inv.total||0)
                    return (
                      <div key={inv.id||i}
                        className={`bg-white rounded-2xl shadow-sm border-[1.5px] overflow-hidden transition-all
                          ${isPaid ? 'border-green-100' : isPartial ? 'border-amber-200' : 'border-red-200'}`}>
                        {/* Status stripe */}
                        <div className={`h-1.5 w-full ${isPaid ? 'bg-green-400' : isPartial ? 'bg-amber-400' : 'bg-red-400'}`}/>
                        <div className="p-5">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-[#1A1A2E] text-sm">#{inv.invoice_number||inv.tracking_number}</span>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize
                                  ${isPaid ? 'bg-green-50 text-green-600 border border-green-200' : isPartial ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                                  {isPaid ? '✓ Paid' : isPartial ? '⏳ Partial' : '⚠ Unpaid'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 mt-1">{new Date(inv.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-[#B8860B] text-xl">MK {total.toLocaleString()}</p>
                              <p className="text-[10px] text-gray-400">incl. 16.5% VAT</p>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-xl p-3 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-xs">
                            <div><p className="text-gray-400 mb-0.5">Vehicle</p><p className="font-semibold text-[#1A1A2E]">{inv.make} {inv.model}</p></div>
                            <div><p className="text-gray-400 mb-0.5">Registration</p><p className="font-semibold text-[#1A1A2E]">{inv.registration_number||'—'}</p></div>
                            <div><p className="text-gray-400 mb-0.5">Service</p><p className="font-semibold text-[#1A1A2E] truncate">{inv.service_name||'—'}</p></div>
                          </div>

                          {/* Payment status message */}
                          {!isPaid && (
                            <div className={`rounded-xl p-3 mb-4 flex items-start gap-2.5 text-xs
                              ${isPartial ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
                              <span className="text-base">{isPartial ? '⏳' : '💳'}</span>
                              <div>
                                <p className={`font-bold ${isPartial ? 'text-amber-700' : 'text-red-700'}`}>
                                  {isPartial ? 'Partial payment received' : 'Payment pending'}
                                </p>
                                <p className={`mt-0.5 ${isPartial ? 'text-amber-600' : 'text-red-600'}`}>
                                  {isPartial
                                    ? 'A partial payment has been recorded. Please settle the remaining balance at reception.'
                                    : 'Please pay MK ' + total.toLocaleString() + ' at the AutoMedic reception when collecting your vehicle.'}
                                </p>
                              </div>
                            </div>
                          )}

                          {isPaid && (
                            <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-4 flex items-center gap-2.5">
                              <CheckCircle size={16} className="text-green-500 flex-shrink-0"/>
                              <p className="text-xs text-green-700 font-semibold">Payment confirmed by AutoMedic — thank you!</p>
                            </div>
                          )}

                          <button onClick={()=>setInvoice(inv)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#1A1A2E] text-white text-sm font-semibold rounded-xl hover:bg-black transition-colors">
                            <Printer size={14}/> View &amp; Print Invoice
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {section==='notifications'&&(
            <div>
              <div className="mb-6"><h1 className="font-display text-xl lg:text-2xl font-bold text-[#1A1A2E]">Notifications</h1></div>
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
