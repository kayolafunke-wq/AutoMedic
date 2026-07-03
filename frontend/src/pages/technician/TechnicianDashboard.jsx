import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import {
  List, CheckCheck, StickyNote, Camera, LogOut,
  Edit2, X, Save, ClipboardCheck, CheckCircle, AlertCircle
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
  const [updateForm, setUpdateForm] = useState({ status: '', notes: '', progress: 0, final_cost: '' })
  const [saving, setSaving] = useState(false)
  const [updateError, setUpdateError] = useState({ jobId: null, type: '', message: '' })

  const handleUpdateClick = (job) => {
    const isPendingJob = job.status === 'pending'
    if (isPendingJob) {
      const isInspected = job.inspection_advisor_sig && ['pending', 'customer_signed', 'completed'].includes(job.inspection_status)
      const isCustomerSigned = job.inspection_status === 'customer_signed' || job.inspection_status === 'completed'

      if (!isInspected) {
        setUpdateError({
          jobId: job.id,
          type: 'no_inspection',
          message: '🚫 Complete vehicle inspection before starting repair work.'
        })
        setTimeout(() => setUpdateError(prev => prev.jobId === job.id ? { jobId: null, type: '', message: '' } : prev), 5000)
        return
      }

      if (!isCustomerSigned) {
        setUpdateError({
          jobId: job.id,
          type: 'no_signature',
          message: '⏳ Awaiting customer sign-off. Work cannot begin until customer confirms inspection.'
        })
        setTimeout(() => setUpdateError(prev => prev.jobId === job.id ? { jobId: null, type: '', message: '' } : prev), 5000)
        return
      }
    }
    setUpdateModal(job)
    setUpdateForm({ status: job.status, notes: '', progress: job.progress, final_cost: job.final_cost || '' })
  }

  const startWorking = async (job) => {
    try {
      const res = await api.patch(`/job-cards/${job.id}/progress`, {
        status: 'in_progress',
        progress: 5,
        technician_notes: 'Starting repair work after customer sign-off.'
      })
      const updatedJob = res.data.data
      setJobs(prevJobs => prevJobs.map(j => j.id === job.id ? { ...j, ...updatedJob } : j))
    } catch (err) {
      alert('Failed to start work: ' + (err.response?.data?.message || err.message))
    }
  }

  // Repair Notes state
  const [noteJob, setNoteJob]       = useState('')
  const [noteText, setNoteText]     = useState('')
  const [noteParts, setNoteParts]   = useState('')
  const [noteHours, setNoteHours]   = useState('')
  const [noteCost, setNoteCost]     = useState('')
  const [noteFinalCost, setNoteFinalCost] = useState('')
  const [noteAction, setNoteAction] = useState('Continue Repair')
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteToast, setNoteToast]   = useState('')

  // Photo upload state
  const [photoJob, setPhotoJob]       = useState('')
  const [photoType, setPhotoType]     = useState('during')
  const [photoFiles, setPhotoFiles]   = useState([])
  const [photoPreviews, setPhotoPreviews] = useState([])
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoToast, setPhotoToast]   = useState('')

  const showToast = (setter, msg) => { setter(msg); setTimeout(() => setter(''), 3500) }

  useEffect(() => {
    api.get('/job-cards/my')
      .then(r => {
        const data = r.data.data || []
        setJobs(data)
        if (data.length) {
          setNoteJob(data[0].id)
          setPhotoJob(data[0].id)
        }
      })
      .catch(() => setJobs([]))
  }, [])

  const active = jobs.filter(j => j.status !== 'completed')
  const done   = jobs.filter(j => j.status === 'completed')

  const saveUpdate = async () => {
    if (!updateModal) return
    setSaving(true)
    try {
      const payload = {
        progress: updateForm.progress,
        status: updateForm.status,
        technician_notes: updateForm.notes,
      }
      if (updateForm.final_cost !== '' && updateForm.final_cost != null) {
        payload.final_cost = Number(updateForm.final_cost)
      }
      await api.patch(`/job-cards/${updateModal.id}/progress`, payload)
      setJobs(jobs.map(j => j.id === updateModal.id ? { ...j, ...updateForm } : j))
      setUpdateModal(null)
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update'
      alert(msg)
    } finally { setSaving(false) }
  }

  // Save repair notes → PATCH /job-cards/:id/progress with notes + cost + parts_used
  const saveNotes = async () => {
    if (!noteJob) return
    setNoteSaving(true)
    try {
      // Serialise parts_used as a proper array
      const partsArray = noteParts
        ? noteParts.split(',').map(p => p.trim()).filter(Boolean)
        : undefined

      const payload = {
        technician_notes: noteText,
        estimated_cost:   noteCost ? Number(noteCost) : undefined,
      }
      if (partsArray !== undefined) payload.parts_used = partsArray
      if (noteFinalCost) payload.final_cost = Number(noteFinalCost)

      await api.patch(`/job-cards/${noteJob}/progress`, payload)
      setJobs(jobs.map(j => j.id === noteJob
        ? { ...j, technician_notes: noteText, estimated_cost: noteCost ? Number(noteCost) : j.estimated_cost }
        : j
      ))
      showToast(setNoteToast, '✓ Repair notes saved successfully')
      setNoteText(''); setNoteParts(''); setNoteHours(''); setNoteCost(''); setNoteFinalCost('')
    } catch (err) {
      showToast(setNoteToast, '✕ Failed to save notes: ' + (err.response?.data?.message || err.message))
    } finally { setNoteSaving(false) }
  }

  // Handle photo file selection
  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files)
    setPhotoFiles(prev => [...prev, ...files])
    files.forEach(f => {
      const r = new FileReader()
      r.onload = ev => setPhotoPreviews(prev => [...prev, { url: ev.target.result, name: f.name }])
      r.readAsDataURL(f)
    })
  }

  // Upload photos to the backend - use repair-photos route for job photos
  const uploadPhotos = async () => {
    if (!photoFiles.length || !photoJob) return
    setPhotoUploading(true)
    try {
      const formData = new FormData()
      photoFiles.forEach(f => formData.append('photos', f))
      formData.append('photo_type', photoType)

      await api.post(`/upload/repair/${photoJob}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      showToast(setPhotoToast, `✓ ${photoFiles.length} photo${photoFiles.length > 1 ? 's' : ''} uploaded successfully`)
      setPhotoFiles([])
      setPhotoPreviews([])
    } catch (err) {
      showToast(setPhotoToast, '✕ Upload failed: ' + (err.response?.data?.message || err.message))
    } finally { setPhotoUploading(false) }
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
                        {/* Status checks */}
                        {(() => {
                          const isInspected = job.inspection_advisor_sig && ['pending', 'customer_signed', 'completed'].includes(job.inspection_status)
                          const isCustomerSigned = job.inspection_status === 'customer_signed' || job.inspection_status === 'completed'
                          const isPendingJob = job.status === 'pending'

                          return (
                            <div className="space-y-2">
                              <div className="flex gap-2">
                                {isPendingJob && isCustomerSigned ? (
                                  <button onClick={() => startWorking(job)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white text-xs font-bold rounded-lg hover:from-green-700 hover:to-green-600 transition-all shadow-md shadow-green-100">
                                    <CheckCircle size={11} /> Start Working
                                  </button>
                                ) : (
                                  <button onClick={() => handleUpdateClick(job)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                                      isPendingJob && (!isInspected || !isCustomerSigned)
                                        ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed hover:bg-gray-200'
                                        : 'bg-[#B8860B] text-white hover:bg-[#8B6508]'
                                    }`}>
                                    <Edit2 size={11} /> Update
                                  </button>
                                )}
                                <button onClick={() => setSection('inspection')}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:border-[#B8860B] hover:text-[#B8860B] transition-colors">
                                  <ClipboardCheck size={11} /> Inspect
                                </button>
                              </div>

                              {/* Interactive Help Messages */}
                              {updateError.jobId === job.id && (
                                <div className={`flex items-start gap-2 border rounded-xl p-3 mt-2 select-none relative ${
                                  updateError.type === 'no_inspection'
                                    ? 'bg-red-50 border-red-200 text-red-800'
                                    : 'bg-amber-50 border-amber-200 text-amber-800'
                                }`}>
                                  <span className="text-xs">{updateError.type === 'no_inspection' ? '🚫' : '⏳'}</span>
                                  <div className="flex-1 pr-4">
                                    <p className="text-[11px] font-bold leading-normal">{updateError.message}</p>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setUpdateError({ jobId: null, type: '', message: '' });
                                    }}
                                    className="absolute top-2.5 right-2.5 text-gray-400 hover:text-gray-500 transition-colors"
                                  >
                                    <X size={11} />
                                  </button>
                                </div>
                              )}
                              {isPendingJob && isInspected && !isCustomerSigned && (
                                <p className="text-[10px] text-amber-600 mt-2 text-center font-semibold animate-pulse">
                                  ⏳ Inspection submitted. Awaiting customer sign-off.
                                </p>
                              )}
                              {isPendingJob && isCustomerSigned && (
                                <p className="text-[10px] text-green-600 mt-2 text-center font-bold">
                                  ✨ Customer signed off! Click "Start Working" to begin repairs.
                                </p>
                              )}
                            </div>
                          )
                        })()}
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
                <p className="text-gray-400 text-sm">Full history of all jobs you have completed</p>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  ['✅', done.length, 'Total Completed', 'bg-green-50 text-green-600'],
                  ['💰', `MK ${done.reduce((s,j) => s + Number(j.final_cost || j.estimated_cost || 0), 0).toLocaleString()}`, 'Total Revenue', 'bg-[#B8860B]/10 text-[#B8860B]'],
                  ['📅', done.filter(j => {
                    const d = j.completed_at || j.updated_at
                    return d && new Date(d).toDateString() === new Date().toDateString()
                  }).length, 'Completed Today', 'bg-blue-50 text-blue-600'],
                ].map(([icon, val, label, cls], i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 flex items-center gap-3">
                    <div className={`w-10 h-10 ${cls} rounded-xl flex items-center justify-center text-lg flex-shrink-0`}>{icon}</div>
                    <div>
                      <div className="text-lg font-black text-[#1A1A2E] leading-none">{val}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/80">
                      {['Tracking #', 'Vehicle', 'Owner', 'Service', 'Date Completed', 'Final Cost', 'Status'].map(h => (
                        <th key={h} className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {done.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-16 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-2xl">✅</div>
                            <p className="font-semibold text-gray-500 text-sm">No completed jobs yet</p>
                            <p className="text-xs text-gray-400">Jobs you complete will appear here permanently</p>
                          </div>
                        </td>
                      </tr>
                    ) : done.map((j, i) => {
                      const completedDate = j.completed_at || j.updated_at
                      const cost = j.final_cost || j.estimated_cost
                      return (
                        <tr key={j.id || i} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3.5 font-bold text-[#B8860B] text-xs">{j.tracking_number}</td>
                          <td className="px-4 py-3.5">
                            <p className="font-medium text-[#1A1A2E]">{j.make} {j.model}</p>
                            <p className="text-xs text-gray-400">{j.registration_number}</p>
                          </td>
                          <td className="px-4 py-3.5 text-gray-500 text-sm">{j.customer_name}</td>
                          <td className="px-4 py-3.5 text-gray-500 text-xs">{j.service_name || '—'}</td>
                          <td className="px-4 py-3.5 text-gray-400 text-xs">
                            {completedDate
                              ? new Date(completedDate).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })
                              : j.preferred_date || '—'}
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-[#B8860B] text-sm">
                            {cost ? `MK ${Number(cost).toLocaleString()}` : '—'}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-green-100">
                              Completed
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  {done.length > 0 && (
                    <tfoot>
                      <tr className="bg-[#1A1A2E]">
                        <td colSpan={5} className="px-4 py-3 text-white/50 text-xs font-semibold">{done.length} completed job{done.length !== 1 ? 's' : ''}</td>
                        <td className="px-4 py-3 font-black text-[#B8860B]">
                          MK {done.reduce((s,j) => s + Number(j.final_cost || j.estimated_cost || 0), 0).toLocaleString()}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
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
              {noteToast && (
                <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl
                  ${noteToast.startsWith('✓') ? 'bg-[#1A1A2E] text-white' : 'bg-red-500 text-white'}`}>
                  {noteToast}
                </div>
              )}
              <div className="mb-6">
                <h1 className="font-display text-2xl text-[#1A1A2E]">Repair Notes</h1>
                <p className="text-gray-400 text-sm">Add technical notes for active jobs</p>
              </div>

              {(() => {
                const selectedJob = jobs.find(j => j.id === noteJob)
                const isInspected = selectedJob?.inspection_advisor_sig && ['pending', 'customer_signed', 'completed'].includes(selectedJob?.inspection_status)
                const isCustomerSigned = selectedJob?.inspection_status === 'customer_signed' || selectedJob?.inspection_status === 'completed'
                const isPendingJob = selectedJob?.status === 'pending'

                return (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
                    {/* Error / Warning Alert Banners */}
                    {isPendingJob && !isInspected && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex items-start gap-3 text-red-700">
                        <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-sm">Vehicle Inspection Required</h4>
                          <p className="text-xs mt-1">This vehicle has not been inspected yet. Please complete the vehicle inspection first.</p>
                        </div>
                      </div>
                    )}
                    {isPendingJob && isInspected && !isCustomerSigned && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3 text-amber-700">
                        <AlertCircle size={18} className="flex-shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <h4 className="font-bold text-sm">Awaiting Customer Sign-off</h4>
                          <p className="text-xs mt-1">Vehicle inspection is submitted, but customer signature is pending. Repair notes cannot be added yet.</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Select Job</label>
                        <select value={noteJob} onChange={e => setNoteJob(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] bg-white">
                          {active.length === 0
                            ? <option value="">No active jobs</option>
                            : active.map(j => <option key={j.id} value={j.id}>{j.tracking_number} — {j.make} {j.model}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Repair Notes</label>
                        <textarea rows={8} value={noteText} onChange={e => setNoteText(e.target.value)}
                          disabled={isPendingJob && (!isInspected || !isCustomerSigned)}
                          placeholder={isPendingJob && (!isInspected || !isCustomerSigned) ? "Cannot add notes — complete vehicle inspection and customer signature first." : "Describe what was done, parts used, observations..."}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] resize-none disabled:bg-gray-50 disabled:text-gray-400" />
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Parts Used</label>
                          <input value={noteParts} onChange={e => setNoteParts(e.target.value)}
                            disabled={isPendingJob && (!isInspected || !isCustomerSigned)}
                            placeholder="e.g. Gates Timing Belt Kit, Engine Oil 5W-30"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] disabled:bg-gray-50 disabled:text-gray-400" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Labour Hours</label>
                          <input type="number" value={noteHours} onChange={e => setNoteHours(e.target.value)}
                            disabled={isPendingJob && (!isInspected || !isCustomerSigned)}
                            placeholder="e.g. 3.5"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] disabled:bg-gray-50 disabled:text-gray-400" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Estimated Cost (MK)</label>
                          <input type="number" value={noteCost} onChange={e => setNoteCost(e.target.value)}
                            disabled={isPendingJob && (!isInspected || !isCustomerSigned)}
                            placeholder="e.g. 45000"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] disabled:bg-gray-50 disabled:text-gray-400" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            Final Cost (MK) <span className="text-[#B8860B] font-bold">← set on completion</span>
                          </label>
                          <input type="number" value={noteFinalCost} onChange={e => setNoteFinalCost(e.target.value)}
                            disabled={isPendingJob && (!isInspected || !isCustomerSigned)}
                            placeholder="Actual total charged"
                            className="w-full px-4 py-3 border border-[#B8860B]/40 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] disabled:bg-gray-50 disabled:text-gray-400 bg-[#B8860B]/5" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Next Action</label>
                          <select value={noteAction} onChange={e => setNoteAction(e.target.value)}
                            disabled={isPendingJob && (!isInspected || !isCustomerSigned)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] bg-white disabled:bg-gray-50 disabled:text-gray-400">
                            {['Continue Repair','Order Parts','Quality Check','Ready for Collection'].map(t => <option key={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button onClick={saveNotes} disabled={noteSaving || !noteJob || (isPendingJob && (!isInspected || !isCustomerSigned))}
                          className="flex items-center gap-2 px-6 py-3 bg-[#B8860B] text-white font-semibold rounded-full hover:bg-[#8B6508] transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed">
                          <Save size={14} /> {noteSaving ? 'Saving...' : 'Save Notes'}
                        </button>
                        <button onClick={() => { setNoteText(''); setNoteParts(''); setNoteHours(''); setNoteCost('') }}
                          disabled={isPendingJob && (!isInspected || !isCustomerSigned)}
                          className="px-6 py-3 border border-gray-200 text-gray-600 font-semibold rounded-full hover:bg-gray-50 transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed">
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* ══ UPLOAD PHOTOS ════════════════════════════════ */}
          {section === 'photos' && (
            <div>
              {photoToast && (
                <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl
                  ${photoToast.startsWith('✓') ? 'bg-[#1A1A2E] text-white' : 'bg-red-500 text-white'}`}>
                  {photoToast}
                </div>
              )}
              <div className="mb-6">
                <h1 className="font-display text-2xl text-[#1A1A2E]">Upload Photos</h1>
                <p className="text-gray-400 text-sm">Document repair progress with photos for the customer</p>
              </div>

              {(() => {
                const selectedJob = jobs.find(j => j.id === photoJob)
                const isInspected = selectedJob?.inspection_advisor_sig && ['pending', 'customer_signed', 'completed'].includes(selectedJob?.inspection_status)
                const isCustomerSigned = selectedJob?.inspection_status === 'customer_signed' || selectedJob?.inspection_status === 'completed'
                const isPendingJob = selectedJob?.status === 'pending'
                const isBlocked = isPendingJob && (!isInspected || !isCustomerSigned)

                return (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50">
                    {/* Error / Warning Alert Banners */}
                    {isPendingJob && !isInspected && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex items-start gap-3 text-red-700">
                        <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-sm">Vehicle Inspection Required</h4>
                          <p className="text-xs mt-1">This vehicle has not been inspected yet. Please complete the vehicle inspection first before uploading repair photos.</p>
                        </div>
                      </div>
                    )}
                    {isPendingJob && isInspected && !isCustomerSigned && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3 text-amber-700">
                        <AlertCircle size={18} className="flex-shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <h4 className="font-bold text-sm">Awaiting Customer Sign-off</h4>
                          <p className="text-xs mt-1">Vehicle inspection is submitted, but customer signature is pending. Repair photos cannot be uploaded yet.</p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-5 mb-6">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Select Job</label>
                        <select value={photoJob} onChange={e => setPhotoJob(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] bg-white">
                          {active.length === 0
                            ? <option value="">No active jobs</option>
                            : active.map(j => <option key={j.id} value={j.id}>{j.tracking_number} — {j.make} {j.model}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Photo Type</label>
                        <select value={photoType} onChange={e => setPhotoType(e.target.value)}
                          disabled={isBlocked}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] bg-white disabled:bg-gray-50 disabled:text-gray-400">
                          {[['before','Before Repair'],['during','During Repair'],['after','After Repair'],['damage','Damage Evidence'],['dashboard','Dashboard/Odometer']].map(([val,label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div 
                      className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all group mb-6 ${
                        isBlocked 
                          ? 'border-gray-200 bg-gray-50 cursor-not-allowed text-gray-400' 
                          : 'border-gray-200 cursor-pointer hover:border-[#B8860B] hover:bg-[#B8860B]/3'
                      }`}
                      onClick={() => !isBlocked && document.getElementById('techPhotoInput').click()}
                    >
                      <Camera size={40} className={`mx-auto mb-3 transition-colors ${isBlocked ? 'text-gray-300' : 'text-gray-300 group-hover:text-[#B8860B]'}`} />
                      <p className={`font-semibold transition-colors ${isBlocked ? 'text-gray-400' : 'text-gray-500 group-hover:text-[#B8860B]'}`}>
                        {isBlocked ? 'Upload disabled' : 'Click to browse or drag & drop photos here'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Supports JPG, PNG — up to 10MB per photo</p>
                      {!isBlocked && (
                        <input type="file" id="techPhotoInput" accept="image/*" multiple className="hidden"
                          onChange={handlePhotoSelect} />
                      )}
                    </div>

                    {/* Previews */}
                    {photoPreviews.length > 0 && (
                      <div className="flex flex-wrap gap-3 mb-6">
                        {photoPreviews.map((p, i) => (
                          <div key={i} className="relative">
                            <img src={p.url} alt={p.name} className="w-24 h-20 object-cover rounded-xl border-2 border-gray-100" />
                            <button onClick={() => {
                              setPhotoPreviews(prev => prev.filter((_, j) => j !== i))
                              setPhotoFiles(prev => prev.filter((_, j) => j !== i))
                            }} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600">
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button onClick={uploadPhotos} disabled={photoUploading || !photoFiles.length || !photoJob || isBlocked}
                        className="flex items-center gap-2 px-6 py-3 bg-[#B8860B] text-white font-semibold rounded-full hover:bg-[#8B6508] transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed">
                        <Camera size={14} /> {photoUploading ? 'Uploading...' : `Upload ${photoFiles.length > 0 ? photoFiles.length + ' ' : ''}Photos`}
                      </button>
                      <button onClick={() => { setPhotoFiles([]); setPhotoPreviews([]) }} disabled={isBlocked}
                        className="px-6 py-3 border border-gray-200 text-gray-600 font-semibold rounded-full hover:bg-gray-50 transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed">
                        Clear All
                      </button>
                    </div>
                  </div>
                )
              })()}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Estimated Cost (MK)</label>
                  <input type="number" value={updateModal.estimated_cost || ''}
                    onChange={e => setUpdateModal(m => ({ ...m, estimated_cost: e.target.value }))}
                    placeholder="Quote / estimate"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Final Cost (MK) <span className="text-[#B8860B]">★</span>
                  </label>
                  <input type="number" value={updateForm.final_cost}
                    onChange={e => setUpdateForm(f => ({ ...f, final_cost: e.target.value }))}
                    placeholder="Actual charged"
                    className="w-full px-4 py-3 border border-[#B8860B]/40 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] bg-[#B8860B]/5" />
                </div>
              </div>
              <p className="text-[10px] text-gray-400">★ Final Cost is required for accurate revenue reporting. Set it when marking a job as completed.</p>
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


