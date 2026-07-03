import { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { LayoutDashboard, Calendar, Car, Users, BarChart2, TrendingUp, Settings, LogOut, Plus, Trash2, Edit2, Globe, ClipboardCheck, X, Search, DollarSign, Package, Save, AlertCircle, FileText, ChevronDown, ChevronRight as ChevronR, Wrench, ShoppingCart, History, Eye, Printer, CheckCircle } from 'lucide-react'
import InspectionModule from '../technician/InspectionModule'
import UserManagement from './UserManagement'
import RevenuePage from './RevenuePage'
import ProductsManagement from './ProductsManagement'
import InvoicesManagement from './InvoicesManagement'
import ServicesManagement from './ServicesManagement'

const COLORS = ['#B8860B','#25D366','#1565C0','#E65100']

// ── GROUPED NAV STRUCTURE ────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: null, // no section header — top-level items
    items: [
      { path: '',              icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { path: 'appointments',  icon: Calendar,        label: 'Appointments' },
      { path: 'inspection',    icon: ClipboardCheck,  label: 'Inspections' },
      { path: 'vehicles',      icon: Car,             label: 'Vehicles' },
      { path: 'customers',     icon: Users,           label: 'Customers' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { path: 'invoices',      icon: FileText,        label: 'Invoices' },
      { path: 'revenue',       icon: DollarSign,      label: 'Revenue' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { path: 'reports',       icon: BarChart2,       label: 'Reports' },
      { path: 'analytics',     icon: TrendingUp,      label: 'Analytics' },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { path: 'products',      icon: Package,         label: 'Products & Parts' },
      { path: 'services-mgmt', icon: Wrench,          label: 'Services' },
      { path: 'checkouts',     icon: ShoppingCart,    label: 'Checkout Logs' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { path: 'users',         icon: Users,           label: 'User Management' },
      { path: 'settings',      icon: Settings,        label: 'Settings' },
    ],
  },
]

// ── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ logout }) {
  const location = useLocation()

  // Default: only Operations (index 1) is open — everything else collapsed
  // Persist in sessionStorage so state survives in-app navigation
  const DEFAULT_COLLAPSED = { 0: false, 1: false, 2: true, 3: true, 4: true, 5: true }

  const [collapsed, setCollapsed] = useState(() => {
    try {
      const stored = sessionStorage.getItem('am_sidebar')
      return stored ? JSON.parse(stored) : DEFAULT_COLLAPSED
    } catch {
      return DEFAULT_COLLAPSED
    }
  })

  const isActive = (p) => {
    const full = '/admin' + (p ? '/' + p : '')
    return location.pathname === full || (p === '' && location.pathname === '/admin')
  }

  const toggleGroup = (idx) => {
    setCollapsed(prev => {
      const next = { ...prev, [idx]: !prev[idx] }
      try { sessionStorage.setItem('am_sidebar', JSON.stringify(next)) } catch {}
      return next
    })
  }

  // When navigating to a page, auto-expand its group if collapsed
  useEffect(() => {
    const currentPath = location.pathname.replace('/admin/', '').replace('/admin', '')
    NAV_GROUPS.forEach((g, idx) => {
      if (g.label && g.items.some(item => item.path === currentPath)) {
        setCollapsed(prev => {
          if (!prev[idx]) return prev  // already open, no change
          const next = { ...prev, [idx]: false }
          try { sessionStorage.setItem('am_sidebar', JSON.stringify(next)) } catch {}
          return next
        })
      }
    })
  }, [location.pathname])

  return (
    <aside className="w-[220px] min-h-[calc(100vh-64px)] bg-dark fixed top-16 left-0 bottom-0 flex flex-col py-4 overflow-y-auto">
      <nav className="flex flex-col gap-0.5 px-3 flex-1">
        {NAV_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className={gIdx > 0 ? 'mt-1' : ''}>
            {/* Section header — collapsible if has label */}
            {group.label ? (
              <button
                onClick={() => toggleGroup(gIdx)}
                className="w-full flex items-center justify-between px-3 py-1.5 mb-0.5 group">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30 group-hover:text-white/50 transition-colors">
                  {group.label}
                </span>
                {collapsed[gIdx]
                  ? <ChevronR size={11} className="text-white/25 group-hover:text-white/50 transition-colors" />
                  : <ChevronDown size={11} className="text-white/25 group-hover:text-white/50 transition-colors" />
                }
              </button>
            ) : null}

            {/* Items — hidden when collapsed */}
            {!collapsed[gIdx] && group.items.map(({ path, icon: Icon, label }) => (
              <Link key={path} to={`/admin${path ? '/' + path : ''}`}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all
                  ${isActive(path)
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-white/60 hover:bg-white/8 hover:text-white'
                  }`}>
                <Icon size={15} />
                <span className="truncate">{label}</span>
                {isActive(path) && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60 flex-shrink-0" />}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pt-3 mt-2 border-t border-white/10 flex-shrink-0">
        <Link to="/" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/8 transition-all">
          <Globe size={15} /> View Website
        </Link>
        <button onClick={logout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors w-full mt-0.5">
          <LogOut size={15} /> Logout
        </button>
      </div>
    </aside>
  )
}

function StatCard({ icon:Icon, val, label, trend, bg, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${bg} ${color} rounded-xl flex items-center justify-center flex-shrink-0`}><Icon size={20} /></div>
        <div className="flex-1">
          <div className="text-2xl font-black text-dark leading-none">{val}</div>
          <div className="text-xs text-gray-500 mt-1">{label}</div>
          {trend && <div className="text-xs text-green-500 font-semibold mt-0.5">{trend}</div>}
        </div>
      </div>
    </div>
  )
}

// ---- DASHBOARD VIEW ----
function DashboardView() {
  const [stats, setStats]           = useState(null)
  const [appointments, setAppts]    = useState([])
  const [activeJobs, setActiveJobs] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/reports/dashboard').then(r => setStats(r.data.data)).catch(() => {})
    api.get('/appointments').then(r => setAppts(r.data.data?.slice(0,5) || [])).catch(() => {})
    api.get('/job-cards').then(r => setActiveJobs((r.data.data || []).filter(j => j.status !== 'completed').slice(0,5))).catch(() => {})
  }, [])

  const fmtRevenue = (val) => {
    const n = Number(val || 0)
    if (n === 0) return 'MK 0'
    if (n >= 1_000_000) return `MK ${(n / 1_000_000).toFixed(2)}M`
    if (n >= 1_000)     return `MK ${(n / 1_000).toFixed(1)}K`
    return `MK ${n.toLocaleString()}`
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-7">
        <div>
          <h1 className="font-display text-2xl text-dark">Dashboard</h1>
          <p className="text-gray-500 text-sm">Welcome back! {new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p>
        </div>
      </div>

      {/* Stat cards — all clickable */}
      <div className="grid grid-cols-4 gap-4 mb-7">
        <button onClick={() => navigate('/admin/customers')}
          className="bg-white rounded-2xl p-5 shadow-sm text-left hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0"><Users size={20}/></div>
            <div>
              <div className="text-2xl font-black text-dark leading-none">{stats?.total_customers ?? '—'}</div>
              <div className="text-xs text-gray-500 mt-1">Total Customers</div>
            </div>
          </div>
        </button>

        <button onClick={() => navigate('/admin/appointments')}
          className="bg-white rounded-2xl p-5 shadow-sm text-left hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center flex-shrink-0"><Calendar size={20}/></div>
            <div>
              <div className="text-2xl font-black text-dark leading-none">{stats?.todays_appointments ?? '—'}</div>
              <div className="text-xs text-gray-500 mt-1">Today's Appointments</div>
            </div>
          </div>
        </button>

        <button onClick={() => navigate('/admin/appointments')}
          className="bg-white rounded-2xl p-5 shadow-sm text-left hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center flex-shrink-0"><Car size={20}/></div>
            <div>
              <div className="text-2xl font-black text-dark leading-none">{stats?.active_repairs ?? '—'}</div>
              <div className="text-xs text-gray-500 mt-1">Active Repairs</div>
            </div>
          </div>
        </button>

        <button onClick={() => navigate('/admin/revenue')}
          className="bg-white rounded-2xl p-5 shadow-sm text-left hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center flex-shrink-0"><TrendingUp size={20}/></div>
            <div>
              <div className="text-2xl font-black text-dark leading-none">{stats ? fmtRevenue(stats.monthly_revenue) : '—'}</div>
              <div className="text-xs text-gray-500 mt-1">Revenue This Month</div>
              {stats && <div className="text-[10px] text-gray-400 mt-0.5">from job cards</div>}
            </div>
          </div>
        </button>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4"><h2 className="font-bold text-dark text-sm">Recent Appointments</h2><span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">Latest</span></div>
          {appointments.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No appointments yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr>{['Customer','Vehicle','Service','Status'].map(h=><th key={h} className="pb-2 text-left text-xs text-gray-400 font-semibold">{h}</th>)}</tr></thead>
              <tbody>
                {appointments.map((a,i) => (
                  <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 font-medium text-dark">{a.customer_name}</td>
                    <td className="py-2.5 text-gray-500 text-xs">{a.make} {a.model}</td>
                    <td className="py-2.5 text-gray-500 text-xs">{a.service_name}</td>
                    <td className="py-2.5"><span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${a.status==='in_progress'?'bg-orange-50 text-orange-600':a.status==='completed'?'bg-green-50 text-green-600':'bg-blue-50 text-blue-600'}`}>{a.status?.replace('_',' ')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-dark text-sm mb-4">Active Repairs</h2>
          {activeJobs.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No active repairs</p>
          ) : (
            <div className="space-y-3">
              {activeJobs.map((j,i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-dark truncate">{j.make} {j.model} {j.registration_number}</p>
                    <p className="text-xs text-gray-400">{j.technician_name || 'Unassigned'}</p>
                  </div>
                  <div className="flex items-center gap-2 w-32 flex-shrink-0">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-primary to-yellow-500 rounded-full" style={{width:`${j.progress||0}%`}}/></div>
                    <span className="text-xs font-bold w-8 text-right">{j.progress||0}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---- APPOINTMENTS VIEW ----
function AppointmentsView() {
  const [techList, setTechList] = useState([])
  const [data, setData]         = useState([])
  const [loading, setLoading]   = useState(true)

  const [assignModal, setAssignModal] = useState(null)
  const [selectedTech, setSelectedTech] = useState('')
  const [filter, setFilter] = useState('all')
  const [search, setSearch]   = useState('')
  const [toast, setToast]     = useState('')
  const [saving, setSaving]   = useState(false)
  const [genInvLoading, setGenInvLoading] = useState(null)
  const [invoicedIds, setInvoicedIds] = useState(new Set())
  const [addModal, setAddModal] = useState(false)
  const [addForm, setAddForm] = useState({ customer_id:'', vehicle_id:'', service_id:'', preferred_date:'', problem_description:'' })
  const [customerList, setCustomerList] = useState([])
  const [serviceList, setServiceList]   = useState([])
  const [vehicleMap, setVehicleMap]     = useState({})
  const [addSaving, setAddSaving]       = useState(false)

  useEffect(() => {
    api.get('/appointments').then(r => setData(r.data.data || [])).catch(() => setData([])).finally(() => setLoading(false))
    api.get('/technicians').then(r => setTechList(r.data.data || [])).catch(() => setTechList([]))
    api.get('/invoices').then(r => {
      const ids = new Set((r.data.data || []).map(i => i.appointment_id))
      setInvoicedIds(ids)
    }).catch(() => {})
    api.get('/customers').then(r => setCustomerList(r.data.data || [])).catch(() => {})
    api.get('/services').then(r => setServiceList(r.data.data || [])).catch(() => {})
  }, [])

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const loadCustomerVehicles = async (customerId) => {
    if (!customerId) return setVehicleMap({})
    try {
      const r = await api.get('/vehicles')
      const all = r.data.data || []
      const customerVehicles = all.filter(v => v.customer_id === customerId)
      setVehicleMap(prev => ({ ...prev, [customerId]: customerVehicles }))
    } catch { setVehicleMap({}) }
  }

  const deleteAppointment = async (id, tracking) => {
    if (!window.confirm(`Cancel appointment ${tracking}? This cannot be undone.`)) return
    try {
      await api.patch(`/appointments/${id}/status`, { status: 'cancelled' })
      setData(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a))
      showToast(`✓ Appointment ${tracking} cancelled`)
    } catch (err) {
      showToast('✕ Failed to cancel: ' + (err.response?.data?.message || err.message))
    }
  }

  const createAppointment = async () => {
    if (!addForm.preferred_date) return showToast('Please select a preferred date')
    if (!addForm.customer_id) return showToast('Please select a customer')
    setAddSaving(true)
    try {
      const payload = {
        customer_id:         addForm.customer_id,
        vehicle_id:          addForm.vehicle_id || null,
        service_id:          addForm.service_id || null,
        preferred_date:      addForm.preferred_date,
        problem_description: addForm.problem_description || null,
      }
      const r = await api.post('/appointments/admin', payload)
      setData(prev => [r.data.data, ...prev])
      showToast('✓ Appointment created')
      setAddModal(false)
      setAddForm({ customer_id:'', vehicle_id:'', service_id:'', preferred_date:'', problem_description:'' })
    } catch (err) {
      showToast('✕ ' + (err.response?.data?.message || err.message))
    } finally { setAddSaving(false) }
  }

  const accept = (appt) => {
    setAssignModal(appt)
    setSelectedTech(techList[0]?.id || '')
  }

  const confirmAssign = async () => {
    if (!selectedTech) return
    setSaving(true)
    try {
      await api.patch(`/appointments/${assignModal.id}/assign`, { technician_id: selectedTech, status: 'confirmed' })
      const techName = techList.find(t => t.id === selectedTech)?.name || 'Technician'
      setData(prev => prev.map(a => a.id === assignModal.id ? { ...a, status: 'confirmed', technician_name: techName } : a))
      showToast(`✓ ${assignModal.tracking_number} accepted & assigned to ${techName}`)
      setAssignModal(null)
    } catch (err) {
      showToast('Failed to assign: ' + (err.response?.data?.message || err.message))
    } finally { setSaving(false) }
  }

  const reject = async (id) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status: 'cancelled' })
      setData(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a))
      showToast('Appointment rejected')
    } catch {}
  }

  const generateInvoice = async (appt) => {
    setGenInvLoading(appt.id)
    try {
      await api.post(`/invoices/generate/${appt.id}`)
      setInvoicedIds(prev => new Set([...prev, appt.id]))
      showToast(`✓ Invoice generated for ${appt.tracking_number}`)
    } catch (err) {
      showToast('Invoice failed: ' + (err.response?.data?.message || err.message))
    } finally { setGenInvLoading(null) }
  }

  const pending = data.filter(a => a.status === 'pending')
  const filtered = data.filter(a => {
    const matchFilter = filter === 'all' || a.status === filter
    const matchSearch = !search || a.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      a.tracking_number.toLowerCase().includes(search.toLowerCase()) ||
      `${a.make} ${a.model}`.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const statusColor = (s) => ({
    pending:     'bg-blue-50 text-blue-600 border border-blue-100',
    confirmed:   'bg-yellow-50 text-yellow-600 border border-yellow-100',
    in_progress: 'bg-orange-50 text-orange-500 border border-orange-100',
    completed:   'bg-green-50 text-green-600 border border-green-100',
    cancelled:   'bg-red-50 text-red-500 border border-red-100',
  }[s] || 'bg-gray-50 text-gray-500')

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1A1A2E] text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl animate-bounce">
          {toast}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-display text-2xl text-dark">Appointments</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage all bookings — accept, assign & track</p>
        </div>
        <button onClick={() => setAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-full hover:bg-primary-dark transition-colors">
          <Plus size={14} /> Add Appointment
        </button>
      </div>

      {/* Pending alert */}
      {pending.length > 0 && (
        <div className="flex items-center gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 text-amber-600 font-black text-lg">
            {pending.length}
          </div>
          <div className="flex-1">
            <p className="font-bold text-amber-700 text-sm">Pending Appointments Awaiting Action</p>
            <p className="text-xs text-amber-600/80 mt-0.5">{pending.length} appointment{pending.length > 1 ? 's' : ''} need to be accepted and assigned to a technician.</p>
          </div>
          <button onClick={() => setFilter('pending')}
            className="px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-full hover:bg-amber-600 transition-colors">
            Review Now
          </button>
        </div>
      )}

      {/* Filters + search */}
      <div className="flex gap-3 mb-5 flex-wrap items-center">
        <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
          {['all','pending','confirmed','in_progress','completed'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all
                ${filter === f ? 'bg-[#B8860B] text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}>
              {f === 'all' ? 'All' : f.replace('_',' ')}
              <span className="ml-1.5 opacity-70">
                {f === 'all' ? data.length : data.filter(a => a.status === f).length}
              </span>
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search customer, vehicle, tracking #..."
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] bg-white" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80">
              {['#','Customer','Vehicle','Service','Date','Technician','Status','Action'].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} className={`border-t border-gray-50 transition-colors hover:bg-gray-50/50 ${a.status === 'pending' ? 'bg-amber-50/30' : ''}`}>
                <td className="px-4 py-3.5 font-bold text-[#B8860B] text-xs">{a.tracking_number}</td>
                <td className="px-4 py-3.5 font-medium text-[#1A1A2E]">{a.customer_name}</td>
                <td className="px-4 py-3.5 text-gray-500 text-xs">{a.make} {a.model} <span className="text-gray-400">{a.registration_number}</span></td>
                <td className="px-4 py-3.5 text-gray-500 text-xs">{a.service_name}</td>
                <td className="px-4 py-3.5 text-gray-400 text-xs">{a.preferred_date}</td>
                <td className="px-4 py-3.5 text-xs">
                  {a.technician_name
                    ? <span className="flex items-center gap-1.5 font-medium text-gray-600">
                        <span className="w-5 h-5 bg-[#B8860B]/10 text-[#B8860B] rounded-full flex items-center justify-center font-black text-[9px]">
                          {a.technician_name.charAt(0)}
                        </span>
                        {a.technician_name}
                      </span>
                    : <span className="text-gray-300 italic">Unassigned</span>}
                </td>
                <td className="px-4 py-3.5">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${statusColor(a.status)}`}>
                    {a.status.replace('_',' ')}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  {a.status === 'pending' ? (
                    <div className="flex gap-1.5">
                      <button onClick={() => accept(a)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#B8860B] text-white text-[10px] font-bold rounded-lg hover:bg-[#8B6508] transition-colors">
                        ✓ Accept
                      </button>
                      <button onClick={() => reject(a.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-500 text-[10px] font-bold rounded-lg hover:bg-red-100 transition-colors border border-red-100">
                        ✕ Reject
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <button onClick={() => accept(a)}
                        className="text-[10px] font-semibold text-[#B8860B] border border-[#B8860B]/30 px-2.5 py-1.5 rounded-lg hover:bg-[#B8860B]/5 transition-colors">
                        Reassign
                      </button>
                      {a.status === 'completed' && (
                        invoicedIds.has(a.id) ? (
                          <span className="text-[10px] font-semibold text-green-600 border border-green-200 px-2.5 py-1.5 rounded-lg bg-green-50">✓ Invoiced</span>
                        ) : (
                          <button onClick={() => generateInvoice(a)}
                            disabled={genInvLoading === a.id}
                            className="text-[10px] font-semibold text-green-600 border border-green-200 px-2.5 py-1.5 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50">
                            {genInvLoading === a.id ? '...' : '🧾 Invoice'}
                          </button>
                        )
                      )}
                      <button onClick={() => deleteAppointment(a.id, a.tracking_number)}
                        className="w-7 h-7 border border-gray-200 rounded-lg flex items-center justify-center hover:border-red-400 hover:text-red-500 transition-colors">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">No appointments found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ASSIGN MODAL */}
      {assignModal && (        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setAssignModal(null)}>
          <div className="bg-white rounded-2xl p-7 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#B8860B]/10 rounded-xl flex items-center justify-center">
                  <span className="text-xl">🔧</span>
                </div>
                <div>
                  <h3 className="font-bold text-[#1A1A2E] text-base">Accept & Assign</h3>
                  <p className="text-xs text-gray-400">{assignModal.tracking_number}</p>
                </div>
              </div>
              <button onClick={() => setAssignModal(null)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                <X size={14} />
              </button>
            </div>

            {/* Appointment summary */}
            <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2">
              {[
                ['Customer',  assignModal.customer_name],
                ['Vehicle',   `${assignModal.make} ${assignModal.model} — ${assignModal.registration_number}`],
                ['Service',   assignModal.service_name],
                ['Date',      assignModal.preferred_date],
              ].map(([k,v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-gray-400">{k}</span>
                  <span className="font-semibold text-[#1A1A2E]">{v}</span>
                </div>
              ))}
            </div>

            {/* Technician selection */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">
                Assign Technician
              </label>
              <div className="space-y-2">
                {techList.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">No technicians found</p>
                ) : techList.map(tech => (
                  <button key={tech.id} onClick={() => setSelectedTech(tech.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-[1.5px] transition-all text-left
                      ${selectedTech === tech.id ? 'bg-[#B8860B]/8 border-[#B8860B] text-[#B8860B]' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0
                      ${selectedTech === tech.id ? 'bg-[#B8860B] text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {tech.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{tech.name}</p>
                      <p className="text-xs opacity-60">Technician · {tech.active_jobs || 0} active jobs</p>
                    </div>
                    {selectedTech === tech.id && <span className="text-[#B8860B] text-lg">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Confirm */}
            <p className="text-xs text-gray-400 mb-3 text-center">A job card and inspection record will be created for the technician.</p>
            <button onClick={confirmAssign} disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#B8860B] text-white font-bold rounded-full hover:bg-[#8B6508] transition-all hover:shadow-lg hover:shadow-[#B8860B]/30 text-sm disabled:opacity-60">
              {saving ? 'Assigning...' : `✓ Accept & Assign to ${techList.find(t=>t.id===selectedTech)?.name||'Technician'}`}
            </button>
          </div>
        </div>
      )}

      {/* ADD APPOINTMENT MODAL */}
      {addModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setAddModal(false)}>
          <div className="bg-white rounded-2xl p-7 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#B8860B]/10 rounded-xl flex items-center justify-center text-xl">📅</div>
                <div>
                  <h3 className="font-bold text-[#1A1A2E] text-base">New Appointment</h3>
                  <p className="text-xs text-gray-400">Book a walk-in or phone appointment</p>
                </div>
              </div>
              <button onClick={() => setAddModal(false)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
                <X size={14} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Customer</label>
                <select
                  value={addForm.customer_id}
                  onChange={e => { setAddForm(f => ({ ...f, customer_id: e.target.value, vehicle_id: '' })); loadCustomerVehicles(e.target.value) }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] bg-white">
                  <option value="">— Select customer —</option>
                  {customerList.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Vehicle</label>
                <select
                  value={addForm.vehicle_id}
                  onChange={e => setAddForm(f => ({ ...f, vehicle_id: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] bg-white"
                  disabled={!addForm.customer_id}>
                  <option value="">— Select vehicle —</option>
                  {(vehicleMap[addForm.customer_id] || []).map(v => (
                    <option key={v.id} value={v.id}>{v.make} {v.model} ({v.registration_number})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Service</label>
                <select
                  value={addForm.service_id}
                  onChange={e => setAddForm(f => ({ ...f, service_id: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] bg-white">
                  <option value="">— Select service —</option>
                  {serviceList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Preferred Date *</label>
                <input
                  type="date"
                  value={addForm.preferred_date}
                  onChange={e => setAddForm(f => ({ ...f, preferred_date: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Problem Description</label>
                <textarea
                  rows={3}
                  value={addForm.problem_description}
                  onChange={e => setAddForm(f => ({ ...f, problem_description: e.target.value }))}
                  placeholder="Brief description of the issue..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] resize-none" />
              </div>
              <button onClick={createAppointment} disabled={addSaving}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#B8860B] text-white font-bold rounded-full hover:bg-[#8B6508] transition-all text-sm disabled:opacity-60">
                {addSaving ? 'Creating...' : '+ Create Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---- REPORTS VIEW ----
function ReportsView() {
  const [techPerf,     setTechPerf]     = useState([])
  const [dashStats,    setDashStats]    = useState(null)
  const [serviceStats, setServiceStats] = useState([])
  const [monthlyData,  setMonthlyData]  = useState([])
  const [movement,     setMovement]     = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [movTab,       setMovTab]       = useState('fast')

  useEffect(() => {
    Promise.all([
      api.get('/reports/dashboard').catch(() => null),
      api.get('/technicians').catch(() => null),
      api.get('/reports/services').catch(() => null),
      api.get('/reports/revenue').catch(() => null),
      api.get('/reports/product-movement').catch(() => null),
    ]).then(([dash, techs, svcs, rev, mov]) => {
      if (dash)  setDashStats(dash.data.data)
      if (techs) setTechPerf((techs.data.data || []).map(t => ({
        name:   t.name,
        jobs:   (t.active_jobs || 0) + (t.completed_jobs || 0),
        active: t.active_jobs || 0,
        done:   t.completed_jobs || 0,
      })))
      if (svcs)  setServiceStats(svcs.data.data || [])
      if (rev)   setMonthlyData(rev.data.data || [])
      if (mov)   setMovement(mov.data.data)
    }).finally(() => setLoading(false))
  }, [])

  const revenue   = dashStats?.monthly_revenue || 0
  const customers = dashStats?.total_customers ?? '—'
  const activeRep = dashStats?.active_repairs  ?? '—'

  const topServices = serviceStats.slice(0, 5)
  const totalSvcJobs = topServices.reduce((a, s) => a + (s.count || 0), 0) || 1

  const fmtP = (n) => n != null && n !== '' ? `MK ${Number(n).toLocaleString()}` : '—'
  const movRows = movTab === 'fast' ? (movement?.fast_moving || []) : (movement?.slow_moving || [])

  const exportCSV = () => {
    if (!monthlyData.length) return
    const rows = monthlyData.map(r => `${r.month},${r.appointments}`).join('\n')
    const blob = new Blob([`Month,Appointments\n${rows}`], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = 'automedic-revenue.csv'; a.click()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display text-2xl text-dark">Reports</h1>
        <p className="text-sm text-gray-400 mt-0.5">Live business performance data</p>
      </div>

      {/* KPI cards — all live */}
      <div className="grid grid-cols-3 gap-4 mb-7">
        {[
          ['👥', customers,                                          'Total Customers',   'bg-blue-50 text-blue-600'],
          ['🔧', activeRep,                                         'Active Repairs',    'bg-orange-50 text-orange-600'],
          ['💰', revenue > 0 ? `MK ${(revenue/1000000).toFixed(2)}M` : 'MK 0', 'Est. Revenue (job cards)', 'bg-[#B8860B]/10 text-[#B8860B]'],
        ].map(([icon, val, label, cls], i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 flex items-center gap-4">
            <div className={`w-12 h-12 ${cls} rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>{icon}</div>
            <div>
              <div className="text-2xl font-black text-dark leading-none">{val}</div>
              <div className="text-xs text-gray-400 mt-1">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Top Services — live */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-dark text-sm">Top Services</h2>
            <span className="text-xs text-gray-400">By bookings</span>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50/80">
              {['Service','Bookings','%'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {topServices.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-sm">No booking data yet</td></tr>
              ) : topServices.map((s, i) => {
                const pct = Math.round((s.count || 0) / totalSvcJobs * 100)
                return (
                  <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-dark">{s.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{s.count || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#B8860B] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 w-7 text-right">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Technician Performance — live */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-dark text-sm">Technician Performance</h2>
            <span className="text-xs text-gray-400">All time</span>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50/80">
              {['Technician','Total Jobs','Active','Completed'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {techPerf.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">No technician data yet</td></tr>
              ) : techPerf.map((t, i) => (
                <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-[#B8860B]/10 text-[#B8860B] rounded-full flex items-center justify-center font-black text-xs">{t.name.charAt(0)}</div>
                      <span className="font-medium text-dark text-xs">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-dark">{t.jobs}</td>
                  <td className="px-4 py-3"><span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">{t.active}</span></td>
                  <td className="px-4 py-3"><span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{t.done}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Appointments Summary — live from /reports/revenue */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
          <h2 className="font-bold text-dark text-sm">Monthly Appointments Summary</h2>
          <button onClick={exportCSV} disabled={!monthlyData.length}
            className="text-xs font-semibold text-[#B8860B] border border-[#B8860B]/30 px-3 py-1.5 rounded-full hover:bg-[#B8860B]/5 transition-colors disabled:opacity-40">
            Export CSV
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80">
              {['Month', 'Appointments'].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthlyData.length === 0 ? (
              <tr><td colSpan={2} className="px-5 py-10 text-center text-gray-400 text-sm">No monthly data yet — appointments will appear here once bookings are made</td></tr>
            ) : monthlyData.map((row, i) => (
              <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5 font-semibold text-dark">{row.month}</td>
                <td className="px-5 py-3.5 text-gray-500">{row.appointments}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── PRODUCT & PARTS MOVEMENT ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-bold text-dark text-sm">📦 Product &amp; Parts Movement</h2>
            <p className="text-xs text-gray-400 mt-0.5">Stock checkouts — last 90 days</p>
          </div>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {[['fast','⚡ Fast Moving','bg-[#B8860B] text-white'],['slow','🐌 Slow Moving','bg-[#1A1A2E] text-white']].map(([key,label,active]) => (
              <button key={key} onClick={() => setMovTab(key)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${movTab === key ? active + ' shadow' : 'text-gray-500 hover:text-gray-700'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {!movement ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-7 h-7 border-4 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : movRows.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="text-4xl mb-2">{movTab === 'fast' ? '⚡' : '🎉'}</div>
            <p className="text-sm font-semibold text-gray-500">
              {movTab === 'fast' ? 'No sales in the last 90 days yet' : 'All products are moving well!'}
            </p>
          </div>
        ) : (
          <>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80">
                {['#','Product','Category','Cost Price','Selling Price','Margin','Units Sold','Stock','Revenue'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {movRows.map((p, i) => {
                const margin    = p.cost_price != null && p.selling_price != null ? Number(p.selling_price) - Number(p.cost_price) : null
                const marginPct = p.cost_price > 0 && margin != null ? Math.round((margin / Number(p.cost_price)) * 100) : null
                const maxQty    = movRows[0]?.total_qty_sold || 1
                return (
                  <tr key={p.product_id} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black
                        ${movTab==='fast' ? i===0?'bg-[#B8860B] text-white':i===1?'bg-gray-200 text-gray-700':i===2?'bg-amber-100 text-amber-700':'bg-gray-100 text-gray-500' : 'bg-red-50 text-red-400 border border-red-100'}`}>
                        {movTab==='fast' ? (i<3?['🥇','🥈','🥉'][i]:i+1) : '!'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-dark text-xs">{p.name}</p>
                      <p className="text-[10px] text-gray-400">{p.transactions} txn{p.transactions!==1?'s':''}</p>
                    </td>
                    <td className="px-4 py-3"><span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{p.category||'—'}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{p.cost_price!=null?fmtP(p.cost_price):<span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-[#B8860B]">{fmtP(p.selling_price)}</td>
                    <td className="px-4 py-3">
                      {margin!=null ? (
                        <span className={`text-xs font-bold ${margin>=0?'text-green-600':'text-red-500'}`}>
                          {margin>=0?'+':''}{fmtP(margin)}
                          {marginPct!=null&&<span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${marginPct>=30?'bg-green-50 text-green-600':marginPct>=10?'bg-amber-50 text-amber-600':'bg-red-50 text-red-500'}`}>{marginPct}%</span>}
                        </span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${movTab==='fast'?'bg-[#B8860B]':'bg-red-300'}`}
                            style={{width:`${Math.min(100,(p.total_qty_sold/maxQty)*100)}%`}} />
                        </div>
                        <span className={`text-xs font-black ${movTab==='fast'?'text-[#B8860B]':'text-red-500'}`}>{p.total_qty_sold}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold ${p.stock_quantity===0?'text-red-500':p.stock_quantity<5?'text-amber-500':'text-gray-700'}`}>
                        {p.stock_quantity}
                        {p.stock_quantity===0&&<span className="ml-1 text-[10px] bg-red-50 text-red-500 px-1 py-0.5 rounded border border-red-100">Out</span>}
                        {p.stock_quantity>0&&p.stock_quantity<5&&<span className="ml-1 text-[10px] bg-amber-50 text-amber-600 px-1 py-0.5 rounded border border-amber-100">Low</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-700">{fmtP(p.total_revenue)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className={`px-5 py-3 border-t text-xs ${movTab==='slow'?'bg-red-50 border-red-100 text-red-600':'bg-gray-50 border-gray-100 text-gray-500'}`}>
            {movTab==='fast'
              ? `Top ${movRows.length} products · Total: ${fmtP(movRows.reduce((s,p)=>s+Number(p.total_revenue||0),0))}`
              : `⚠️ ${movRows.length} product${movRows.length!==1?'s':''} with 0–2 units sold — consider promotions or stock review`}
          </div>
          </>
        )}
      </div>
    </div>
  )
}
// ---- ANALYTICS VIEW ----
function AnalyticsView() {
  const [revenueData,  setRevenueData]  = useState([])
  const [servicesData, setServicesData] = useState([])
  const [apptData,     setApptData]     = useState([])
  const [movement,     setMovement]     = useState(null)
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/reports/revenue').catch(() => null),
      api.get('/reports/services').catch(() => null),
      api.get('/appointments').catch(() => null),
      api.get('/reports/product-movement').catch(() => null),
    ]).then(([rev, svcs, appts, mov]) => {
      if (rev) setRevenueData((rev.data.data || []).map(r => ({
        month: r.month?.slice(0,7) || r.month,
        appointments: r.appointments || 0,
      })).slice(-6).reverse())
      if (svcs) setServicesData((svcs.data.data || []).slice(0, 6).map(s => ({
        name:  s.name || 'Unknown',
        count: s.count || 0,
      })))
      if (appts) {
        const all = appts.data.data || []
        const statusMap = {}
        all.forEach(a => { statusMap[a.status] = (statusMap[a.status] || 0) + 1 })
        setApptData(Object.entries(statusMap).map(([name, value]) => ({ name, value })))
      }
      if (mov) setMovement(mov.data.data)
    }).finally(() => setLoading(false))
  }, [])

  const totalAppts = apptData.reduce((s, d) => s + d.value, 0) || 1
  const STATUS_COLORS = {
    pending: '#F59E0B', confirmed: '#3B82F6',
    in_progress: '#F97316', completed: '#22C55E', cancelled: '#EF4444',
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const noData = (
    <div className="flex flex-col items-center justify-center h-40 text-gray-300">
      <div className="text-4xl mb-2">📊</div>
      <p className="text-sm">No data yet</p>
    </div>
  )

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display text-2xl text-dark">Analytics</h1>
        <p className="text-sm text-gray-400 mt-0.5">Live visual performance metrics</p>
      </div>

      {/* Row 1 — Monthly appointments + Services */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
          <h2 className="font-bold text-dark text-base mb-1">Monthly Appointments</h2>
          <p className="text-xs text-gray-400 mb-5">Last 6 months</p>
          {revenueData.length === 0 ? noData : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenueData} barCategoryGap="30%">
                <XAxis dataKey="month" tick={{ fontSize:11, fill:'#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:'#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius:12, border:'1px solid #E5E7EB', fontSize:12 }} />
                <Bar dataKey="appointments" fill="#B8860B" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
          <h2 className="font-bold text-dark text-base mb-1">Services by Type</h2>
          <p className="text-xs text-gray-400 mb-5">All time booking count</p>
          {servicesData.length === 0 ? noData : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={servicesData} layout="vertical" barCategoryGap="25%">
                <XAxis type="number" tick={{ fontSize:11, fill:'#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize:11, fill:'#374151' }} axisLine={false} tickLine={false} width={110} />
                <Tooltip contentStyle={{ borderRadius:12, border:'1px solid #E5E7EB', fontSize:12 }} />
                <Bar dataKey="count" fill="#1565C0" radius={[0,8,8,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 2 — Appointment status breakdown */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
        <h2 className="font-bold text-dark text-base mb-5">Appointment Status Breakdown</h2>
        {apptData.length === 0 ? noData : (
          <div className="flex items-center gap-10">
            <div className="relative flex-shrink-0">
              <PieChart width={200} height={200}>
                <Pie data={apptData} cx={95} cy={95} innerRadius={58} outerRadius={90} dataKey="value" paddingAngle={3}>
                  {apptData.map((d, i) => (
                    <Cell key={i} fill={STATUS_COLORS[d.name] || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius:10, fontSize:12 }} />
              </PieChart>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-2xl font-black text-dark">{totalAppts}</p>
                  <p className="text-[10px] text-gray-400">total</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {apptData.map((s, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: STATUS_COLORS[s.name] || COLORS[i % COLORS.length] }} />
                  <div>
                    <p className="text-sm font-semibold text-dark capitalize">{s.name.replace('_', ' ')}</p>
                    <p className="text-xs text-gray-400">{s.value} ({Math.round(s.value / totalAppts * 100)}%)</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Row 3 — Fast Moving Parts bar chart + Stock Health donut */}
      <div className="grid grid-cols-2 gap-6">

        {/* Fast Moving Parts — horizontal bar chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
          <h2 className="font-bold text-dark text-base mb-1">⚡ Fast Moving Parts</h2>
          <p className="text-xs text-gray-400 mb-5">Top 8 by units sold — last 90 days</p>
          {!movement || movement.fast_moving.length === 0 ? noData : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={movement.fast_moving.slice(0,8).map(p=>({ name: p.name.length>18?p.name.slice(0,18)+'…':p.name, qty: p.total_qty_sold, revenue: p.total_revenue }))}
                layout="vertical" barCategoryGap="20%">
                <XAxis type="number" tick={{ fontSize:11, fill:'#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize:10, fill:'#374151' }} axisLine={false} tickLine={false} width={120} />
                <Tooltip
                  formatter={(v, n) => [n === 'qty' ? `${v} units` : `MK ${Number(v).toLocaleString()}`, n === 'qty' ? 'Units Sold' : 'Revenue']}
                  contentStyle={{ borderRadius:12, border:'1px solid #E5E7EB', fontSize:11 }} />
                <Bar dataKey="qty" fill="#B8860B" radius={[0,8,8,0]}>
                  {movement.fast_moving.slice(0,8).map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#B8860B' : i === 1 ? '#D4A020' : i === 2 ? '#E8C060' : '#F0D898'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Stock Health — donut showing in-stock vs low vs out */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
          <h2 className="font-bold text-dark text-base mb-1">🗃️ Inventory Health</h2>
          <p className="text-xs text-gray-400 mb-5">Current stock status across all active products</p>
          {!movement || movement.all.length === 0 ? noData : (() => {
            const all = movement.all
            const outOfStock = all.filter(p => p.stock_quantity === 0).length
            const lowStock   = all.filter(p => p.stock_quantity > 0 && p.stock_quantity < 5).length
            const healthy    = all.filter(p => p.stock_quantity >= 5).length
            const stockData  = [
              { name: 'Healthy Stock (≥5)', value: healthy,    color: '#22C55E' },
              { name: 'Low Stock (1–4)',     value: lowStock,   color: '#F59E0B' },
              { name: 'Out of Stock',         value: outOfStock, color: '#EF4444' },
            ].filter(d => d.value > 0)
            const total = stockData.reduce((s, d) => s + d.value, 0) || 1
            const slowCount = movement.slow_moving.length
            return (
              <div>
                <div className="flex items-center gap-8 mb-6">
                  <div className="relative flex-shrink-0">
                    <PieChart width={180} height={180}>
                      <Pie data={stockData} cx={85} cy={85} innerRadius={52} outerRadius={82} dataKey="value" paddingAngle={3}>
                        {stockData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius:10, fontSize:12 }} />
                    </PieChart>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <p className="text-xl font-black text-dark">{total}</p>
                        <p className="text-[10px] text-gray-400">products</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {stockData.map((d, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        <div>
                          <p className="text-sm font-semibold text-dark">{d.name}</p>
                          <p className="text-xs text-gray-400">{d.value} ({Math.round(d.value/total*100)}%)</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Slow mover alert */}
                {slowCount > 0 && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-start gap-2">
                    <span className="text-amber-500 text-base flex-shrink-0">🐌</span>
                    <div>
                      <p className="text-xs font-bold text-amber-700">
                        {slowCount} slow-moving product{slowCount!==1?'s':''} detected
                      </p>
                      <p className="text-[10px] text-amber-600 mt-0.5">
                        0–2 units sold in 90 days. Check the Reports tab for details.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

// ---- CUSTOMERS VIEW ----
function CustomersView() {
  const [data, setData] = useState([])
  useEffect(() => {
    api.get('/customers').then(r => setData(r.data.data || [])).catch(() => setData([]))
  }, [])

  return (
    <div>
      <div className="flex justify-between items-center mb-6"><div><h1 className="font-display text-2xl text-dark">Customers</h1></div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-full hover:bg-primary-dark transition-colors"><Plus size={14} /> Add Customer</button>
      </div>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50">{['Name','Phone','Vehicles','Total Services','Last Visit'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">{h}</th>)}</tr></thead>
          <tbody>
            {data.map((c,i) => (
              <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold text-dark">{c.name}</td>
                <td className="px-4 py-3 text-gray-500">{c.phone}</td>
                <td className="px-4 py-3 text-center">{c.vehicle_count}</td>
                <td className="px-4 py-3 text-center">{c.total_services}</td>
                <td className="px-4 py-3 text-gray-500">{c.last_visit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---- SETTINGS VIEW ----
function SettingsView() {
  const GARAGE_DEFAULTS = {
    garage_name:   'AutoMedic Garage',
    phone:         '+265 999 000 000',
    address:       'Area 47, Lilongwe, Malawi',
    whatsapp:      '+265999000000',
    working_hours: 'Mon–Sat: 7am – 6pm',
    email:         'info@automedic.mw',
    vat_rate:      '16.5',
    currency:      'MK',
  }

  const [form, setForm]   = useState(() => {
    try { return { ...GARAGE_DEFAULTS, ...JSON.parse(localStorage.getItem('automedic_settings') || '{}') } }
    catch { return GARAGE_DEFAULTS }
  })
  const [saved,  setSaved]  = useState(false)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      localStorage.setItem('automedic_settings', JSON.stringify(form))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  const field = (key, label, type = 'text', placeholder = '') => (
    <div key={key}>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={form[key] || ''}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
      />
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-dark">Settings</h1>
          <p className="text-sm text-gray-400 mt-0.5">Garage profile and system configuration</p>
        </div>
        {saved && (
          <span className="flex items-center gap-2 text-green-600 text-sm font-semibold bg-green-50 px-4 py-2 rounded-full border border-green-100">
            ✓ Settings saved
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Garage Info */}
        <div className="col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
          <h2 className="font-bold text-dark text-base mb-5 flex items-center gap-2">
            <span className="w-8 h-8 bg-[#B8860B]/10 text-[#B8860B] rounded-lg flex items-center justify-center text-sm">🏪</span>
            Garage Information
          </h2>
          <div className="grid grid-cols-2 gap-5">
            {field('garage_name',   'Garage Name',    'text', 'AutoMedic Garage')}
            {field('phone',         'Phone Number',   'text', '+265 999 000 000')}
            {field('address',       'Address',        'text', 'Area 47, Lilongwe, Malawi')}
            {field('email',         'Contact Email',  'email','info@automedic.mw')}
            {field('whatsapp',      'WhatsApp Number','text', '+265999000000')}
            {field('working_hours', 'Working Hours',  'text', 'Mon–Sat: 7am – 6pm')}
          </div>
        </div>

        {/* Billing & System */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
            <h2 className="font-bold text-dark text-base mb-5 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-sm">💰</span>
              Billing
            </h2>
            <div className="space-y-4">
              {field('currency',  'Currency Symbol', 'text', 'MK')}
              {field('vat_rate',  'VAT Rate (%)',     'number','16.5')}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">Email Notifications</p>
                <p className="text-xs text-amber-700 mt-1">
                  Configure SMTP credentials in <code className="bg-amber-100 px-1 rounded">backend/.env</code> to enable automatic email notifications.
                </p>
                <div className="mt-3 space-y-1 text-xs font-mono text-amber-700 bg-amber-100 rounded-lg p-2">
                  <div>EMAIL_HOST=smtp.gmail.com</div>
                  <div>EMAIL_USER=your@email.com</div>
                  <div>EMAIL_PASS=app_password</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-full hover:bg-primary-dark transition-colors text-sm disabled:opacity-60">
          <Save size={14} /> {saving ? 'Saving...' : 'Save Settings'}
        </button>
        <button onClick={() => { setForm(GARAGE_DEFAULTS); localStorage.removeItem('automedic_settings') }}
          className="px-6 py-3 border border-gray-200 text-gray-500 text-sm font-semibold rounded-full hover:border-red-300 hover:text-red-500 transition-colors">
          Reset to Defaults
        </button>
      </div>
    </div>
  )
}

// ---- VEHICLES VIEW ----
function VehiclesView() {
  const [data, setData] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/vehicles').then(r => {
      // Normalise API response shape to match what the table expects
      const rows = (r.data.data || []).map(v => ({
        id:           v.id,
        reg:          v.registration_number,
        make:         v.make,
        model:        v.model,
        year:         v.year || '—',
        color:        v.color || '—',
        owner:        v.owner_name || '—',
        owner_phone:  v.owner_phone || '',
        last_service: v.created_at ? new Date(v.created_at).toLocaleDateString('en-GB') : '—',
        status:       'Registered',
      }))
      setData(rows)
    }).catch(() => setData([])).finally(() => setLoading(false))
  }, [])

  const filtered = data.filter(v =>
    !search || `${v.make} ${v.model} ${v.reg} ${v.owner}`.toLowerCase().includes(search.toLowerCase())
  )

  const statusColor = (s) => ({
    'In Repair':  'bg-orange-50 text-orange-500 border border-orange-100',
    'Booked':     'bg-blue-50 text-blue-500 border border-blue-100',
    'Completed':  'bg-green-50 text-green-600 border border-green-100',
    'Registered': 'bg-gray-50 text-gray-500 border border-gray-200',
  }[s] || 'bg-gray-50 text-gray-500')

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-display text-2xl text-dark">Vehicles</h1>
          <p className="text-sm text-gray-400 mt-0.5">All vehicles registered in the system</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-full hover:bg-primary-dark transition-colors">
          <Plus size={14} /> Add Vehicle
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          ['🚗', data.length,                              'Total Vehicles',   'bg-blue-50 text-blue-600'],
          ['🔧', data.filter(v=>v.status==='In Repair').length,  'In Repair',   'bg-orange-50 text-orange-600'],
          ['📅', data.filter(v=>v.status==='Booked').length,     'Booked',      'bg-yellow-50 text-yellow-600'],
          ['✅', data.filter(v=>v.status==='Completed').length,  'Completed',   'bg-green-50 text-green-600'],
        ].map(([icon, val, label, cls], i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 flex items-center gap-3">
            <div className={`w-11 h-11 ${cls} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>{icon}</div>
            <div><div className="text-xl font-black text-dark leading-none">{val}</div><div className="text-xs text-gray-400 mt-1">{label}</div></div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by registration, make, model or owner..."
          className="w-full max-w-sm px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-white" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80">
              {['Registration','Make / Model','Year','Color','Owner','Status','Last Service','Action'].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"/>Loading vehicles...</div>
              </td></tr>
            ) : filtered.map((v, i) => (
              <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3.5 font-bold text-primary text-sm">{v.reg}</td>
                <td className="px-4 py-3.5 font-medium text-dark">{v.make} {v.model}</td>
                <td className="px-4 py-3.5 text-gray-500">{v.year}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border border-gray-200 flex-shrink-0"
                      style={{ background: v.color.toLowerCase() === 'silver' ? '#C0C0C0' : v.color.toLowerCase() === 'white' ? '#F5F5F5' : v.color.toLowerCase() }} />
                    <span className="text-gray-500 text-xs">{v.color}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 font-medium text-dark text-xs">{v.owner}</td>
                <td className="px-4 py-3.5">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusColor(v.status)}`}>{v.status}</span>
                </td>
                <td className="px-4 py-3.5 text-gray-400 text-xs">{v.last_service}</td>
                <td className="px-4 py-3.5">
                  <div className="flex gap-1.5">
                    <button className="text-[10px] font-semibold text-primary border border-primary/30 px-2.5 py-1.5 rounded-lg hover:bg-primary/5 transition-colors">View</button>
                    <button className="w-7 h-7 border border-gray-200 rounded-lg flex items-center justify-center hover:border-red-400 hover:text-red-500 transition-colors">
                      <Trash2 size={11} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">No vehicles found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---- INSPECTION ADMIN VIEW ----
function InspectionAdminView() {
  const [jobs, setJobs] = useState([])
  useEffect(() => {
    api.get('/job-cards').then(r => {
      setJobs((r.data.data || []).filter(j => j.status !== 'completed'))
    }).catch(() => setJobs([]))
  }, [])
  return <InspectionModule jobs={jobs} />
}

// ── RECEIPT MODAL COMPONENT ──────────────────────────────────────────────────
function ReceiptModal({ receipt, onClose }) {
  if (!receipt) return null

  const checkout = receipt.data || receipt
  const items = typeof checkout.items === 'string' ? JSON.parse(checkout.items) : (checkout.items || [])

  const fmt = (n) => `MK ${Number(n || 0).toLocaleString()}`

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:p-0 print:static print:bg-white">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col print:shadow-none print:w-full print:max-w-none print:p-0" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4 print:hidden">
          <div>
            <h3 className="font-bold text-dark text-lg flex items-center gap-2">
              <CheckCircle className="text-green-500" size={20} />
              Checkout Log Details
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Receipt summary</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
            <X size={14} />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="flex-1 overflow-y-auto space-y-4 print:overflow-visible text-left">
          {/* Brand header */}
          <div className="text-center pb-4 border-b border-dashed border-gray-200">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-white font-black text-sm mx-auto mb-2">AM</div>
            <h2 className="text-base font-black tracking-tight text-dark uppercase">AutoMedic Garage</h2>
            <p className="text-[10px] text-gray-400">Blantyre, Malawi · Phone: +265 999 123 456</p>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-y-2 text-xs border-b border-dashed border-gray-200 pb-4">
            <span className="text-gray-400">Checkout ID:</span>
            <span className="font-mono text-right text-dark truncate">{checkout.id}</span>

            <span className="text-gray-400">Date:</span>
            <span className="text-right text-dark">{new Date(checkout.created_at || Date.now()).toLocaleString('en-GB')}</span>

            <span className="text-gray-400">Type:</span>
            <span className="text-right font-semibold uppercase text-primary text-[10px]">{checkout.type === 'job_card' ? 'Job Card Repair' : 'Walk-in Sale'}</span>

            <span className="text-gray-400">Customer:</span>
            <span className="text-right text-dark font-medium">{checkout.customer_name || 'Walk-in Guest'}</span>

            {checkout.invoice_id && (
              <>
                <span className="text-gray-400">Invoice Ref:</span>
                <span className="text-right font-mono text-dark">{checkout.invoice_id.slice(0, 8).toUpperCase()}</span>
              </>
            )}
          </div>

          {/* Items */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider text-[10px]">Items Summary</p>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-xs">
                  <div className="max-w-[70%]">
                    <p className="font-semibold text-dark leading-tight">{item.name}</p>
                    <p className="text-[10px] text-gray-400">{item.qty} x {fmt(item.unit_price)}</p>
                  </div>
                  <span className="font-bold text-dark">{fmt(item.unit_price * item.qty)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {checkout.notes && (
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-xs">
              <span className="font-semibold text-gray-400 block mb-0.5">Notes:</span>
              <p className="text-gray-600 italic">{checkout.notes}</p>
            </div>
          )}

          {/* Summary pricing */}
          <div className="border-t border-dashed border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtotal:</span>
              <span>{fmt(checkout.subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>VAT (16.5%):</span>
              <span>{fmt(checkout.tax)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-dark pt-1.5 border-t border-gray-100">
              <span>TOTAL PAID:</span>
              <span>{fmt(checkout.total)}</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2.5 mt-6 border-t border-gray-100 pt-4 print:hidden">
          <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-full transition-colors">
            <Printer size={13} />
            Print Receipt
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-full transition-colors">
            Close View
          </button>
        </div>
      </div>
    </div>
  )
}

// ── ADMIN CHECKOUTS VIEW ─────────────────────────────────────────────────────
function AdminCheckoutsView() {
  const [history, setHistory]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [viewing, setViewing]   = useState(null)

  const fmt = (n) => `MK ${Number(n || 0).toLocaleString()}`

  const load = () => {
    setLoading(true)
    api.get('/checkout')
      .then(r => setHistory(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = history.filter(h => {
    const q = search.toLowerCase()
    return !search ||
      (h.customer_name || '').toLowerCase().includes(q) ||
      (h.id || '').toLowerCase().includes(q) ||
      (h.tracking_number || '').toLowerCase().includes(q) ||
      (h.created_by_name || '').toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-dark">Checkout Logs</h1>
        <p className="text-sm text-gray-400 mt-0.5">Audit history of all products and parts checkouts across all stock keepers</p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search checkouts by customer name, checkout ID, vehicle tracking no, stock keeper..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
          />
        </div>

        {/* Table list */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-400 font-bold uppercase tracking-wider text-[9px] border-b border-gray-100">
                <th className="px-4 py-3">Checkout ID</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Job Card Ref</th>
                <th className="px-4 py-3">Logged By</th>
                <th className="px-4 py-3 text-right">Total Cost</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Loading history logs...
                    </div>
                  </td>
                </tr>
              ) : filtered.length ? filtered.map(h => (
                <tr key={h.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-gray-400 text-[10px]">{h.id.slice(0, 10)}...</td>
                  <td className="px-4 py-3.5 text-gray-500">{new Date(h.created_at).toLocaleDateString('en-GB')} {new Date(h.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded font-bold text-[8px] uppercase
                      ${h.type === 'job_card' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-purple-50 text-purple-600 border border-purple-100'}`}>
                      {h.type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-dark">{h.customer_display_name || h.customer_name || 'Walk-in Guest'}</td>
                  <td className="px-4 py-3.5 font-mono text-gray-500 text-[10px]">{h.tracking_number || 'None'}</td>
                  <td className="px-4 py-3.5 text-gray-500">{h.created_by_name || 'System'}</td>
                  <td className="px-4 py-3.5 text-right font-bold text-dark">{fmt(h.total)}</td>
                  <td className="px-4 py-3.5 text-center">
                    <button onClick={() => setViewing(h)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-lg transition-all">
                      <Eye size={11} /> Details
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400">
                    No checkouts found matching criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ReceiptModal receipt={viewing} onClose={() => setViewing(null)} />
    </div>
  )
}

// ---- MAIN ADMIN DASHBOARD ----
export default function AdminDashboard() {
  const { logout } = useAuth()
  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-dark border-b border-white/10 shadow-sm flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-white font-black text-xs">AM</div>
          <span className="font-black text-white">AutoMedic <span className="text-primary">Admin</span></span>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-white/10 text-white/70 text-xs font-semibold px-3 py-1.5 rounded-full">Administrator</span>
          <Link to="/" className="text-xs text-white/60 hover:text-white transition-colors">View Site</Link>
          <button onClick={logout} className="text-xs text-white/60 hover:text-white transition-colors">Logout</button>
          <div className="w-8 h-8 bg-dark-2 border border-white/20 rounded-full flex items-center justify-center text-white font-bold text-xs">AD</div>
        </div>
      </header>

      <div className="flex pt-16">
        <Sidebar logout={logout} />
        <main className="ml-[220px] flex-1 p-7">
          <Routes>
            <Route index element={<DashboardView />} />
            <Route path="appointments" element={<AppointmentsView />} />
            <Route path="vehicles" element={<VehiclesView />} />
            <Route path="customers" element={<CustomersView />} />
            <Route path="revenue"  element={<RevenuePage />} />
            <Route path="invoices"   element={<InvoicesManagement />} />
            <Route path="reports" element={<ReportsView />} />
            <Route path="analytics" element={<AnalyticsView />} />
            <Route path="products"      element={<ProductsManagement />} />
            <Route path="checkouts"     element={<AdminCheckoutsView />} />
            <Route path="services-mgmt" element={<ServicesManagement />} />
            <Route path="inspection" element={<InspectionAdminView />} />
            <Route path="users"      element={<UserManagement />} />
            <Route path="settings"   element={<SettingsView />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}




