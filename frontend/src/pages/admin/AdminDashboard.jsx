import { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { LayoutDashboard, Calendar, Car, Users, BarChart2, TrendingUp, Settings, LogOut, Plus, Trash2, Edit2, Globe, ClipboardCheck } from 'lucide-react'

const COLORS = ['#B8860B','#25D366','#1565C0','#E65100']

const navItems = [
  { path:'', icon:LayoutDashboard, label:'Dashboard' },
  { path:'appointments', icon:Calendar, label:'Appointments' },
  { path:'vehicles', icon:Car, label:'Vehicles' },
  { path:'customers', icon:Users, label:'Customers' },
  { path:'reports', icon:BarChart2, label:'Reports' },
  { path:'analytics', icon:TrendingUp, label:'Analytics' },
  { path:'inspection', icon:ClipboardCheck, label:'Vehicle Inspection' },
  { path:'settings', icon:Settings, label:'Settings' },
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
          <Link key={path} to={path === 'inspection' ? '/inspection' : `/admin${path ? '/'+path : ''}`}
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
  const [stats, setStats] = useState(null)
  const [appointments, setAppointments] = useState([])

  useEffect(() => {
    api.get('/reports/dashboard').then(r => setStats(r.data.data)).catch(() => setStats({ total_customers:248, todays_appointments:14, active_repairs:24, monthly_revenue:4200000 }))
    api.get('/appointments').then(r => setAppointments(r.data.data?.slice(0,5) || [])).catch(() => setAppointments([
      { tracking_number:'AC-2847', customer_name:'John Banda', make:'Toyota', model:'Corolla', service_name:'Engine Repair', status:'in_progress' },
      { tracking_number:'AC-2850', customer_name:'Grace Phiri', make:'Nissan', model:'Tiida', service_name:'Brake Repair', status:'pending' },
      { tracking_number:'AC-2851', customer_name:'Daniel Chirwa', make:'Honda', model:'CR-V', service_name:'Oil Change', status:'pending' },
    ]))
  }, [])

  return (
    <div>
      <div className="flex justify-between items-center mb-7">
        <div><h1 className="font-display text-2xl text-dark">Dashboard</h1><p className="text-gray-500 text-sm">Welcome back! {new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p></div>
      </div>
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-7">
          <StatCard icon={Users} val={stats.total_customers} label="Total Customers" trend="↑ 12 this month" bg="bg-blue-50" color="text-blue-600" />
          <StatCard icon={Calendar} val={stats.todays_appointments} label="Today's Appointments" trend="↑ 3 vs yesterday" bg="bg-green-50" color="text-green-600" />
          <StatCard icon={Car} val={stats.active_repairs} label="Active Repairs" trend="↑ 5 in progress" bg="bg-orange-50" color="text-orange-600" />
          <StatCard icon={TrendingUp} val={`MK ${(stats.monthly_revenue/1000000).toFixed(1)}M`} label="Monthly Revenue" trend="↑ 18% vs last month" bg="bg-purple-50" color="text-purple-600" />
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4"><h2 className="font-bold text-dark text-sm">Recent Appointments</h2><span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">Today</span></div>
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
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-dark text-sm mb-4">Active Repairs</h2>
          <div className="space-y-3">
            {[['Toyota Corolla MK1234','Peter Nkosi',65],['Nissan Tiida MK4590','Charles Banda',20],['Ford Ranger MK3301','Eric Phiri',80],['Honda CR-V MK7823','Peter Nkosi',10]].map(([veh,tech,prog],i)=>(
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-dark truncate">{veh}</p><p className="text-xs text-gray-400">{tech}</p></div>
                <div className="flex items-center gap-2 w-32 flex-shrink-0">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-primary to-yellow-500 rounded-full" style={{width:`${prog}%`}}/></div>
                  <span className="text-xs font-bold w-8 text-right">{prog}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- APPOINTMENTS VIEW ----
function AppointmentsView() {
  const [data, setData] = useState([])
  useEffect(() => {
    api.get('/appointments').then(r => setData(r.data.data || [])).catch(() => setData([
      { tracking_number:'AC-2847', customer_name:'John Banda', make:'Toyota', model:'Corolla', registration_number:'MK 1234', service_name:'Engine Repair', preferred_date:'2024-03-20', status:'in_progress' },
      { tracking_number:'AC-2850', customer_name:'Grace Phiri', make:'Nissan', model:'Tiida', registration_number:'MK 4590', service_name:'Brake Repair', preferred_date:'2024-03-22', status:'pending' },
    ]))
  }, [])

  return (
    <div>
      <div className="flex justify-between items-center mb-6"><div><h1 className="font-display text-2xl text-dark">Appointments</h1><p className="text-sm text-gray-500">Manage all bookings</p></div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-full hover:bg-primary-dark transition-colors"><Plus size={14} /> Add Appointment</button>
      </div>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50">{['#','Customer','Vehicle','Service','Date','Status','Action'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">{h}</th>)}</tr></thead>
          <tbody>
            {data.map((a,i) => (
              <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold text-primary">{a.tracking_number}</td>
                <td className="px-4 py-3 font-medium">{a.customer_name}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{a.make} {a.model} {a.registration_number}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{a.service_name}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{a.preferred_date}</td>
                <td className="px-4 py-3"><span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${a.status==='in_progress'?'bg-orange-50 text-orange-600':a.status==='completed'?'bg-green-50 text-green-600':'bg-blue-50 text-blue-600'}`}>{a.status?.replace('_',' ')}</span></td>
                <td className="px-4 py-3"><div className="flex gap-1"><button className="w-7 h-7 border border-gray-200 rounded-lg flex items-center justify-center hover:border-primary hover:text-primary transition-colors"><Edit2 size={12}/></button><button className="w-7 h-7 border border-gray-200 rounded-lg flex items-center justify-center hover:border-red-400 hover:text-red-500 transition-colors"><Trash2 size={12}/></button></div></td>
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
    { month:'Nov', revenue:3820000 }, { month:'Dec', revenue:4900000 }, { month:'Jan', revenue:3270000 },
    { month:'Feb', revenue:3560000 }, { month:'Mar', revenue:4200000 },
  ]
  const servicesData = [
    { name:'Engine Repair', count:72 }, { name:'Oil Change', count:88 }, { name:'Diagnostics', count:60 },
    { name:'Brakes', count:55 }, { name:'Alignment', count:44 },
  ]
  const bookingSource = [{ name:'Website', value:187 }, { name:'WhatsApp', value:90 }, { name:'Walk-in', value:35 }]

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-2xl text-dark">Analytics</h1></div>
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-dark text-sm mb-4">Monthly Revenue (MK)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData}><XAxis dataKey="month" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}} tickFormatter={v=>`${v/1000000}M`}/><Tooltip formatter={v=>`MK ${v.toLocaleString()}`}/><Bar dataKey="revenue" fill="#B8860B" radius={[6,6,0,0]}/></BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-dark text-sm mb-4">Services by Type</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={servicesData} layout="vertical"><XAxis type="number" tick={{fontSize:11}}/><YAxis dataKey="name" type="category" tick={{fontSize:10}} width={90}/><Tooltip/><Bar dataKey="count" fill="#1565C0" radius={[0,6,6,0]}/></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <h2 className="font-bold text-dark text-sm mb-4">Booking Sources</h2>
        <div className="flex items-center gap-8">
          <PieChart width={200} height={200}>
            <Pie data={bookingSource} cx={95} cy={95} innerRadius={55} outerRadius={90} dataKey="value">
              {bookingSource.map((_,i) => <Cell key={i} fill={COLORS[i]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
          <div className="space-y-3">
            {bookingSource.map((s,i) => (
              <div key={i} className="flex items-center gap-3"><div className="w-3 h-3 rounded-full" style={{background:COLORS[i]}}/><span className="text-sm font-medium text-dark">{s.name}</span><span className="text-sm text-gray-500">{s.value} ({Math.round(s.value/312*100)}%)</span></div>
            ))}
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
    api.get('/customers').then(r => setData(r.data.data || [])).catch(() => setData([
      { name:'John Banda', phone:'+265 999 001 234', vehicle_count:1, total_services:4, last_visit:'2024-03-20' },
      { name:'Grace Phiri', phone:'+265 888 002 345', vehicle_count:1, total_services:2, last_visit:'2024-03-22' },
      { name:'Daniel Chirwa', phone:'+265 997 003 456', vehicle_count:1, total_services:1, last_visit:'2024-03-22' },
    ]))
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
            <Route path="vehicles" element={<div><h1 className="font-display text-2xl text-dark mb-4">Vehicles</h1><p className="text-gray-500">Vehicle management coming soon.</p></div>} />
            <Route path="customers" element={<CustomersView />} />
            <Route path="reports" element={<AnalyticsView />} />
            <Route path="analytics" element={<AnalyticsView />} />
            <Route path="settings" element={<SettingsView />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
