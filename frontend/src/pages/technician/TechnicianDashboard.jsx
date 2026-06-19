import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import {
  List, CheckCheck, StickyNote, Camera, LogOut,
  Edit2, X, Save, ClipboardCheck
} from 'lucide-react'
import InspectionModule from './InspectionModule'

const NAV = [
  { id: 'jobs',        icon: List,           label: 'My Jobs' },
  { id: 'completed',   icon: CheckCheck,     label: 'Completed' },
  { id: 'inspection',  icon: ClipboardCheck, label: 'Vehicle Inspection' },
  { id: 'notes',       icon: StickyNote,     label: 'Repair Notes' },
  { id: 'photos',      icon: Camera,         label: 'Upload Photos' },
]

export default function TechnicianDashboard() {
  const { user, logout } = useAuth()
  const [section, setSection] = useState('jobs')
  const [jobs, setJobs] = useState([])
  const [updateModal, setUpdateModal] = useState(null)
  const [updateForm, setUpdateForm] = useState({ status: '', notes: '', progress: 0 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/job-cards/my')
      .then(r => setJobs(r.data.data || []))
      .catch(() => setJobs([]))
  }, [])

  const active = jobs.filter(j => j.status !== 'completed')
  const done   = jobs.filter(j => j.status === 'completed')

  const saveUpdate = async () => {
    if (!updateModal) return
    setSaving(true)
    try {
      await api.patch(`/job-cards/${updateModal.id}/progress`, {
        progress: updateForm.progress, status: updateForm.status, technician_notes: updateForm.notes
      })
      setJobs(jobs.map(j => j.id === updateModal.id ? { ...j, ...updateForm } : j))
      setUpdateModal(null)
    } catch { } finally { setSaving(false) }
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8]">

      {/* TOPBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-gray-100 shadow-sm flex items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#B8860B] rounded-lg flex items-center justify-center text-white font-black text-xs">AM</div>
          <span className="font-black text-[#1A1A2E] text-lg">AutoMedic</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="bg-green-50 text-green-600 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-green-100">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> On Duty
          </span>
          <button onClick={logout} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#B8860B] transition-colors font-medium">
            <LogOut size={14} /> Exit
          </button>
          <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm select-none">
            {user?.name?.charAt(0)}{user?.name?.split(' ')[1]?.charAt(0) || ''}
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* SIDEBAR */}
        <aside className="w-[220px] fixed top-16 left-0 bottom-0 bg-white border-r border-gray-100 flex flex-col py-5 z-40">
          <nav className="flex flex-col gap-0.5 px-3 flex-1">
            {NAV.map(({ id, icon: Icon, label }) => (
              <button key={id} onClick={() => setSection(id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left w-full transition-all
                  ${section === id ? 'bg-[#B8860B]/10 text-[#B8860B] font-semibold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}>
                <Icon size={16} />{label}
              </button>
            ))}
          </nav>
          <div className="px-3 pt-3 border-t border-gray-100">
            <button onClick={logout}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all w-full">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main className="ml-[220px] flex-1 p-7">

          {/* ══ MY JOBS ══════════════════════════════════════ */}
          {section === 'jobs' && (
            <div>
              <div className="mb-6">
                <h1 className="font-display text-2xl text-[#1A1A2E]">Technician Dashboard</h1>
                <p className="text-gray-400 text-sm">Welcome back, {user?.name} — <strong className="text-[#1A1A2E]">{active.length} active jobs today</strong></p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mb-7">
                {[
                  ['🔧', active.length,  'Active Jobs',      'bg-orange-50 text-orange-600'],
                  ['✅', done.length,    'Completed Today',  'bg-green-50 text-green-600'],
                  ['⏰', 2,             'Pending Review',   'bg-blue-50 text-blue-600'],
                  ['⭐', '4.9',         'Rating',           'bg-purple-50 text-purple-600'],
                ].map(([icon, val, label, cls], i) => (
                  <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 flex items-center gap-3">
                    <div className={`w-12 h-12 ${cls} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>{icon}</div>
                    <div>
                      <div className="text-2xl font-black text-[#1A1A2E] leading-none">{val}</div>
                      <div className="text-xs text-gray-400 mt-1">{label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Job Cards */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
                <h2 className="font-bold text-[#1A1A2E] mb-5">Assigned Jobs</h2>
                {active.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 text-3xl">🔧</div>
                    <h3 className="font-bold text-[#1A1A2E] text-base mb-1">No jobs assigned yet.</h3>
                    <p className="text-sm text-gray-400">New job cards assigned by the admin will appear here.</p>
                  </div>
                ) : (
                <div className="grid md:grid-cols-3 gap-5">
                  {active.map(job => (
                    <div key={job.id}
                      className={`rounded-2xl overflow-hidden border-[1.5px] transition-all hover:shadow-md
                        ${job.status === 'in_progress' ? 'border-[#B8860B]/40 bg-[#B8860B]/3' : 'border-gray-100 bg-gray-50/50'}`}>
                      <div className="flex justify-between items-center p-3.5 pb-0">
                        <span className="text-xs font-bold text-gray-400">{job.tracking_number}</span>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize
                          ${job.status === 'in_progress' ? 'bg-orange-50 text-orange-500 border border-orange-100' : 'bg-blue-50 text-blue-500 border border-blue-100'}`}>
                          {job.status === 'in_progress' ? 'In Progress' : 'Pending'}
                        </span>
                      </div>
                      {/* Car image placeholder */}
                      <div className="mx-3.5 mt-3 h-32 bg-gradient-to-br from-[#1A1A2E] to-[#0F3460] rounded-xl flex items-center justify-center text-5xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(184,134,11,0.2),transparent_70%)]" />
                        <span className="relative z-10">🚗</span>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-[#1A1A2E]">{job.make} {job.model}</h3>
                        <div className="space-y-1 mt-2 mb-3">
                          <p className="text-xs text-gray-400 flex items-center gap-1.5">📋 {job.registration_number}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1.5">👤 {job.customer_name}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1.5">🔧 {job.service_name}</p>
                        </div>
                        {/* Progress */}
                        <div className="mb-3">
                          <div className="flex justify-between text-xs font-semibold mb-1.5">
                            <span className="text-gray-500">Progress</span>
                            <span className="text-[#B8860B]">{job.progress}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#B8860B] to-yellow-400 rounded-full transition-all"
                              style={{ width: `${job.progress}%` }} />
                          </div>
                          <input type="range" min={0} max={100} value={job.progress}
                            onChange={e => setJobs(jobs.map(j => j.id === job.id ? { ...j, progress: Number(e.target.value) } : j))}
                            className="w-full mt-2 accent-[#B8860B] cursor-pointer" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setUpdateModal(job); setUpdateForm({ status: job.status, notes: '', progress: job.progress }) }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#B8860B] text-white text-xs font-semibold rounded-lg hover:bg-[#8B6508] transition-colors">
                            <Edit2 size={11} /> Update
                          </button>
                          <button onClick={() => setSection('photos')}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:border-[#B8860B] hover:text-[#B8860B] transition-colors">
                            <Camera size={11} /> Photos
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            </div>
          )}

          {/* ══ COMPLETED ════════════════════════════════════ */}
          {section === 'completed' && (
            <div>
              <div className="mb-6">
                <h1 className="font-display text-2xl text-[#1A1A2E]">Completed Jobs</h1>
                <p className="text-gray-400 text-sm">Jobs finished today</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/80">
                      {['#','Vehicle','Owner','Service','Completed','Status'].map(h => (
                        <th key={h} className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {done.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">No completed jobs yet.</td></tr>
                    ) : done.map((j, i) => (
                      <tr key={j.id || i} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-[#B8860B] text-xs">{j.tracking_number}</td>
                        <td className="px-4 py-3.5 font-medium text-[#1A1A2E]">{j.make} {j.model} {j.registration_number}</td>
                        <td className="px-4 py-3.5 text-gray-500">{j.customer_name}</td>
                        <td className="px-4 py-3.5 text-gray-500">{j.service_name}</td>
                        <td className="px-4 py-3.5 text-gray-400 text-xs">{j.preferred_date || '—'}</td>
                        <td className="px-4 py-3.5">
                          <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-green-100">Done</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ VEHICLE INSPECTION ═══════════════════════════ */}
          {section === 'inspection' && (
            <InspectionModule jobs={active} />
          )}

          {/* ══ REPAIR NOTES ═════════════════════════════════ */}
          {section === 'notes' && (
            <div>
              <div className="mb-6">
                <h1 className="font-display text-2xl text-[#1A1A2E]">Repair Notes</h1>
                <p className="text-gray-400 text-sm">Add technical notes for active jobs</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Select Job</label>
                    <select className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] bg-white">
                      {active.map(j => <option key={j.id}>{j.tracking_number} — {j.make} {j.model}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Repair Notes</label>
                    <textarea rows={8} placeholder="Describe what was done, parts used, observations..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Parts Used</label>
                      <input placeholder="e.g. Gates Timing Belt Kit, Engine Oil 5W-30"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Labour Hours</label>
                      <input type="number" placeholder="e.g. 3.5"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Estimated Cost (MK)</label>
                      <input type="number" placeholder="e.g. 45000"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B]" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Next Action</label>
                      <select className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] bg-white">
                        {['Continue Repair','Order Parts','Quality Check','Ready for Collection'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button className="flex items-center gap-2 px-6 py-3 bg-[#B8860B] text-white font-semibold rounded-full hover:bg-[#8B6508] transition-colors text-sm">
                      <Save size={14} /> Save Notes
                    </button>
                    <button className="px-6 py-3 border border-gray-200 text-gray-600 font-semibold rounded-full hover:bg-gray-50 transition-colors text-sm">
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ UPLOAD PHOTOS ════════════════════════════════ */}
          {section === 'photos' && (
            <div>
              <div className="mb-6">
                <h1 className="font-display text-2xl text-[#1A1A2E]">Upload Photos</h1>
                <p className="text-gray-400 text-sm">Document repair progress with photos for the customer</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
                <div className="grid grid-cols-2 gap-5 mb-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Select Job</label>
                    <select className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] bg-white">
                      {active.map(j => <option key={j.id}>{j.tracking_number} — {j.make} {j.model}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Photo Type</label>
                    <select className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] bg-white">
                      {['Before Repair','During Repair','After Repair','Parts Used','Damage Evidence','Dashboard/Odometer'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center cursor-pointer hover:border-[#B8860B] hover:bg-[#B8860B]/3 transition-all group mb-6"
                  onClick={() => document.getElementById('techPhotoInput').click()}>
                  <Camera size={40} className="text-gray-300 mx-auto mb-3 group-hover:text-[#B8860B] transition-colors" />
                  <p className="font-semibold text-gray-500 group-hover:text-[#B8860B] transition-colors">Click to browse or drag &amp; drop photos here</p>
                  <p className="text-xs text-gray-400 mt-1">Supports JPG, PNG — up to 10MB per photo</p>
                  <input type="file" id="techPhotoInput" accept="image/*" multiple className="hidden"
                    onChange={e => {
                      const grid = document.getElementById('techPreviews')
                      Array.from(e.target.files).forEach(f => {
                        const r = new FileReader()
                        r.onload = ev => {
                          const d = document.createElement('div')
                          d.className = 'relative'
                          d.innerHTML = `<img src="${ev.target.result}" class="w-24 h-20 object-cover rounded-xl border-2 border-gray-100" />`
                          grid.appendChild(d)
                        }
                        r.readAsDataURL(f)
                      })
                    }} />
                </div>
                <div id="techPreviews" className="flex flex-wrap gap-3 mb-6" />
                <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-6 py-3 bg-[#B8860B] text-white font-semibold rounded-full hover:bg-[#8B6508] transition-colors text-sm">
                    <Camera size={14} /> Upload Photos
                  </button>
                  <button className="px-6 py-3 border border-gray-200 text-gray-600 font-semibold rounded-full hover:bg-gray-50 transition-colors text-sm">
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* UPDATE STATUS MODAL */}
      {updateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setUpdateModal(null)}>
          <div className="bg-white rounded-2xl p-7 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-[#1A1A2E] text-lg">Update Repair Status</h3>
              <button onClick={() => setUpdateModal(null)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                <X size={14} />
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-5">{updateModal.tracking_number} — {updateModal.make} {updateModal.model}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
                <select value={updateForm.status} onChange={e => setUpdateForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] bg-white">
                  {['pending','diagnosis','parts_ordered','in_progress','quality_check','ready','completed'].map(s => (
                    <option key={s} value={s}>{s.replace(/_/g,' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Progress: {updateForm.progress}%</label>
                <input type="range" min={0} max={100} value={updateForm.progress}
                  onChange={e => setUpdateForm(f => ({ ...f, progress: Number(e.target.value) }))}
                  className="w-full accent-[#B8860B]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notes</label>
                <textarea rows={3} value={updateForm.notes} onChange={e => setUpdateForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Describe what was done..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] resize-none" />
              </div>
              <button onClick={saveUpdate} disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#B8860B] text-white font-semibold rounded-full hover:bg-[#8B6508] transition-colors disabled:opacity-60 text-sm">
                <Save size={14} /> {saving ? 'Saving...' : 'Save Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


