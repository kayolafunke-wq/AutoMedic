import { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { LayoutDashboard, Calendar, Car, Users, BarChart2, TrendingUp, Settings, LogOut, Plus, Trash2, Edit2, Globe, ClipboardCheck, X, Search } from 'lucide-react'
import InspectionModule from '../technician/InspectionModule'
import UserManagement from './UserManagement'

const COLORS = ['#B8860B','#25D366','#1565C0','#E65100']

const navItems = [
  { path:'', icon:LayoutDashboard, label:'Dashboard' },
  { path:'appointments', icon:Calendar, label:'Appointments' },
  { path:'vehicles', icon:Car, label:'Vehicles' },
  { path:'customers', icon:Users, label:'Customers' },
  { path:'reports', icon:BarChart2, label:'Reports' },
  { path:'analytics', icon:TrendingUp, label:'Analytics' },
  { path:'inspection', icon:ClipboardCheck, label:'Vehicle Inspection' },
  { path:'users',      icon:Users,          label:'User Management' },
  { path:'settings',   icon:Settings,       label:'Settings' },
]

function Sidebar({ logout }) {
  const location = useLocation()
  const isActive = (p) => {
    const full = '/admin' + (p ? '/' + p : '')
    return location.pathname === full || (p === '' && location.pathname === '/admin')
  }
  return (
    <aside className="w-[220px] min-h-[calc(100vh-64px)] bg-dark fixed top-16 left-0 bottom-0 flex flex-col py-5">
      <div className="px-3 mb-2">
        <p className="text-xs font-bold uppercase tracking-widest text-white/30 px-3 py-1">Main</p>
      </div>
      <nav className="flex flex-col gap-0.5 px-3 flex-1">
        {navItems.map(({ path, icon:Icon, label }) => (
          <Link key={path} to={`/admin${path ? '/'+path : ''}`}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive(path) ? 'bg-primary text-white' : 'text-white/60 hover:bg-white/8 hover:text-white'}`}>
            <Icon size={16} />{label}
          </Link>
        ))}
      </nav>
      <div className="px-3 pt-3 border-t border-white/10">
        <Link to="/" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-colors">
          <Globe size={16} /> View Website
        </Link>
        <button onClick={logout} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors w-full">
          <LogOut size={16} /> Logout
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

  useEffect(() => {
    api.get('/reports/dashboard').then(r => setStats(r.data.data)).catch(() => {})
    api.get('/appointments').then(r => setAppts(r.data.data?.slice(0,5) || [])).catch(() => {})
    api.get('/job-cards').then(r => setActiveJobs((r.data.data || []).filter(j => j.status !== 'completed').slice(0,5))).catch(() => {})
  }, [])

  return (
    <div>
      <div className="flex justify-between items-center mb-7">
        <div><h1 className="font-display text-2xl text-dark">Dashboard</h1><p className="text-gray-500 text-sm">Welcome back! {new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p></div>
      </div>
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-7">
          <StatCard icon={Users} val={stats.total_customers} label="Total Customers" bg="bg-blue-50" color="text-blue-600" />
          <StatCard icon={Calendar} val={stats.todays_appointments} label="Today's Appointments" bg="bg-green-50" color="text-green-600" />
          <StatCard icon={Car} val={stats.active_repairs} label="Active Repairs" bg="bg-orange-50" color="text-orange-600" />
          <StatCard icon={TrendingUp} val={`MK ${Number(stats.monthly_revenue/1000000).toFixed(1)}M`} label="Monthly Revenue" bg="bg-purple-50" color="text-purple-600" />
        </div>
      )}
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
  const TECHNICIANS = ['Peter Nkosi', 'Charles Banda', 'Eric Phiri']
  const [data, setData] = useState([])

  const [assignModal, setAssignModal] = useState(null) // holds appointment being assigned
  const [selectedTech, setSelectedTech] = useState('')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const accept = (appt) => {
    setAssignModal(appt)
    setSelectedTech(TECHNICIANS[0])
  }

  const confirmAssign = () => {
    if (!selectedTech) return
    setData(prev => prev.map(a =>
      a.id === assignModal.id
        ? { ...a, status: 'confirmed', technician: selectedTech }
        : a
    ))
    showToast(`✓ AC-${assignModal.tracking_number} accepted & assigned to ${selectedTech}`)
    setAssignModal(null)
  }

  const reject = (id) => {
    setData(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a))
    showToast('Appointment rejected')
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
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-full hover:bg-primary-dark transition-colors">
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
                  {a.technician
                    ? <span className="flex items-center gap-1.5 font-medium text-gray-600">
                        <span className="w-5 h-5 bg-[#B8860B]/10 text-[#B8860B] rounded-full flex items-center justify-center font-black text-[9px]">
                          {a.technician.charAt(0)}
                        </span>
                        {a.technician}
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
                      <button className="w-7 h-7 border border-gray-200 rounded-lg flex items-center justify-center hover:border-red-400 hover:text-red-500 transition-colors">
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
      {assignModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setAssignModal(null)}>
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
                {TECHNICIANS.map(tech => (
                  <button key={tech} onClick={() => setSelectedTech(tech)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-[1.5px] transition-all text-left
                      ${selectedTech === tech ? 'bg-[#B8860B]/8 border-[#B8860B] text-[#B8860B]' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0
                      ${selectedTech === tech ? 'bg-[#B8860B] text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {tech.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{tech}</p>
                      <p className="text-xs opacity-60">Technician · Available</p>
                    </div>
                    {selectedTech === tech && <span className="text-[#B8860B] text-lg">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Confirm */}
            <button onClick={confirmAssign}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#B8860B] text-white font-bold rounded-full hover:bg-[#8B6508] transition-all hover:shadow-lg hover:shadow-[#B8860B]/30 text-sm">
              ✓ Accept Appointment & Assign to {selectedTech}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ---- REPORTS VIEW ----
function ReportsView() {
  const monthlyTable = [
    { month:'March 2024',   vehicles:189, appointments:214, revenue:4200000, trend:'+18%', up:true },
    { month:'February 2024',vehicles:162, appointments:188, revenue:3560000, trend:'+9%',  up:true },
    { month:'January 2024', vehicles:149, appointments:170, revenue:3270000, trend:'-4%',  up:false },
    { month:'December 2023',vehicles:198, appointments:225, revenue:4900000, trend:'+28%', up:true },
    { month:'November 2023',vehicles:155, appointments:178, revenue:3820000, trend:'+7%',  up:true },
  ]
  const topServices = [
    { name:'Oil Change', count:88, revenue:440000 },
    { name:'Engine Repair', count:72, revenue:1800000 },
    { name:'Diagnostics', count:60, revenue:420000 },
    { name:'Brake Repair', count:55, revenue:660000 },
    { name:'Wheel Alignment', count:44, revenue:352000 },
  ]

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display text-2xl text-dark">Reports</h1>
        <p className="text-sm text-gray-400 mt-0.5">Business performance overview</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4 mb-7">
        {[
          ['🚗','2,410','Total Vehicles Serviced','↑ 189 this month','bg-blue-50 text-blue-600'],
          ['💰','MK 4.2M','Revenue This Month','↑ 18% vs last month','bg-[#B8860B]/10 text-[#B8860B]'],
          ['⭐','4.8/5','Avg Satisfaction','From 312 reviews','bg-purple-50 text-purple-600'],
          ['⏱','2.4 days','Avg Repair Time','↓ 0.3 days improvement','bg-green-50 text-green-600'],
        ].map(([icon,val,label,sub,cls],i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-11 h-11 ${cls} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>{icon}</div>
              <div>
                <div className="text-xl font-black text-dark leading-none">{val}</div>
                <div className="text-xs text-gray-400 mt-0.5">{label}</div>
              </div>
            </div>
            <p className="text-xs text-green-500 font-semibold pl-14">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Top Services Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-dark text-sm">Top Services</h2>
            <span className="text-xs text-gray-400">This month</span>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50/80">
              {['Service','Jobs','Revenue','%'].map(h=>(
                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {topServices.map((s,i) => {
                const pct = Math.round(s.count / topServices.reduce((acc,x)=>acc+x.count,0) * 100)
                return (
                  <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-dark">{s.name}</td>
                    <td className="px-4 py-3 text-gray-500">{s.count}</td>
                    <td className="px-4 py-3 font-semibold text-[#B8860B] text-xs">MK {s.revenue.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#B8860B] rounded-full" style={{width:`${pct}%`}} />
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

        {/* Technician Performance */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-dark text-sm">Technician Performance</h2>
            <span className="text-xs text-gray-400">This month</span>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50/80">
              {['Technician','Jobs Done','Avg Days','Rating'].map(h=>(
                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {[
                
                
                
              ].map(([name,jobs,days,rating],i) => (
                <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-[#B8860B]/10 text-[#B8860B] rounded-full flex items-center justify-center font-black text-xs">{name.charAt(0)}</div>
                      <span className="font-medium text-dark text-xs">{name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-dark">{jobs}</td>
                  <td className="px-4 py-3 text-gray-500">{days} days</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-xs font-bold text-yellow-500">⭐ {rating}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Revenue Summary Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
          <h2 className="font-bold text-dark text-sm">Monthly Revenue Summary</h2>
          <button className="text-xs font-semibold text-[#B8860B] border border-[#B8860B]/30 px-3 py-1.5 rounded-full hover:bg-[#B8860B]/5 transition-colors">
            Export CSV
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80">
              {['Month','Vehicles','Appointments','Revenue','Trend'].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthlyTable.map((row, i) => (
              <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5 font-semibold text-dark">{row.month}</td>
                <td className="px-5 py-3.5 text-gray-500">{row.vehicles}</td>
                <td className="px-5 py-3.5 text-gray-500">{row.appointments}</td>
                <td className="px-5 py-3.5 font-bold text-dark">MK {row.revenue.toLocaleString()}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${row.up ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                    {row.trend}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---- ANALYTICS VIEW ----
function AnalyticsView() {
  const revenueData = [
    { month:'Nov', revenue:3820000 }, { month:'Dec', revenue:4900000 },
    { month:'Jan', revenue:3270000 }, { month:'Feb', revenue:3560000 },
    { month:'Mar', revenue:4200000 },
  ]
  const vehiclesData = [
    { month:'Nov', vehicles:155 }, { month:'Dec', vehicles:198 },
    { month:'Jan', vehicles:149 }, { month:'Feb', vehicles:162 },
    { month:'Mar', vehicles:189 },
  ]
  const servicesData = [
    { name:'Engine Repair', count:72 }, { name:'Oil Change', count:88 },
    { name:'Diagnostics', count:60 }, { name:'Brakes', count:55 },
    { name:'Wheel Align.', count:44 },
  ]
  const bookingSource = [
    { name:'Website', value:187 }, { name:'WhatsApp', value:90 }, { name:'Walk-in', value:35 }
  ]

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display text-2xl text-dark">Analytics</h1>
        <p className="text-sm text-gray-400 mt-0.5">Visual performance metrics</p>
      </div>

      {/* Row 1 — Revenue + Vehicles */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
          <h2 className="font-bold text-dark text-base mb-1">Monthly Revenue</h2>
          <p className="text-xs text-gray-400 mb-5">Last 5 months (MK)</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueData} barCategoryGap="30%">
              <XAxis dataKey="month" tick={{ fontSize:12, fill:'#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:'#9CA3AF' }} axisLine={false} tickLine={false}
                tickFormatter={v => `MK ${(v/1000000).toFixed(1)}M`} />
              <Tooltip formatter={v => [`MK ${v.toLocaleString()}`, 'Revenue']}
                contentStyle={{ borderRadius:12, border:'1px solid #E5E7EB', fontSize:12 }} />
              <Bar dataKey="revenue" fill="#B8860B" radius={[8,8,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
          <h2 className="font-bold text-dark text-base mb-1">Vehicles Serviced</h2>
          <p className="text-xs text-gray-400 mb-5">Monthly count</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={vehiclesData}>
              <XAxis dataKey="month" tick={{ fontSize:12, fill:'#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:'#9CA3AF' }} axisLine={false} tickLine={false} domain={['auto','auto']} />
              <Tooltip contentStyle={{ borderRadius:12, border:'1px solid #E5E7EB', fontSize:12 }} />
              <Line type="monotone" dataKey="vehicles" stroke="#1565C0" strokeWidth={3}
                dot={{ r:5, fill:'#1565C0', strokeWidth:2, stroke:'#fff' }}
                activeDot={{ r:7 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2 — Services + Booking Sources */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
          <h2 className="font-bold text-dark text-base mb-5">Services by Type</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={servicesData} layout="vertical" barCategoryGap="25%">
              <XAxis type="number" tick={{ fontSize:11, fill:'#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize:11, fill:'#374151' }} axisLine={false} tickLine={false} width={100} />
              <Tooltip contentStyle={{ borderRadius:12, border:'1px solid #E5E7EB', fontSize:12 }} />
              <Bar dataKey="count" fill="#1565C0" radius={[0,8,8,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
          <h2 className="font-bold text-dark text-base mb-5">Booking Sources</h2>
          <div className="flex items-center gap-8">
            <div className="relative flex-shrink-0">
              <PieChart width={180} height={180}>
                <Pie data={bookingSource} cx={85} cy={85} innerRadius={52} outerRadius={82} dataKey="value" paddingAngle={3}>
                  {bookingSource.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius:10, fontSize:12 }} />
              </PieChart>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-2xl font-black text-dark">312</p>
                  <p className="text-[10px] text-gray-400">total</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {bookingSource.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                  <div>
                    <p className="text-sm font-semibold text-dark">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.value} ({Math.round(s.value/312*100)}%)</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-2xl text-dark">Settings</h1></div>
      <div className="bg-white rounded-2xl p-6 shadow-sm max-w-2xl">
        <div className="grid grid-cols-2 gap-5">
          {[['Garage Name','AutoMedic Garage'],['Phone Number','+265 999 000 000'],['Address','Area 47, Lilongwe, Malawi'],['WhatsApp','+265 999 000 000'],['Working Hours','Mon–Sat: 7am – 6pm'],['Email','info@automedic.mw']].map(([label,val],i) => (
            <div key={i}><label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
              <input defaultValue={val} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" /></div>
          ))}
        </div>
        <button className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-full hover:bg-primary-dark transition-colors text-sm">Save Settings</button>
      </div>
    </div>
  )
}

// ---- VEHICLES VIEW ----
function VehiclesView() {
  const [data, setData] = useState([])
  const [search, setSearch] = useState('')

  const filtered = data.filter(v =>
    !search || `${v.make} ${v.model} ${v.reg} ${v.owner}`.toLowerCase().includes(search.toLowerCase())
  )

  const statusColor = (s) => ({
    'In Repair':  'bg-orange-50 text-orange-500 border border-orange-100',
    'Booked':     'bg-blue-50 text-blue-500 border border-blue-100',
    'Completed':  'bg-green-50 text-green-600 border border-green-100',
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
            {filtered.map((v, i) => (
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
            {filtered.length === 0 && (
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
  const demoJobs = [
    { id:'1', tracking_number:'AC-2847', make:'Toyota', model:'Corolla', registration_number:'MK 1234', customer_name:'John Banda', service_name:'Engine Repair', progress:65, status:'in_progress' },
    { id:'2', tracking_number:'AC-2850', make:'Nissan', model:'Tiida',   registration_number:'MK 4590', customer_name:'Grace Phiri', service_name:'Brake Repair', progress:20, status:'pending' },
  ]
  return <InspectionModule jobs={demoJobs} />
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
            <Route path="reports" element={<ReportsView />} />
            <Route path="analytics" element={<AnalyticsView />} />
            <Route path="inspection" element={<InspectionAdminView />} />
            <Route path="users"      element={<UserManagement />} />
            <Route path="settings"   element={<SettingsView />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}




