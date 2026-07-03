import React, { useState } from 'react'
import {
  Car, User, ClipboardCheck, Camera, Package, PenLine,
  CheckCircle, AlertTriangle, Printer, Fuel, ShieldAlert,
  Calendar, Eye
} from 'lucide-react'

/* ─── READ-ONLY DAMAGE MAP ─────────────────────────────────────── */
function ReadOnlyDamageMap({ damages }) {
  const zones = [
    { id: 'front', label: 'Front', style: { left: '4%', top: '42%' } },
    { id: 'rear', label: 'Rear', style: { right: '4%', top: '42%' } },
    { id: 'roof', label: 'Roof', style: { left: '43%', top: '4%' } },
    { id: 'hood', label: 'Hood', style: { left: '12%', top: '18%' } },
    { id: 'boot', label: 'Boot', style: { right: '12%', top: '18%' } },
    { id: 'left', label: 'Left Side', style: { left: '43%', top: '75%' } },
    { id: 'right', label: 'R. Side', style: { left: '43%', bottom: '4%' } },
    { id: 'windsh', label: 'Windshield', style: { left: '23%', top: '35%' } },
  ]

  return (
    <div className="bg-[#F5F3EE] rounded-2xl p-4 mb-4 relative min-h-[220px]">
      <svg viewBox="0 0 500 200" className="w-full max-w-lg mx-auto block max-h-[180px]">
        <rect x="60" y="90" width="380" height="80" rx="10" fill="#D0D8E4" stroke="#9BA8B5" strokeWidth="1.5" />
        <rect x="120" y="55" width="260" height="60" rx="10" fill="#BFC9D6" stroke="#9BA8B5" strokeWidth="1.5" />
        <rect x="130" y="60" width="105" height="48" rx="5" fill="#90CAF9" opacity="0.6" />
        <rect x="265" y="60" width="105" height="48" rx="5" fill="#90CAF9" opacity="0.6" />
        <circle cx="140" cy="174" r="22" fill="#37474F" stroke="#263238" strokeWidth="2" />
        <circle cx="140" cy="174" r="11" fill="#607D8B" />
        <circle cx="360" cy="174" r="22" fill="#37474F" stroke="#263238" strokeWidth="2" />
        <circle cx="360" cy="174" r="11" fill="#607D8B" />
        <rect x="44" y="96" width="22" height="50" rx="6" fill="#B0BEC5" stroke="#9BA8B5" strokeWidth="1" />
        <rect x="434" y="96" width="22" height="50" rx="6" fill="#B0BEC5" stroke="#9BA8B5" strokeWidth="1" />
        <rect x="46" y="100" width="16" height="18" rx="3" fill="#FFF176" opacity="0.9" />
        <rect x="438" y="100" width="16" height="18" rx="3" fill="#EF9A9A" opacity="0.9" />
        <line x1="250" y1="92" x2="250" y2="168" stroke="#9BA8B5" strokeWidth="1" strokeDasharray="4,3" />
      </svg>

      <div className="absolute inset-0 pointer-events-none">
        {zones.map(({ id, label, style }) => {
          const marked = damages.includes(label)
          return (
            <div key={id}
              style={{ ...style, position: 'absolute', transform: 'translate(-50%,-50%)' }}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border-[1.5px] whitespace-nowrap shadow-sm select-none
                ${marked
                  ? 'bg-red-500 border-red-500 text-white shadow-red-200 animate-pulse'
                  : 'bg-white/90 border-gray-200 text-gray-400'}`}>
              {marked ? '⚠️ ' : ''}{label}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── MAIN REPORT VIEW ─────────────────────────────────────────── */
export default function InspectionReportDetails({ inspection, job = {} }) {
  const [activeTab, setActiveTab] = useState(0)
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  if (!inspection) return null

  // Safely parse JSON strings
  const checklist = (() => {
    try {
      return typeof inspection.checklist === 'string' ? JSON.parse(inspection.checklist || '{}') : (inspection.checklist || {})
    } catch { return {} }
  })()

  const accessories = (() => {
    try {
      return typeof inspection.accessories === 'string' ? JSON.parse(inspection.accessories || '{}') : (inspection.accessories || {})
    } catch { return {} }
  })()

  const damages = (() => {
    try {
      return typeof inspection.damage_notes === 'string' ? JSON.parse(inspection.damage_notes || '[]') : (inspection.damage_notes || [])
    } catch { return [] }
  })()

  const photos = inspection.photos || []

  // Checklist Categories
  const categories = [
    {
      title: '🚗 Exterior',
      items: ['Scratches', 'Dents', 'Cracked Windshield', 'Broken Lights', 'Tyre Condition']
    },
    {
      title: '🪑 Interior',
      items: ['Seat Condition', 'Dashboard Damage', 'Radio/Infotainment', 'Air Conditioning', 'Seat Belts']
    },
    {
      title: '⚙️ Mechanical',
      items: ['Engine Noise', 'Oil Leak', 'Battery Status', 'Brake Feel', 'Warning Lights']
    },
    {
      title: '🔧 Under Bonnet',
      items: ['Coolant Level', 'Engine Oil Level', 'Brake Fluid', 'Air Filter', 'Timing Belt (visual)']
    }
  ]

  const tabs = [
    { label: 'Vehicle Info', icon: Car },
    { label: 'Condition Check', icon: ClipboardCheck, badge: damages.length || null, badgeColor: 'bg-red-500 text-white' },
    { label: 'Photos', icon: Camera, badge: photos.length || null, badgeColor: 'bg-[#B8860B] text-white' },
    { label: 'Accessories', icon: Package },
    { label: 'Signatures', icon: PenLine }
  ]

  const printReport = () => {
    window.print()
  }

  const backendBase = ''

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#B8860B]/10 rounded-xl flex items-center justify-center">
            <ClipboardCheck size={18} className="text-[#B8860B]" />
          </div>
          <div>
            <h2 className="font-bold text-[#1A1A2E] text-base">Inspection Report — {job.make || inspection.make} {job.model || inspection.model}</h2>
            <p className="text-xs text-gray-400">Ref: <strong className="text-[#B8860B]">{inspection.reference_number}</strong> · Reg: {job.registration_number || inspection.registration_number}</p>
          </div>
        </div>
        <button onClick={printReport}
          className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 text-xs font-semibold rounded-full hover:bg-gray-50 transition-colors">
          <Printer size={12} /> Print Report
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 overflow-x-auto bg-gray-50/50">
        {tabs.map((tab, idx) => {
          const Icon = tab.icon
          const isActive = activeTab === idx
          return (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap focus:outline-none
                ${isActive
                  ? 'border-[#B8860B] text-[#B8860B] bg-white font-black'
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50/20'}`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {tab.badge !== null && (
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${tab.badgeColor}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab Contents */}
      <div className="p-6">
        
        {/* STEP 1: VEHICLE & CUSTOMER INFO */}
        {activeTab === 0 && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100/50">
                <h3 className="font-bold text-[#1A1A2E] text-xs uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                  <User size={13} className="text-[#B8860B]" /> Customer details
                </h3>
                <div className="space-y-2.5">
                  {[
                    ['Name', job.customer_name || inspection.customer_name || '—'],
                    ['Phone', job.customer_phone || inspection.customer_phone || '—'],
                    ['Tracking Number', job.tracking_number || inspection.tracking_number || '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                      <span className="text-gray-400">{k}</span>
                      <span className="font-semibold text-[#1A1A2E]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100/50">
                <h3 className="font-bold text-[#1A1A2E] text-xs uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                  <Car size={13} className="text-[#B8860B]" /> Vehicle specifications
                </h3>
                <div className="space-y-2.5">
                  {[
                    ['Make / Model', `${job.make || inspection.make || ''} ${job.model || inspection.model || ''}`.trim() || '—'],
                    ['Registration', job.registration_number || inspection.registration_number || '—'],
                    ['Color / Year', `${job.color || inspection.color || '—'} / ${job.year || inspection.year || '—'}`],
                    ['VIN / Chassis No.', job.chassis_number || inspection.chassis_number || '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                      <span className="text-gray-400">{k}</span>
                      <span className={`font-semibold text-[#1A1A2E] ${k === 'VIN / Chassis No.' ? 'font-mono tracking-wider text-xs' : ''}`}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100/50">
              <h3 className="font-bold text-[#1A1A2E] text-xs uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-1.5">
                <ClipboardCheck size={13} className="text-[#B8860B]" /> Reception diagnostics
              </h3>
              <div className="grid md:grid-cols-3 gap-6 mb-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600"><Fuel size={16} /></div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fuel Level</p>
                    <p className="text-sm font-bold text-[#1A1A2E] mt-0.5">{inspection.fuel_level || '—'}</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600"><Car size={16} /></div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Odometer</p>
                    <p className="text-sm font-bold text-[#1A1A2E] mt-0.5">{inspection.odometer_reading ? `${inspection.odometer_reading.toLocaleString()} km` : '—'}</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-3">
                  <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600"><ClipboardCheck size={16} /></div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Service</p>
                    <p className="text-sm font-bold text-[#1A1A2E] mt-0.5">{job.service_name || inspection.service_name || '—'}</p>
                  </div>
                </div>
              </div>

              {job.problem_description && (
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Customer Complaint / Problem Description</p>
                  <p className="text-sm text-[#1A1A2E] leading-relaxed whitespace-pre-wrap">{job.problem_description}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: CONDITION CHECKLIST */}
        {activeTab === 1 && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-[#1A1A2E] text-xs uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-red-500" /> Pre-Existing Damages
                </h3>
                <ReadOnlyDamageMap damages={damages} />
                
                {damages.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {damages.map((d, i) => (
                      <span key={i} className="text-xs bg-red-50 text-red-600 border border-red-100 px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> {d}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-xs text-green-700 flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                    <span>No pre-existing body damages were marked on the map.</span>
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <h3 className="font-bold text-[#1A1A2E] text-xs uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1.5">
                  <ClipboardCheck size={13} className="text-[#B8860B]" /> Detailed Diagnostics
                </h3>
                
                <div className="max-h-[380px] overflow-y-auto pr-1 space-y-4">
                  {categories.map((cat, ci) => {
                    const filledItems = cat.items.filter(item => checklist[item]);
                    return (
                      <div key={ci} className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                        <h4 className="font-bold text-[#1A1A2E] text-xs mb-2.5">{cat.title}</h4>
                        <div className="space-y-2">
                          {cat.items.map(item => {
                            const data = checklist[item] || { checked: false, value: 'None' }
                            const isIssue = data.checked
                            return (
                              <div key={item} className="flex justify-between items-center py-1.5 border-b border-gray-100/50 last:border-0 text-xs">
                                <span className={`font-semibold ${isIssue ? 'text-orange-600 flex items-center gap-1' : 'text-gray-500'}`}>
                                  {isIssue && <AlertTriangle size={11} className="text-orange-500" />}
                                  {item}
                                </span>
                                <span className={`px-2 py-0.5 rounded font-bold
                                  ${isIssue ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                                  {data.value || (isIssue ? 'Issue Flagged' : 'OK')}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PHOTOS */}
        {activeTab === 2 && (
          <div className="space-y-6">
            {photos.length === 0 ? (
              <div className="bg-gray-50 rounded-2xl p-10 text-center border border-gray-100">
                <Camera size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 font-semibold">No Inspection Photos Uploaded</p>
                <p className="text-xs text-gray-400 mt-1">No digital proof was captured during this reception.</p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {['before', 'damage', 'dashboard'].map(type => {
                    const mine = photos.filter(p => p.photo_type === type)
                    if (mine.length === 0) return null
                    return (
                      <div key={type} className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100/50">
                        <h4 className="font-bold text-xs uppercase tracking-widest text-gray-400 mb-3 capitalize">
                          📸 {type === 'before' ? 'Before Repairs' : type === 'damage' ? 'Damages' : 'Dashboard & Odometer'}
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {mine.map((photo, pi) => {
                            const fullUrl = photo.file_url.startsWith('http') ? photo.file_url : `${backendBase}${photo.file_url}`
                            return (
                              <div
                                key={pi}
                                onClick={() => setSelectedPhoto(fullUrl)}
                                className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 cursor-pointer group hover:border-[#B8860B] transition-all"
                              >
                                <img src={fullUrl} alt={type} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                  <Eye size={16} className="text-white" />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Photo Lightbox */}
            {selectedPhoto && (
              <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedPhoto(null)}>
                <div className="relative max-w-3xl w-full max-h-[80vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
                  <img src={selectedPhoto} alt="Zoomed inspection" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/10" />
                  <button
                    onClick={() => setSelectedPhoto(null)}
                    className="absolute -top-10 right-0 text-white hover:text-[#B8860B] font-bold text-sm bg-black/40 px-3 py-1.5 rounded-full flex items-center gap-1 transition-all"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: ACCESSORIES & VALUABLES */}
        {activeTab === 3 && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100/50">
                <h3 className="font-bold text-[#1A1A2E] text-xs uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                  <Package size={13} className="text-[#B8860B]" /> Handed over accessories
                </h3>
                
                {Object.values(accessories).some(Boolean) ? (
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(accessories).map(([name, checked]) => (
                      <div
                        key={name}
                        className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold border
                          ${checked
                            ? 'bg-green-50/80 border-green-200 text-green-700'
                            : 'bg-gray-50/30 border-gray-100 text-gray-300 line-through'}`}
                      >
                        <span className="text-sm">{checked ? '✓' : '—'}</span>
                        <span>{name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
                    <span>No keys or accessories recorded as handed over.</span>
                  </div>
                )}
              </div>

              <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100/50 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-[#1A1A2E] text-xs uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                    <ShieldAlert size={13} className="text-red-500" /> Valuables in Vehicle
                  </h3>
                  {inspection.valuables_notes ? (
                    <div className="bg-white border border-gray-100 rounded-xl p-4 text-sm text-[#1A1A2E] leading-relaxed whitespace-pre-wrap">
                      {inspection.valuables_notes}
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-xs text-green-700 flex items-center gap-2">
                      <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                      <span>No valuables were recorded in the vehicle.</span>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50/50 border border-blue-100/50 rounded-xl p-4 mt-6 text-[11px] text-blue-600 leading-relaxed">
                  ⚠️ <strong>Disclaimer:</strong> While AutoMedic takes utmost care of vehicles under custody, clients are strictly advised to remove all high-value items/cash prior to leaving the vehicle.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: SIGNATURES */}
        {activeTab === 4 && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Advisor signature */}
              <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100/50 text-center">
                <h4 className="font-bold text-xs uppercase tracking-widest text-gray-400 mb-3">✍️ Service Advisor Sign-Off</h4>
                <div className="bg-white rounded-xl border border-gray-200 p-4 h-28 flex items-center justify-center relative">
                  {inspection.advisor_signature ? (
                    <img src={inspection.advisor_signature} alt="Advisor signature" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-xs text-gray-300 italic">No signature captured</span>
                  )}
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  <p className="font-bold text-[#1A1A2E]">{job.technician_name || 'Service Advisor'}</p>
                  <p className="text-[10px] mt-0.5">{inspection.created_at ? new Date(inspection.created_at).toLocaleString('en-GB') : '—'}</p>
                </div>
              </div>

              {/* Customer signature */}
              <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100/50 text-center">
                <h4 className="font-bold text-xs uppercase tracking-widest text-gray-400 mb-3">✍️ Customer Confirmation</h4>
                <div className="bg-white rounded-xl border border-gray-200 p-4 h-28 flex items-center justify-center relative">
                  {inspection.customer_signature ? (
                    <img src={inspection.customer_signature} alt="Customer signature" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-xs text-amber-500 font-semibold italic flex items-center gap-1">
                      <AlertTriangle size={12} /> Awaiting Sign-off
                    </span>
                  )}
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  <p className="font-bold text-[#1A1A2E]">{job.customer_name || inspection.customer_name || 'Customer'}</p>
                  <p className="text-[10px] mt-0.5">{inspection.customer_signed_at ? new Date(inspection.customer_signed_at).toLocaleString('en-GB') : '—'}</p>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}
