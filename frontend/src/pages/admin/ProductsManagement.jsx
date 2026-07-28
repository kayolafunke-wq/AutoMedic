import { useState, useEffect, useRef } from 'react'
import { Plus, Edit2, X, Save, Package, ToggleLeft, ToggleRight, Search, ChevronLeft, ChevronRight, CheckCircle, Archive, DollarSign, Upload, Image } from 'lucide-react'
import api from '../../services/api'

const CATEGORIES = ['tyres', 'oils', 'brakes', 'filters', 'electrical', 'body', 'engine', 'accessories', 'other']
const EMPTY = { name: '', description: '', category: '', cost_price: '', price: '', stock_quantity: '', image_url: '' }
const PAGE_SIZE = 10

export default function ProductsManagement() {
  const [products,  setProducts]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [page,      setPage]      = useState(1)
  const [modal,     setModal]     = useState(null)
  const [form,      setForm]      = useState(EMPTY)
  const [saving,    setSaving]    = useState(false)
  const [toast,     setToast]     = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const load = () => {
    setLoading(true)
    api.get('/products').then(r => setProducts(r.data.data || [])).catch(() => setProducts([])).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])
  // Reset page on filter/search change
  useEffect(() => { setPage(1) }, [search, catFilter])

  const openAdd = () => { 
    setForm(EMPTY) 
    setImageFile(null)
    setImagePreview(null)
    setModal('add') 
  }
  const openEdit = (p) => { 
    setForm({ 
      name: p.name, 
      description: p.description || '', 
      category: p.category || '', 
      cost_price: p.cost_price || '', 
      price: p.price || '', 
      stock_quantity: p.stock_quantity || '',
      image_url: p.image_url || ''
    })
    setImageFile(null)
    setImagePreview(p.image_url || null)
    setModal(p) 
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { showToast('✕ Image must be smaller than 5MB'); return }
    if (!file.type.startsWith('image/')) { showToast('✕ Please select a valid image file'); return }
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  // Convert file to base64 and upload directly to DB (works on Railway)
  const uploadImageBase64 = async (productId, base64Data) => {
    setUploading(true)
    try {
      const res = await api.post(`/products/${productId}/image`, { image_data: base64Data })
      return res.data.image_url
    } catch (err) {
      showToast('✕ Failed to upload image: ' + (err.response?.data?.message || err.message))
      return null
    } finally {
      setUploading(false)
    }
  }

  const removeImage = async (productId) => {
    try {
      await api.delete(`/products/${productId}/image`)
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, image_url: null } : p))
      setImagePreview(null)
      setImageFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      showToast('✓ Image removed')
    } catch (err) {
      showToast('✕ Failed to remove image')
    }
  }

  const save = async () => {
    if (!form.name) return showToast('✕ Product name is required')
    setSaving(true)
    try {
      const payload = {
        name:           form.name,
        description:    form.description || null,
        category:       form.category || null,
        cost_price:     form.cost_price ? Number(form.cost_price) : null,
        price:          form.price ? Number(form.price) : null,
        stock_quantity: form.stock_quantity ? Number(form.stock_quantity) : 0,
      }
      
      let product
      if (modal === 'add') {
        const r = await api.post('/products', payload)
        product = r.data.data
        
        // Upload image if selected (base64 → DB)
        if (imageFile && imagePreview) {
          const newUrl = await uploadImageBase64(product.id, imagePreview)
          if (newUrl) product = { ...product, image_url: newUrl }
        }
        
        setProducts(prev => [product, ...prev])
        showToast('✓ Product added')
      } else {
        // Save product details first
        const patchRes = await api.patch(`/products/${modal.id}`, payload)
        product = patchRes.data.data

        // Upload new image if a new file was selected
        if (imageFile && imagePreview) {
          const newUrl = await uploadImageBase64(modal.id, imagePreview)
          if (newUrl) product = { ...product, image_url: newUrl }
        }

        setProducts(prev => prev.map(p => p.id === modal.id ? product : p))
        showToast('✓ Product updated')
      }
      setModal(null)
    } catch (err) {
      console.error('Save error:', err)
      showToast('✕ ' + (err.response?.data?.message || err.message))
    } finally { 
      setSaving(false)
      setUploading(false)
    }
  }

  const toggleActive = async (p) => {
    try {
      await api.patch(`/products/${p.id}`, { is_active: p.is_active ? 0 : 1 })
      setProducts(prev => prev.map(x => x.id === p.id ? { ...x, is_active: x.is_active ? 0 : 1 } : x))
      showToast(`${p.is_active ? 'Deactivated' : 'Activated'} ${p.name}`)
    } catch {
      showToast('✕ Failed to update status')
    }
  }

  const afterFilter = products.filter(p => catFilter === 'all' || p.category === catFilter)
  const afterSearch = afterFilter.filter(p =>
    !search.trim() || `${p.name} ${p.category} ${p.description || ''}`.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(afterSearch.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = afterSearch.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const totalStock = products.reduce((s, p) => s + (p.stock_quantity || 0), 0)
  const totalValue = products.reduce((s, p) => s + ((p.price || 0) * (p.stock_quantity || 0)), 0)
  const totalCost  = products.reduce((s, p) => s + ((p.cost_price || 0) * (p.stock_quantity || 0)), 0)
  const fmtPrice = (n) => n ? `MK ${Number(n).toLocaleString()}` : '—'

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl
          ${toast.startsWith('✓') ? 'bg-[#1A1A2E] text-white' : 'bg-red-500 text-white'}`}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="font-display text-xl sm:text-2xl text-[#1A1A2E]">Products & Parts</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage spare parts and products inventory</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#B8860B] text-white text-sm font-semibold rounded-full hover:bg-[#8B6508] transition-colors">
          <Plus size={14} /> Add Product
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          [Package, products.length,              'Total Products',    'bg-blue-50 text-blue-600'],
          [CheckCircle, products.filter(p=>p.is_active).length, 'Active Products', 'bg-green-50 text-green-600'],
          [Archive, totalStock,                   'Total Stock Units', 'bg-orange-50 text-orange-600'],
          [DollarSign, fmtPrice(totalValue),          'Retail Value',     'bg-[#B8860B]/10 text-[#B8860B]'],
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

      {/* Search + category filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5 items-stretch sm:items-center">
        <div className="relative order-2 sm:order-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="pl-10 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] bg-white w-full sm:w-64" />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap order-1 sm:order-2 overflow-x-auto pb-2 sm:pb-0">
          {['all', ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all whitespace-nowrap
                ${catFilter === c ? 'bg-[#B8860B] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-[#B8860B] hover:text-[#B8860B]'}`}>
              {c === 'all' ? `All (${products.length})` : c}
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
                Loading products...
              </div>
            </div>
          ) : paginated.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <div className="flex flex-col items-center gap-2">
                <Package size={32} className="text-gray-200" />
                <p className="text-gray-400 text-sm font-medium">
                  {search ? `No products match "${search}"` : 'No products found'}
                </p>
                {!search && <button onClick={openAdd} className="text-[#B8860B] text-xs font-semibold hover:underline">Add your first product →</button>}
              </div>
            </div>
          ) : paginated.map((p) => {
            const margin = p.cost_price != null && p.price != null
              ? Number(p.price) - Number(p.cost_price) : null
            const marginPct = p.cost_price > 0 && margin != null
              ? Math.round((margin / Number(p.cost_price)) * 100) : null
            return (
              <div key={p.id} className={`border-b border-gray-50 p-4 hover:bg-gray-50/50 transition-colors ${!p.is_active ? 'opacity-60' : ''}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-3 flex-1 min-w-0">
                    {/* Product Image */}
                    <div className="w-12 h-12 flex-shrink-0">
                      {p.image_url ? (
                        <img 
                          src={p.image_url} 
                          alt={p.name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full bg-gray-100 rounded-lg flex items-center justify-center ${p.image_url ? 'hidden' : 'flex'}`}>
                        <Package size={16} className="text-gray-400" />
                      </div>
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#1A1A2E] truncate">{p.name}</p>
                      {p.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{p.description}</p>}
                      <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full capitalize font-medium">
                        {p.category || '—'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full ${p.is_active ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-100 text-gray-400'}`}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <div className="text-xs text-gray-500">Cost Price</div>
                    <div className="font-medium text-gray-500 text-sm">{p.cost_price != null ? fmtPrice(p.cost_price) : <span className="text-gray-300">—</span>}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Selling Price</div>
                    <div className="font-semibold text-[#B8860B] text-sm">{fmtPrice(p.price)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Margin</div>
                    <div>
                      {margin != null ? (
                        <div>
                          <span className={`text-xs font-bold ${margin >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {margin >= 0 ? '+' : ''}{fmtPrice(margin)}
                          </span>
                          {marginPct != null && (
                            <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-semibold
                              ${marginPct >= 30 ? 'bg-green-50 text-green-600' : marginPct >= 10 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-500'}`}>
                              {marginPct}%
                            </span>
                          )}
                        </div>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Stock</div>
                    <div>
                      <span className={`font-bold text-sm ${p.stock_quantity === 0 ? 'text-red-500' : p.stock_quantity < 5 ? 'text-amber-500' : 'text-gray-700'}`}>
                        {p.stock_quantity || 0}
                      </span>
                      {p.stock_quantity === 0 && <span className="ml-1.5 text-[10px] text-red-500 font-semibold">Out</span>}
                      {p.stock_quantity > 0 && p.stock_quantity < 5 && <span className="ml-1.5 text-[10px] text-amber-500 font-semibold">Low</span>}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => openEdit(p)}
                    className="flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold text-[#B8860B] border border-[#B8860B]/30 py-2 rounded-lg hover:bg-[#B8860B]/5 transition-colors">
                    <Edit2 size={10} /> Edit
                  </button>
                  <button onClick={() => toggleActive(p)}
                    className={`flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold py-2 rounded-lg transition-colors border
                      ${p.is_active ? 'border-gray-200 hover:border-red-300 hover:text-red-500' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                    {p.is_active ? <ToggleLeft size={12} /> : <ToggleRight size={12} />}
                    {p.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Desktop table view */}
        <table className="w-full text-sm hidden lg:table">
          <thead>
            <tr className="bg-gray-50/80">
              {['Product','Category','Cost Price','Selling Price','Margin','Stock','Status','Action'].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
                  Loading products...
                </div>
              </td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-16 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Package size={32} className="text-gray-200" />
                  <p className="text-gray-400 text-sm font-medium">
                    {search ? `No products match "${search}"` : 'No products found'}
                  </p>
                  {!search && <button onClick={openAdd} className="text-[#B8860B] text-xs font-semibold hover:underline">Add your first product →</button>}
                </div>
              </td></tr>
            ) : paginated.map((p) => {
              const margin = p.cost_price != null && p.price != null
                ? Number(p.price) - Number(p.cost_price) : null
              const marginPct = p.cost_price > 0 && margin != null
                ? Math.round((margin / Number(p.cost_price)) * 100) : null
              return (
              <tr key={p.id} className={`border-t border-gray-50 hover:bg-gray-50/50 transition-colors ${!p.is_active ? 'opacity-60' : ''}`}>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    {/* Product Image */}
                    <div className="w-10 h-10 flex-shrink-0">
                      {p.image_url ? (
                        <img 
                          src={p.image_url} 
                          alt={p.name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full bg-gray-100 rounded-lg flex items-center justify-center ${p.image_url ? 'hidden' : 'flex'}`}>
                        <Package size={14} className="text-gray-400" />
                      </div>
                    </div>
                    
                    {/* Product Info */}
                    <div className="min-w-0">
                      <p className="font-semibold text-[#1A1A2E]">{p.name}</p>
                      {p.description && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]">{p.description}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full capitalize font-medium">
                    {p.category || '—'}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-gray-500 text-xs font-medium">{p.cost_price != null ? fmtPrice(p.cost_price) : <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-3.5 font-semibold text-[#B8860B]">{fmtPrice(p.price)}</td>
                <td className="px-4 py-3.5">
                  {margin != null ? (
                    <div>
                      <span className={`text-xs font-bold ${margin >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {margin >= 0 ? '+' : ''}{fmtPrice(margin)}
                      </span>
                      {marginPct != null && (
                        <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-semibold
                          ${marginPct >= 30 ? 'bg-green-50 text-green-600' : marginPct >= 10 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-500'}`}>
                          {marginPct}%
                        </span>
                      )}
                    </div>
                  ) : <span className="text-gray-300 text-xs">—</span>}
                </td>
                <td className="px-4 py-3.5">
                  <span className={`font-bold text-sm ${p.stock_quantity === 0 ? 'text-red-500' : p.stock_quantity < 5 ? 'text-amber-500' : 'text-gray-700'}`}>
                    {p.stock_quantity || 0}
                  </span>
                  {p.stock_quantity === 0 && <span className="ml-1.5 text-[10px] text-red-500 font-semibold">Out</span>}
                  {p.stock_quantity > 0 && p.stock_quantity < 5 && <span className="ml-1.5 text-[10px] text-amber-500 font-semibold">Low</span>}
                </td>
                <td className="px-4 py-3.5">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${p.is_active ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-100 text-gray-400'}`}>
                    {p.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(p)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-[#B8860B] border border-[#B8860B]/30 px-2.5 py-1.5 rounded-lg hover:bg-[#B8860B]/5 transition-colors">
                      <Edit2 size={10} /> Edit
                    </button>
                    <button onClick={() => toggleActive(p)}
                      className={`flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors border
                        ${p.is_active ? 'text-gray-500 border-gray-200 hover:border-red-300 hover:text-red-500' : 'text-green-600 border-green-200 hover:bg-green-50'}`}>
                      {p.is_active ? <ToggleLeft size={12} /> : <ToggleRight size={12} />}
                      {p.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && afterSearch.length > 0 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-xs text-gray-400">
            Showing{' '}
            <strong className="text-gray-600">
              {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, afterSearch.length)}
            </strong>{' '}
            of <strong className="text-gray-600">{afterSearch.length}</strong> product{afterSearch.length !== 1 ? 's' : ''}
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
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-all border
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
                  <Package className="text-[#B8860B]" size={20} />
                  {modal === 'add' ? 'Add New Product' : 'Edit Product'}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">{modal === 'add' ? 'Fill in the product details' : modal.name}</p>
              </div>
              <button onClick={() => setModal(null)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                <X size={14} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Product Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Gates Timing Belt Kit"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B]" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional description"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] resize-none" />
              </div>

              {/* Product Image */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Product Image</label>
                <div
                  onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-[#B8860B]') }}
                  onDragLeave={e => e.currentTarget.classList.remove('border-[#B8860B]')}
                  onDrop={e => {
                    e.preventDefault()
                    e.currentTarget.classList.remove('border-[#B8860B]')
                    const file = e.dataTransfer.files[0]
                    if (file) handleImageSelect({ target: { files: [file] } })
                  }}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-4 transition-colors hover:border-[#B8860B]/50"
                >
                  {imagePreview ? (
                    <div className="flex items-center gap-4">
                      {/* Preview */}
                      <div className="relative flex-shrink-0">
                        <img
                          src={imagePreview}
                          alt="Product preview"
                          className="w-20 h-20 object-cover rounded-xl border border-gray-200 shadow-sm"
                        />
                        {/* Quick-remove X on the image */}
                        <button
                          type="button"
                          onClick={() => {
                            if (modal !== 'add' && modal?.id && !imageFile) {
                              // Remove from DB (was a saved image)
                              removeImage(modal.id)
                              if (modal !== 'add') setModal(m => ({ ...m, image_url: null }))
                            } else {
                              // Just discard the pending local file
                              setImageFile(null)
                              setImagePreview(modal !== 'add' ? (modal?.image_url || null) : null)
                              if (fileInputRef.current) fileInputRef.current.value = ''
                            }
                          }}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow"
                          title="Remove image"
                        >
                          <X size={10} />
                        </button>
                      </div>
                      {/* Controls */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#1A1A2E] truncate">
                          {imageFile ? imageFile.name : 'Current image'}
                        </p>
                        {imageFile && (
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {(imageFile.size / 1024).toFixed(0)} KB
                          </p>
                        )}
                        <div className="flex gap-2 mt-2.5">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#B8860B] border border-[#B8860B]/40 rounded-lg hover:bg-[#B8860B]/5 transition-colors"
                          >
                            <Upload size={11} /> Change
                          </button>
                          {modal !== 'add' && modal?.id && (
                            <button
                              type="button"
                              onClick={() => removeImage(modal.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <X size={11} /> Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex flex-col items-center gap-2 py-4 text-center"
                    >
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Image size={20} className="text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600">Click to upload or drag & drop</p>
                        <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, GIF — max 5 MB</p>
                      </div>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] bg-white">
                  <option value="">— Select category —</option>
                  {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </div>

              {/* Cost price + Selling price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Cost Price (MK)
                    <span className="block text-gray-400 font-normal text-[10px]">what you paid</span>
                  </label>
                  <input type="number" min="0" value={form.cost_price} onChange={e => setForm(f => ({ ...f, cost_price: e.target.value }))}
                    placeholder="10000"
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Selling Price (MK)
                    <span className="block text-gray-400 font-normal text-[10px]">charge customers</span>
                  </label>
                  <input type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="15000"
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B]" />
                </div>
              </div>

              {/* Live margin preview */}
              {form.cost_price && form.price && (
                <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 font-medium">Profit Margin</span>
                    <span className={`text-sm font-black ${Number(form.price) - Number(form.cost_price) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      MK {(Number(form.price) - Number(form.cost_price)).toLocaleString()}
                    </span>
                  </div>
                  {Number(form.cost_price) > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Margin %</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full
                        ${Math.round(((Number(form.price) - Number(form.cost_price)) / Number(form.cost_price)) * 100) >= 20
                          ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {Math.round(((Number(form.price) - Number(form.cost_price)) / Number(form.cost_price)) * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Stock Quantity */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Stock Quantity</label>
                <input type="number" min="0" value={form.stock_quantity} onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))}
                  placeholder="e.g. 10"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B]" />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2.5 mt-6 border-t border-gray-100 pt-4">
              <button onClick={save} disabled={saving || uploading}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#B8860B] text-white font-bold rounded-full hover:bg-[#8B6508] transition-colors disabled:opacity-60 text-sm">
                <Save size={14} />
                {uploading ? 'Uploading Image...' : saving ? 'Saving...' : modal === 'add' ? 'Add Product' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
