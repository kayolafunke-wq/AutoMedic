import { useState, useEffect, useRef } from 'react'
import { Plus, Edit2, X, Save, Wrench, ToggleLeft, ToggleRight, Trash2, Search, ChevronLeft, ChevronRight, Clock, DollarSign, AlertCircle, CheckCircle, Settings, Upload, Image } from 'lucide-react'
import api from '../../services/api'

const CATEGORIES = ['general', 'engine', 'transmission', 'brakes', 'suspension', 'electrical', 'bodywork', 'tyres', 'ac', 'diagnostics', 'other']
const EMPTY = { name: '', description: '', category: 'general', base_price: '', duration_hours: '', image_url: '' }
const PAGE_SIZE = 10

const fmt = (n) => n ? `MK ${Number(n).toLocaleString()}` : '—'
const fmtHours = (h) => {
  if (!h) return '—'
  const n = Number(h)
  if (n < 1) return `${Math.round(n * 60)} min`
  if (n === 1) return '1 hr'
  return `${n} hrs`
}

export default function ServicesManagement() {
  const [services,  setServices]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [page,      setPage]      = useState(1)
  const [modal,     setModal]     = useState(null)  // null | 'add' | service object
  const [form,      setForm]      = useState(EMPTY)
  const [saving,    setSaving]    = useState(false)
  const [deleting,  setDeleting]  = useState(null)
  const [toast,     setToast]     = useState({ msg: '', type: 'success' })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3500)
  }

  const load = () => {
    setLoading(true)
    api.get('/services/all')
      .then(r => setServices(r.data.data || []))
      .catch(() => setServices([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])
  useEffect(() => { setPage(1) }, [search, catFilter])

  const openAdd  = () => { 
    setForm(EMPTY)
    setImageFile(null)
    setImagePreview(null)
    setModal('add') 
  }
  const openEdit = (s) => {
    setForm({
      name:           s.name,
      description:    s.description || '',
      category:       s.category || 'general',
      base_price:     s.base_price || '',
      duration_hours: s.duration_hours || '',
      image_url:      s.image_url || '',
    })
    setImageFile(null)
    setImagePreview(s.image_url || null)
    setModal(s)
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showToast('Image must be smaller than 5MB', 'error')
        return
      }
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file', 'error')
        return
      }
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (serviceId) => {
    if (!imageFile) return null
    
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', imageFile)
      
      const response = await api.post(`/upload/service/${serviceId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      return response.data.data.image_url
    } catch (err) {
      showToast('Failed to upload image', 'error')
      return null
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    if (!form.name.trim()) return showToast('Service name is required', 'error')
    setSaving(true)
    try {
      const payload = {
        name:           form.name.trim(),
        description:    form.description || null,
        category:       form.category || 'general',
        base_price:     form.base_price     ? Number(form.base_price)     : null,
        duration_hours: form.duration_hours ? Number(form.duration_hours) : null,
      }
      
      let service
      if (modal === 'add') {
        const r = await api.post('/services', payload)
        service = r.data.data
        
        // Upload image if selected
        if (imageFile) {
          const imageUrl = await uploadImage(service.id)
          if (imageUrl) {
            const patchResponse = await api.patch(`/services/${service.id}`, { image_url: imageUrl })
            service = patchResponse.data.data // Get the updated service with image_url
          }
        }
        
        setServices(prev => [service, ...prev])
        showToast(`"${form.name}" added successfully`)
      } else {
        // Handle image upload for edit
        let finalImageUrl = modal.image_url // Preserve existing image by default
        
        if (imageFile) {
          // Upload new image if selected
          const uploadedImageUrl = await uploadImage(modal.id)
          if (uploadedImageUrl) {
            finalImageUrl = uploadedImageUrl
          }
        }
        
        // Include image_url in payload to preserve or update it
        payload.image_url = finalImageUrl
        
        const r = await api.patch(`/services/${modal.id}`, payload)
        service = r.data.data // Get the updated service from response
        setServices(prev => prev.map(s => s.id === modal.id ? service : s))
        showToast(`"${form.name}" updated`)
      }
      setModal(null)
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save service', 'error')
    } finally { 
      setSaving(false)
      setUploading(false)
    }
  }

  const toggleActive = async (s) => {
    try {
      await api.patch(`/services/${s.id}`, { is_active: s.is_active ? 0 : 1 })
      setServices(prev => prev.map(x => x.id === s.id ? { ...x, is_active: x.is_active ? 0 : 1 } : x))
      showToast(`"${s.name}" ${s.is_active ? 'deactivated' : 'activated'}`)
    } catch {
      showToast('Failed to update status', 'error')
    }
  }

  const deleteService = async (s) => {
    setDeleting(s.id)
    try {
      const r = await api.delete(`/services/${s.id}`)
      if (r.data.soft) {
        // was soft-deleted (deactivated) because it's in use
        setServices(prev => prev.map(x => x.id === s.id ? { ...x, is_active: 0 } : x))
        showToast(r.data.message, 'warning')
      } else {
        setServices(prev => prev.filter(x => x.id !== s.id))
        showToast(`"${s.name}" permanently deleted`)
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete', 'error')
    } finally { setDeleting(null) }
  }

  // Filter + search + paginate
  const afterFilter = services.filter(s => catFilter === 'all' || s.category === catFilter)
  const afterSearch = afterFilter.filter(s =>
    !search.trim() || `${s.name} ${s.category} ${s.description || ''}`.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(afterSearch.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = afterSearch.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // KPIs
  const active   = services.filter(s => s.is_active)
  const avgPrice = active.length ? Math.round(active.reduce((s, x) => s + Number(x.base_price || 0), 0) / active.length) : 0

  const TOAST_STYLES = {
    success: 'bg-[#1A1A2E] text-white',
    error:   'bg-red-500 text-white',
    warning: 'bg-amber-500 text-white',
  }

  return (
    <div>
      {/* Toast */}
      {toast.msg && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl flex items-center gap-2 ${TOAST_STYLES[toast.type]}`}>
          {toast.type === 'error' ? <AlertCircle size={15} /> : null}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="font-display text-xl sm:text-2xl text-[#1A1A2E]">Services</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage all repair and maintenance services offered</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#B8860B] text-white text-sm font-semibold rounded-full hover:bg-[#8B6508] transition-colors">
          <Plus size={14} /> Add Service
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          [Wrench, services.length,   'Total Services',  'bg-blue-50 text-blue-600'],
          [CheckCircle, active.length,     'Active Services', 'bg-green-50 text-green-600'],
          [DollarSign, fmt(avgPrice),     'Avg. Base Price', 'bg-[#B8860B]/10 text-[#B8860B]'],
          [Settings, CATEGORIES.filter(c => services.some(s => s.category === c)).length, 'Categories Used', 'bg-purple-50 text-purple-600'],
        ].map(([Icon, val, label, cls], i) => (
          <div key={i} className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-50 flex items-center gap-2 sm:gap-3">
            <div className={`w-9 h-9 sm:w-11 sm:h-11 ${cls} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg sm:text-xl font-black text-[#1A1A2E] leading-none truncate">{val}</div>
              <div className="text-xs text-gray-400 mt-1 truncate">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + category filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5 items-stretch sm:items-center">
        <div className="relative order-2 sm:order-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search services..."
            className="pl-10 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] bg-white w-full sm:w-64" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap order-1 sm:order-2 overflow-x-auto pb-2 sm:pb-0">
          <button onClick={() => setCatFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap
              ${catFilter === 'all' ? 'bg-[#B8860B] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-[#B8860B] hover:text-[#B8860B]'}`}>
            All ({services.length})
          </button>
          {CATEGORIES.filter(c => services.some(s => s.category === c)).map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all whitespace-nowrap
                ${catFilter === c ? 'bg-[#B8860B] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-[#B8860B] hover:text-[#B8860B]'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
        {/* Mobile card view */}
        <div className="block lg:hidden">
          {loading ? (
            <div className="px-4 py-10 text-center text-gray-400">
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
                Loading services...
              </div>
            </div>
          ) : paginated.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <div className="flex flex-col items-center gap-2">
                <Wrench size={32} className="text-gray-200" />
                <p className="text-gray-400 text-sm font-medium">
                  {search ? `No services match "${search}"` : 'No services yet'}
                </p>
                {!search && (
                  <button onClick={openAdd} className="text-[#B8860B] text-xs font-semibold hover:underline">
                    Add your first service →
                  </button>
                )}
              </div>
            </div>
          ) : paginated.map(s => (
            <div key={s.id} className={`border-b border-gray-50 p-4 hover:bg-gray-50/50 transition-colors ${!s.is_active ? 'opacity-55' : ''}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-3 flex-1 min-w-0">
                  {/* Service Image */}
                  <div className="w-12 h-12 flex-shrink-0">
                    {s.image_url ? (
                      <img 
                        src={s.image_url} 
                        alt={s.name}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full bg-gray-100 rounded-lg flex items-center justify-center ${s.image_url ? 'hidden' : 'flex'}`}>
                      <Wrench size={16} className="text-gray-400" />
                    </div>
                  </div>
                  
                  {/* Service Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1A1A2E] truncate">{s.name}</p>
                    {s.description && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{s.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full capitalize font-medium">
                        {s.category || 'general'}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${s.is_active ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-100 text-gray-400'}`}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="text-xs text-gray-500">Base Price</div>
                  <span className="font-semibold text-[#B8860B] flex items-center gap-1">
                    <DollarSign size={12} className="opacity-60" />
                    {s.base_price ? `MK ${Number(s.base_price).toLocaleString()}` : '—'}
                  </span>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Duration</div>
                  <span className="text-gray-500 text-xs flex items-center gap-1">
                    <Clock size={11} className="opacity-60" />
                    {fmtHours(s.duration_hours)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => openEdit(s)}
                  className="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold text-[#B8860B] border border-[#B8860B]/30 py-2 rounded-lg hover:bg-[#B8860B]/5 transition-colors">
                  <Edit2 size={10} /> Edit
                </button>
                <button onClick={() => toggleActive(s)}
                  className={`flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold py-2 rounded-lg transition-colors border
                    ${s.is_active
                      ? 'text-gray-500 border-gray-200 hover:border-amber-300 hover:text-amber-600'
                      : 'text-green-600 border-green-200 hover:bg-green-50'}`}>
                  {s.is_active ? <ToggleLeft size={12} /> : <ToggleRight size={12} />}
                  {s.is_active ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete "${s.name}"? If it has appointments, it will be deactivated instead.`)) {
                      deleteService(s)
                    }
                  }}
                  disabled={deleting === s.id}
                  className="px-3 py-2 border border-gray-200 rounded-lg hover:border-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40">
                  {deleting === s.id
                    ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    : <Trash2 size={11} />}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table view */}
        <table className="w-full text-sm hidden lg:table">
          <thead>
            <tr className="bg-gray-50/80">
              {['Service', 'Category', 'Base Price', 'Duration', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
                  Loading services...
                </div>
              </td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-16 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Wrench size={32} className="text-gray-200" />
                  <p className="text-gray-400 text-sm font-medium">
                    {search ? `No services match "${search}"` : 'No services yet'}
                  </p>
                  {!search && (
                    <button onClick={openAdd} className="text-[#B8860B] text-xs font-semibold hover:underline">
                      Add your first service →
                    </button>
                  )}
                </div>
              </td></tr>
            ) : paginated.map(s => (
              <tr key={s.id} className={`border-t border-gray-50 hover:bg-gray-50/50 transition-colors ${!s.is_active ? 'opacity-55' : ''}`}>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    {/* Service Image */}
                    <div className="w-10 h-10 flex-shrink-0">
                      {s.image_url ? (
                        <img 
                          src={s.image_url} 
                          alt={s.name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full bg-gray-100 rounded-lg flex items-center justify-center ${s.image_url ? 'hidden' : 'flex'}`}>
                        <Wrench size={14} className="text-gray-400" />
                      </div>
                    </div>
                    
                    {/* Service Info */}
                    <div className="min-w-0">
                      <p className="font-semibold text-[#1A1A2E]">{s.name}</p>
                      {s.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[220px]">{s.description}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full capitalize font-medium">
                    {s.category || 'general'}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="font-semibold text-[#B8860B] flex items-center gap-1">
                    <DollarSign size={12} className="opacity-60" />
                    {s.base_price ? `MK ${Number(s.base_price).toLocaleString()}` : '—'}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-gray-500 text-xs flex items-center gap-1">
                    <Clock size={11} className="opacity-60" />
                    {fmtHours(s.duration_hours)}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${s.is_active ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-100 text-gray-400'}`}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex gap-1.5">
                    {/* Edit */}
                    <button onClick={() => openEdit(s)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-[#B8860B] border border-[#B8860B]/30 px-2.5 py-1.5 rounded-lg hover:bg-[#B8860B]/5 transition-colors">
                      <Edit2 size={10} /> Edit
                    </button>
                    {/* Toggle active */}
                    <button onClick={() => toggleActive(s)}
                      className={`flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors border
                        ${s.is_active
                          ? 'text-gray-500 border-gray-200 hover:border-amber-300 hover:text-amber-600'
                          : 'text-green-600 border-green-200 hover:bg-green-50'}`}>
                      {s.is_active ? <ToggleLeft size={12} /> : <ToggleRight size={12} />}
                      {s.is_active ? 'Disable' : 'Enable'}
                    </button>
                    {/* Delete */}
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete "${s.name}"? If it has appointments, it will be deactivated instead.`)) {
                          deleteService(s)
                        }
                      }}
                      disabled={deleting === s.id}
                      className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-lg hover:border-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40">
                      {deleting === s.id
                        ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        : <Trash2 size={11} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && afterSearch.length > 0 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-xs text-gray-400">
            Showing{' '}
            <strong className="text-gray-600">{(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, afterSearch.length)}</strong>
            {' '}of <strong className="text-gray-600">{afterSearch.length}</strong> service{afterSearch.length !== 1 ? 's' : ''}
            {search && <span className="ml-1">matching "<em>{search}</em>"</span>}
          </p>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-[#B8860B] hover:text-[#B8860B] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...')
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                p === '...'
                  ? <span key={`e-${i}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-xs">…</span>
                  : <button key={p} onClick={() => setPage(p)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold border transition-all
                        ${safePage === p ? 'bg-[#B8860B] border-[#B8860B] text-white' : 'border-gray-200 text-gray-600 hover:border-[#B8860B] hover:text-[#B8860B]'}`}>
                      {p}
                    </button>
              )
            }
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-[#B8860B] hover:text-[#B8860B] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-8 pb-8 p-4 backdrop-blur-sm overflow-y-auto" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4">
              <div>
                <h3 className="font-bold text-dark text-lg flex items-center gap-2">
                  <Wrench className="text-[#B8860B]" size={20} />
                  {modal === 'add' ? 'Add New Service' : 'Edit Service'}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">{modal === 'add' ? 'Fill in the service details' : modal.name}</p>
              </div>
              <button onClick={() => setModal(null)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                <X size={14} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Service Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Full Engine Service"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B]" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What's included in this service..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] resize-none" />
              </div>

              {/* Service Image */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Service Image</label>
                <div className="flex items-start gap-3">
                  {/* Image Preview */}
                  <div className="w-16 h-16 flex-shrink-0">
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="Service preview"
                        className="w-full h-full object-cover rounded-lg border border-gray-200"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                        <Image size={16} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Upload Controls */}
                  <div className="flex-1 min-w-0">
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageSelect}
                      className="hidden" 
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:border-[#B8860B] hover:text-[#B8860B] transition-colors"
                    >
                      <Upload size={14} />
                      {imagePreview ? 'Change' : 'Upload'}
                    </button>
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null)
                          setImagePreview(null)
                          if (fileInputRef.current) fileInputRef.current.value = ''
                        }}
                        className="w-full mt-2 px-3 py-2 text-xs text-red-500 hover:text-red-600 transition-colors border border-red-200 hover:border-red-300 rounded-lg"
                      >
                        Remove Image
                      </button>
                    )}
                    <p className="text-xs text-gray-400 mt-1.5">Max 5MB • JPG, PNG, GIF</p>
                  </div>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] bg-white">
                  {CATEGORIES.map(c => (
                    <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Price + Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Base Price (MK)</label>
                  <input type="number" min="0" value={form.base_price} onChange={e => setForm(f => ({ ...f, base_price: e.target.value }))}
                    placeholder="25000"
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Duration (hrs)</label>
                  <input type="number" min="0" step="0.5" value={form.duration_hours} onChange={e => setForm(f => ({ ...f, duration_hours: e.target.value }))}
                    placeholder="2.5"
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B]" />
                </div>
              </div>

              {/* Preview */}
              {(form.base_price || form.duration_hours) && (
                <div className="bg-gray-50 rounded-xl p-3 space-y-1 border border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    {form.base_price && (
                      <>
                        <span className="flex items-center gap-1 text-gray-600">
                          <DollarSign size={11} /> Base: <strong className="text-[#B8860B]">{fmt(form.base_price)}</strong>
                        </span>
                        <span className="text-gray-500">+ VAT: <strong>{fmt(Math.round(Number(form.base_price) * 0.165))}</strong></span>
                      </>
                    )}
                  </div>
                  {form.duration_hours && (
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Clock size={11} /> Est Duration: <strong>{fmtHours(form.duration_hours)}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-2.5 mt-6 border-t border-gray-100 pt-4">
              <button onClick={save} disabled={saving || uploading}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#B8860B] text-white font-bold rounded-full hover:bg-[#8B6508] transition-colors disabled:opacity-60 text-sm">
                <Save size={14} />
                {uploading ? 'Uploading Image...' : saving ? 'Saving...' : modal === 'add' ? 'Add Service' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
