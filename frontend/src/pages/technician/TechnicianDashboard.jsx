import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { List, CheckCheck, StickyNote, Camera, LogOut, Edit2, X, Save, MessageCircle } from 'lucide-react'

const navItems = [
  { id:'jobs', icon:List, label:'My Jobs' },
  { id:'completed', icon:CheckCheck, label:'Completed' },
  { id:'notes', icon:StickyNote, label:'Repair Notes' },
  { id:'photos', icon:Camera, label:'Upload Photos' },
]

export default function TechnicianDashboard() {
  const { user, logout } = useAuth()
  const [section, setSection] = useState('jobs')
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [updateModal, setUpdateModal] = useState(null)
  const [updateForm, setUpdateForm] = useState({ status:'', notes:'', progress:0 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/job-cards/my')
      .then(r => setJobs(r.data.data))
      .catch(() => setJobs([
        { id:'1', tracking_number:'AC-2847', make:'Toyota', model:'Corolla', registration_number:'MK 1234', customer_name:'John Banda', service_name:'Engine Repair', progress:65, status:'in_progress' },
        { id:'2', tracking_number:'AC-2850', make:'Nissan', model:'Tiida', registration_number:'MK 4590', customer_name:'Grace Phiri', service_name:'Brake Repair', progress:20, status:'pending' },
        { id:'3', tracking_number:'AC-2851', make:'Honda', model:'CR-V', registration_number:'MK 7823', customer_name:'Daniel Chirwa', service_name:'Oil Change', progress:10, status:'pending' },
      ]))
      .finally(() => setLoading(false))
  }, [])

  const saveUpdate = async () => {
    if (!updateModal) return
    setSaving(true)
    try {
      await api.patch(`/job-cards/${updateModal.id}/progress`, {
        progress: updateForm.progress,
        status: updateForm.status,
        technician_notes: updateForm.notes
      })
      setJobs(jobs.map(j => j.id === updateModal.id ? { ...j, progress: updateForm.progress, status: updateForm.status } : j))
      setUpdateModal(null)
    } catch { } finally { setSaving(false) }
  }

  const active = jobs.filter(j => j.status !== 'completed')
  const done = jobs.filter(j => j.status === 'completed')

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-gray-100 shadow-sm flex items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-white font-black text-xs">AM</div>
          <span className="font-black text-dark">AutoMedic</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="bg-green-50 text-green-600 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> On Duty
          </span>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-primary transition-colors flex items-center gap-1">
            <LogOut size={14} /> Exit
          </button>
          <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.charAt(0)}{user?.name?.split(' ')[1]?.charAt(0)}
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        <aside className="w-[220px] min-h-[calc(100vh-64px)] bg-white border-r border-gray-100 fixed top-16 left-0 bottom-0 flex flex-col py-5">
          <nav className="flex flex-col gap-0.5 px-3 flex-1">
            {navItems.map(({ id, icon:Icon, label }) => (
              <button key={id} onClick={() => setSection(id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-colors w-full ${section===id ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}>
                <Icon size={16} />{label}
              </button>
            ))}
          </nav>
          <div className="px-3 pt-3 border-t border-gray-100">
            <button onClick={logout} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors w-full">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </aside>

        <main className="ml-[220px] flex-1 p-7">
          {section === 'jobs' && (
            <div>
              <div className="mb-6">
                <h1 className="font-display text-2xl text-dark">Technician Dashboard</h1>
                <p className="text-gray-500 text-sm">Welcome back, {user?.name} — <strong>{active.length} active jobs today</strong></p>
              </div>
              <div className="grid grid-cols-4 gap-4 mb-7">
                {[['🔧', active.length, 'Active Jobs','bg-orange-50 text-orange-600'],['✅', done.length,'Completed Today','bg-green-50 text-green-600'],['⏰', 2,'Pending Review','bg-blue-50 text-blue-600'],['⭐', '4.9','Rating','bg-purple-50 text-purple-600']].map(([icon,val,label,cls],i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-3">
                    <div className={`w-11 h-11 ${cls} rounded-xl flex items-center justify-center text-xl`}>{icon}</div>
                    <div><div className="text-xl font-black text-dark">{val}</div><div className="text-xs text-gray-500">{label}</div></div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h2 className="font-bold text-dark mb-5">Assigned Jobs</h2>
                <div className="grid md:grid-cols-3 gap-5">
                  {active.map(job => (
                    <div key={job.id} className={`rounded-2xl overflow-hidden border-2 transition-all ${job.status==='in_progress' ? 'border-primary bg-orange-50/30' : 'border-gray-100 bg-gray-50'}`}>
                      <div className="flex justify-between items-center p-3 pb-0">
                        <span className="text-xs font-bold text-gray-400">{job.tracking_number}</span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${job.status==='in_progress'?'bg-orange-50 text-orange-600':'bg-blue-50 text-blue-600'}`}>{job.status?.replace('_',' ')}</span>
                      </div>
                      <div className="h-28 mx-3 mt-3 bg-gradient-to-br from-dark to-dark-2 rounded-xl flex items-center justify-center text-4xl">🚗</div>
                      <div className="p-4">
                        <h3 className="font-bold text-dark">{job.make} {job.model}</h3>
                        <p className="text-xs text-gray-500 mt-1">📋 {job.registration_number}</p>
                        <p className="text-xs text-gray-500">👤 {job.customer_name}</p>
                        <p className="text-xs text-gray-500">🔧 {job.service_name}</p>
                        <div className="mt-3">
                          <div className="flex justify-between text-xs font-semibold mb-1"><span>Progress</span><span>{job.progress}%</span></div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-primary to-yellow-500 rounded-full transition-all" style={{width:`${job.progress}%`}} />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => { setUpdateModal(job); setUpdateForm({ status:job.status, notes:'', progress:job.progress }) }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-dark transition-colors">
                            <Edit2 size={12} /> Update
                          </button>
                          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:border-primary hover:text-primary transition-colors">
                            <Camera size={12} /> Photos
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {section === 'completed' && (
            <div>
              <div className="mb-6"><h1 className="font-display text-2xl text-dark">Completed Jobs</h1></div>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50">{['#','Vehicle','Owner','Service','Completed','Status'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">{h}</th>)}</tr></thead>
                  <tbody>
                    {done.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No completed jobs today</td></tr>
                    : done.map(j => (
                      <tr key={j.id} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-primary">{j.tracking_number}</td>
                        <td className="px-4 py-3">{j.make} {j.model}</td>
                        <td className="px-4 py-3">{j.customer_name}</td>
                        <td className="px-4 py-3">{j.service_name}</td>
                        <td className="px-4 py-3 text-gray-500">Today</td>
                        <td className="px-4 py-3"><span className="bg-green-50 text-green-600 text-xs font-bold px-2.5 py-1 rounded-full">Done</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {section === 'notes' && (
            <div>
              <div className="mb-6"><h1 className="font-display text-2xl text-dark">Repair Notes</h1></div>
              <div className="bg-white rounded-2xl p-6 shadow-sm max-w-lg">
                <div className="space-y-4">
                  <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Select Job</label>
                    <select className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-white">
                      {active.map(j => <option key={j.id}>{j.tracking_number} — {j.make} {j.model}</option>)}
                    </select></div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Repair Notes</label>
                    <textarea rows={5} placeholder="Describe what was done, parts used..." className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary resize-none" /></div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Parts Used</label>
                    <input placeholder="e.g. Gates Timing Belt Kit, Engine Oil 5W-30" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" /></div>
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-full hover:bg-primary-dark transition-colors text-sm">
                    <Save size={14} /> Save Notes
                  </button>
                </div>
              </div>
            </div>
          )}

          {section === 'photos' && (
            <div>
              <div className="mb-6"><h1 className="font-display text-2xl text-dark">Upload Photos</h1></div>
              <div className="bg-white rounded-2xl p-6 shadow-sm max-w-lg">
                <div className="space-y-4">
                  <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Select Job</label>
                    <select className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-white">
                      {active.map(j => <option key={j.id}>{j.tracking_number} — {j.make} {j.model}</option>)}
                    </select></div>
                  <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Photo Type</label>
                    <select className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-white">
                      {['Before Repair','During Repair','After Repair','Parts Used'].map(t => <option key={t}>{t}</option>)}
                    </select></div>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                    <Camera size={28} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Click to browse or drag photos here</p>
                    <input type="file" accept="image/*" multiple className="hidden" />
                  </div>
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-full hover:bg-primary-dark transition-colors text-sm">
                    <Camera size={14} /> Upload Photos
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Update Modal */}
      {updateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setUpdateModal(null)}>
          <div className="bg-white rounded-2xl p-7 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-dark text-lg">Update Repair Status</h3>
              <button onClick={() => setUpdateModal(null)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"><X size={14} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-5">{updateModal.tracking_number} — {updateModal.make} {updateModal.model}</p>
            <div className="space-y-4">
              <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                <select value={updateForm.status} onChange={e => setUpdateForm(f => ({...f, status:e.target.value}))} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-white">
                  {['pending','diagnosis','parts_ordered','in_progress','quality_check','ready','completed'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                </select></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Progress: {updateForm.progress}%</label>
                <input type="range" min={0} max={100} value={updateForm.progress} onChange={e=>setUpdateForm(f=>({...f,progress:Number(e.target.value)}))} className="w-full accent-primary" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
                <textarea rows={3} value={updateForm.notes} onChange={e=>setUpdateForm(f=>({...f,notes:e.target.value}))} placeholder="Describe what was done..." className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary resize-none" /></div>
              <button onClick={saveUpdate} disabled={saving} className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white font-semibold rounded-full hover:bg-primary-dark transition-colors disabled:opacity-60">
                <Save size={15} /> {saving ? 'Saving...' : 'Save Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
