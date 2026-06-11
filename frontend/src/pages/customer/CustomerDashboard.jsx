import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { Home, Settings, History, FileText, Bell, Calendar, LogOut, Car, CheckCircle, Clock, CreditCard, Satellite, MessageCircle, ChevronRight, ClipboardCheck } from 'lucide-react'

const Sidebar = ({ active, onChange, unreadNotifs, pendingInspection }) => {
  const { logout } = useAuth()
  const items = [
    { id:'overview', icon:Home, label:'Overview' },
    { id:'repairs', icon:Settings, label:'My Repairs' },
    { id:'inspection', icon:ClipboardCheck, label:'Inspection Sign-Off', badge: pendingInspection ? '1' : null, badgeColor:'bg-orange-500' },
    { id:'history', icon:History, label:'Service History' },
    { id:'invoices', icon:FileText, label:'Invoices' },
    { id:'notifications', icon:Bell, label:'Notifications', badge: unreadNotifs || null },
  ]
  return (
    <aside className="w-[220px] min-h-[calc(100vh-64px)] bg-white border-r border-gray-100 fixed top-16 left-0 bottom-0 flex flex-col py-5">
      <nav className="flex flex-col gap-0.5 px-3 flex-1">
        {items.map(({ id, icon:Icon, label, badge, badgeColor }) => (
          <button key={id} onClick={() => onChange(id)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-colors w-full relative ${active===id ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}>
            <Icon size={16} />
            {label}
            {badge && <span className={`ml-auto text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${badgeColor || 'bg-red-500'}`}>{badge}</span>}
          </button>
        ))}
        <Link to="/booking" className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
          <Calendar size={16} /> Book Service
        </Link>
      </nav>
      <div className="px-3 pt-3 border-t border-gray-100">
        <button onClick={logout} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors w-full">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  )
}

const StatCard = ({ icon:Icon, val, label, bg, color }) => (
  <div className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm">
    <div className={`w-12 h-12 ${bg} ${color} rounded-xl flex items-center justify-center flex-shrink-0`}><Icon size={20} /></div>
    <div><div className="text-2xl font-black text-dark leading-none">{val}</div><div className="text-xs text-gray-500 mt-1">{label}</div></div>
  </div>
)

export default function CustomerDashboard() {
  const { user } = useAuth()
  const [section, setSection] = useState('overview')
  const [appointments, setAppointments] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/appointments/my'),
      api.get('/notifications')
    ]).then(([a, n]) => {
      setAppointments(a.data.data)
      setNotifications(n.data.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const current = appointments.find(a => a.status === 'in_progress') || appointments[0]
  const unread = notifications.filter(n => !n.is_read).length
  const pendingInspection = true // Would come from API

  const showInvoice = (ref) => {
    // Reuse invoice logic
    alert(`Invoice for ${ref} — Invoice module`)
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {/* Topbar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-gray-100 shadow-sm flex items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-white font-black text-xs">AM</div>
          <span className="font-black text-dark">AutoMedic</span>
        </Link>
        <div className="flex items-center gap-3">
          {current && <span className="bg-orange-50 text-orange-600 text-xs font-bold px-3 py-1 rounded-full">Active Repair</span>}
          <Link to="/" className="text-sm text-gray-500 hover:text-primary transition-colors">← Back to Site</Link>
          <Link to="/track" className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-full hover:bg-primary-dark transition-colors">
            <Satellite size={13} /> Track Vehicle
          </Link>
          <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer">
            {user?.name?.charAt(0)}{user?.name?.split(' ')[1]?.charAt(0)}
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        <Sidebar active={section} onChange={setSection} unreadNotifs={unread} pendingInspection={pendingInspection} />

        <main className="ml-[220px] flex-1 p-7">

          {/* OVERVIEW */}
          {section === 'overview' && (
            <div>
              <div className="flex justify-between items-center mb-7">
                <div><h1 className="font-display text-2xl text-dark">Welcome back, {user?.name} 👋</h1><p className="text-gray-500 text-sm">Here's your vehicle service overview</p></div>
                <Link to="/booking" className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-full hover:bg-primary-dark transition-colors">+ New Booking</Link>
              </div>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <StatCard icon={Car} val={appointments.length} label="Total Services" bg="bg-blue-50" color="text-blue-600" />
                <StatCard icon={CheckCircle} val={appointments.filter(a=>a.status==='completed').length} label="Completed" bg="bg-green-50" color="text-green-600" />
                <StatCard icon={Clock} val={appointments.filter(a=>a.status==='in_progress').length} label="In Progress" bg="bg-orange-50" color="text-orange-600" />
                <StatCard icon={CreditCard} val="MK 142K" label="Total Spent" bg="bg-pink-50" color="text-pink-600" />
              </div>
              {/* Quick cards */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id:'repairs', icon:Settings, bg:'bg-orange-50', color:'text-orange-600', title:'Current Repair', desc:'Toyota Corolla — Engine Repair', badge:'65%', badgeCls:'bg-orange-100 text-orange-600' },
                  { id:'inspection', icon:ClipboardCheck, bg:'bg-orange-50', color:'text-orange-600', title:'Inspection Sign-Off', desc:'⚠ Awaiting your signature', style:{borderColor:'#FFB74D', background:'#FFFBF0'} },
                  { id:'history', icon:History, bg:'bg-green-50', color:'text-green-600', title:'Service History', desc:`${appointments.length} services` },
                  { id:'invoices', icon:FileText, bg:'bg-purple-50', color:'text-purple-600', title:'Invoices', desc:`${appointments.length} invoices available` },
                ].map(({ id, icon:Icon, bg, color, title, desc, badge, badgeCls, style }) => (
                  <button key={id} onClick={() => setSection(id)} style={style}
                    className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left border-[1.5px] border-transparent w-full">
                    <div className={`w-11 h-11 ${bg} ${color} rounded-xl flex items-center justify-center flex-shrink-0`}><Icon size={18} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-dark text-sm">{title}</p>
                      <p className="text-xs text-gray-500 truncate">{desc} {badge && <span className={`${badgeCls} font-bold px-1.5 py-0.5 rounded-full ml-1`}>{badge}</span>}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* MY REPAIRS */}
          {section === 'repairs' && current && (
            <div>
              <div className="mb-6"><h1 className="font-display text-2xl text-dark">My Repairs</h1></div>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="font-bold text-dark">Current Repair — {current.make} {current.model} ({current.registration_number})</h2>
                  <span className="bg-orange-50 text-orange-600 text-xs font-bold px-3 py-1 rounded-full capitalize">{current.status}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-5">
                  {[['Tracking #', current.tracking_number], ['Service', current.service_name], ['Date', current.preferred_date]].map(([k,v],i) => (
                    <div key={i}><label className="block text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">{k}</label><span className="font-semibold text-dark text-sm">{v || '—'}</span></div>
                  ))}
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-sm font-semibold mb-2"><span>Repair Progress</span><span>65%</span></div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full w-[65%] bg-gradient-to-r from-primary to-yellow-500 rounded-full" /></div>
                </div>
                <div className="flex gap-3">
                  <Link to={`/track/${current.tracking_number}`} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-full hover:bg-primary-dark transition-colors">
                    <Satellite size={14} /> Full Tracking
                  </Link>
                  <a href="https://wa.me/265999000000" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white text-sm font-semibold rounded-full hover:bg-green-600 transition-colors">
                    <MessageCircle size={14} /> WhatsApp Update
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* INSPECTION SIGN-OFF */}
          {section === 'inspection' && (
            <div>
              <div className="mb-6"><h1 className="font-display text-2xl text-dark">Inspection Sign-Off</h1><p className="text-gray-500 text-sm">Review and confirm your vehicle inspection report</p></div>
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-6 flex gap-4">
                <ClipboardCheck size={24} className="text-orange-500 flex-shrink-0 mt-0.5" />
                <div><p className="font-bold text-orange-600 mb-1">Action Required — Please Review & Sign</p><p className="text-sm text-gray-600">AutoMedic has completed a vehicle inspection. Please review and confirm by signing digitally.</p></div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="font-bold text-dark flex items-center gap-2"><FileText size={16} className="text-primary" /> Inspection Report — INS-2847</h2>
                  <span className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full">Awaiting Signature</span>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6 pb-6 border-b border-gray-100">
                  {[['Reference','INS-2847'],['Customer',user?.name],['Vehicle','2018 Toyota Corolla'],['Registration','MK 1234'],['Mileage at Arrival','87,542 km'],['Fuel Level','1/2'],['Service','Engine Repair'],['Date Received','20 Mar 2024']].map(([k,v],i) => (
                    <div key={i} className="flex justify-between py-1.5 text-sm border-b border-gray-50"><span className="text-gray-500">{k}</span><span className="font-semibold text-dark">{v}</span></div>
                  ))}
                </div>
                <p className="text-sm font-bold text-gray-700 mb-3">Damage Recorded:</p>
                <div className="space-y-2 mb-6">
                  <p className="text-sm text-red-500 flex items-center gap-2">✗ Scratch on Left Side Door — <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">Minor</span></p>
                  <p className="text-sm text-green-600 flex items-center gap-2">✓ No windshield damage</p>
                  <p className="text-sm text-green-600 flex items-center gap-2">✓ All lights functional</p>
                </div>
                <p className="text-sm font-bold text-gray-700 mb-3">Signature:</p>
                <div className="border-2 border-gray-200 rounded-xl bg-gray-50 h-32 flex items-center justify-center mb-4 cursor-crosshair" id="custSigArea">
                  <p className="text-gray-400 text-sm">Sign here with your finger or mouse</p>
                </div>
                <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-full hover:bg-primary-dark transition-colors">
                    <CheckCircle size={16} /> Confirm & Sign Inspection
                  </button>
                  <a href="https://wa.me/265999000000" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-5 py-3 bg-green-500 text-white font-semibold rounded-full hover:bg-green-600 transition-colors text-sm">
                    <MessageCircle size={14} /> Ask a Question
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* SERVICE HISTORY */}
          {section === 'history' && (
            <div>
              <div className="mb-6"><h1 className="font-display text-2xl text-dark">Service History</h1></div>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50">{['#','Vehicle','Service','Date','Cost','Status','Invoice'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">{h}</th>)}</tr></thead>
                  <tbody>
                    {appointments.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No service history yet</td></tr>
                    ) : appointments.map(a => (
                      <tr key={a.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-primary">{a.tracking_number}</td>
                        <td className="px-4 py-3">{a.make} {a.model} {a.registration_number}</td>
                        <td className="px-4 py-3">{a.service_name}</td>
                        <td className="px-4 py-3 text-gray-500">{a.preferred_date}</td>
                        <td className="px-4 py-3 font-semibold">MK —</td>
                        <td className="px-4 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${a.status==='completed'?'bg-green-50 text-green-600':'bg-orange-50 text-orange-600'}`}>{a.status}</span></td>
                        <td className="px-4 py-3"><button onClick={()=>showInvoice(a.tracking_number)} className="text-xs font-semibold text-primary border border-primary/30 px-2.5 py-1 rounded-lg hover:bg-primary/5 transition-colors">View</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* INVOICES */}
          {section === 'invoices' && (
            <div>
              <div className="mb-6"><h1 className="font-display text-2xl text-dark">Invoices</h1></div>
              <div className="grid grid-cols-2 gap-5">
                {appointments.map(a => (
                  <div key={a.id} className="bg-white rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2"><span className="font-bold text-dark">#{a.tracking_number}</span><span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${a.status==='completed'?'bg-green-50 text-green-600':'bg-orange-50 text-orange-600'}`}>{a.status}</span></div>
                      <span className="font-black text-primary">MK —</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">{a.service_name} — {a.make} {a.model}</p>
                    <p className="text-xs text-gray-400 mb-4">📅 {a.preferred_date}</p>
                    <button onClick={()=>showInvoice(a.tracking_number)} className="w-full py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors flex items-center justify-center gap-2">
                      <FileText size={14} /> View Invoice
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {section === 'notifications' && (
            <div>
              <div className="mb-6"><h1 className="font-display text-2xl text-dark">Notifications</h1></div>
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm">No notifications yet</div>
                ) : notifications.map(n => (
                  <div key={n.id} className={`flex items-start gap-4 p-5 rounded-2xl border-[1.5px] transition-colors ${!n.is_read ? 'bg-orange-50/50 border-orange-100' : 'bg-white border-gray-100'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${!n.is_read ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'}`}>
                      <Bell size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-dark text-sm">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
