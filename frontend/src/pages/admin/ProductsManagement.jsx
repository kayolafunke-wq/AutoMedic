import { useState, useEffect } from 'react'
import { Plus, Edit2, X, Save, Package, ToggleLeft, ToggleRight, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../../services/api'

const CATEGORIES = ['tyres', 'oils', 'brakes', 'filters', 'electrical', 'body', 'engine', 'accessories', 'other']
const EMPTY = { name: '', description: '', category: '', price: '', stock_quantity: '' }
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

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const load = () => {
    setLoading(true)
    api.get('/products').then(r => setProducts(r.data.data || [])).catch(() => setProducts([])).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])
  // Reset page on filter/search change
  useEffect(() => { setPage(1) }, [search, catFilter])

  const openAdd = () => { setForm(EMPTY); setModal('add') }
  const openEdit = (p) => { setForm({ name: p.name, description: p.description || '', category: p.category || '', price: p.price || '', stock_quantity: p.stock_quantity || '' }); setModal(p) }

  const save = async () => {
    if (!form.name) return showToast('Product name is required')
    setSaving(true)
    try {
      const payload = {
        name:           form.name,
        description:    form.description || null,
        category:       form.category || null,
        price:          form.price ? Number(form.price) : null,
        stock_quantity: form.stock_quantity ? Number(form.stock_quantity) : 0,
      }
      if (modal === 'add') {
        const r = await api.post('/products', payload)
        setProducts(prev => [r.data.data, ...prev])
        showToast('✓ Product added')
      } else {
        await api.patch(`/products/${modal.id}`, payload)
        setProducts(prev => prev.map(p => p.id === modal.id ? { ...p, ...payload } : p))
        showToast('✓ Product updated')
      }
      setModal(null)
    } catch (err) {
      showToast('✕ ' + (err.response?.data?.message || err.message))
    } finally { setSaving(false) }
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-display text-2xl text-[#1A1A2E]">Products & Parts</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage spare parts and products inventory</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#B8860B] text-white text-sm font-semibold rounded-full hover:bg-[#8B6508] transition-colors">
          <Plus size={14} /> Add Product
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          ['📦', products.length,         'Total Products',   'bg-blue-50 text-blue-600'],
          ['✅', products.filter(p=>p.is_active).length, 'Active Products', 'bg-green-50 text-green-600'],
          ['🗃️', totalStock,              'Total Stock Units','bg-orange-50 text-orange-600'],
          ['💰', fmtPrice(totalValue),    'Inventory Value',  'bg-[#B8860B]/10 text-[#B8860B]'],
        ].map(([icon, val, label, cls], i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50 flex items-center gap-3">
            <div className={`w-11 h-11 ${cls} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>{icon}</div>
            <div>
              <div className="text-xl font-black text-[#1A1A2E] leading-none">{val}</div>
              <div className="text-xs text-gray-400 mt-1">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + category filters */}
      <div className="flex gap-3 mb-5 flex-wrap items-center">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            className="pl-10 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] bg-white w-64" />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['all', ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all
                ${catFilter === c ? 'bg-[#B8860B] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-[#B8860B] hover:text-[#B8860B]'}`}>
              {c === 'all' ? `All (${products.length})` : c}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80">
              {['Product','Category','Price','Stock','Value','Status','Action'].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
                  Loading products...
                </div>
              </td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-16 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Package size={32} className="text-gray-200" />
                  <p className="text-gray-400 text-sm font-medium">
                    {search ? `No products match "${search}"` : 'No products found'}
                  </p>
                  {!search && <button onClick={openAdd} className="text-[#B8860B] text-xs font-semibold hover:underline">Add your first product →</button>}
                </div>
              </td></tr>
            ) : paginated.map((p) => (
              <tr key={p.id} className={`border-t border-gray-50 hover:bg-gray-50/50 transition-colors ${!p.is_active ? 'opacity-60' : ''}`}>
                <td className="px-4 py-3.5">
                  <div>
                    <p className="font-semibold text-[#1A1A2E]">{p.name}</p>
                    {p.description && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{p.description}</p>}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full capitalize font-medium">
                    {p.category || '—'}
                  </span>
                </td>
                <td className="px-4 py-3.5 font-semibold text-[#B8860B]">{fmtPrice(p.price)}</td>
                <td className="px-4 py-3.5">
                  <span className={`font-bold text-sm ${p.stock_quantity === 0 ? 'text-red-500' : p.stock_quantity < 5 ? 'text-amber-500' : 'text-gray-700'}`}>
                    {p.stock_quantity || 0}
                  </span>
                  {p.stock_quantity === 0 && <span className="ml-1.5 text-[10px] text-red-500 font-semibold">Out</span>}
                  {p.stock_quantity > 0 && p.stock_quantity < 5 && <span className="ml-1.5 text-[10px] text-amber-500 font-semibold">Low</span>}
                </td>
                <td className="px-4 py-3.5 text-gray-500 text-xs">{fmtPrice((p.price || 0) * (p.stock_quantity || 0))}</td>
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
            ))}
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl p-7 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[#1A1A2E] text-base">
                {modal === 'add' ? 'Add New Product' : `Edit: ${modal.name}`}
              </h3>
              <button onClick={() => setModal(null)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                <X size={14} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Product Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Gates Timing Belt Kit"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
                <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional description"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] bg-white">
                  <option value="">— Select category —</option>
                  {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Price (MK)</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="e.g. 15000"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Stock Quantity</label>
                  <input type="number" value={form.stock_quantity} onChange={e => setForm(f => ({ ...f, stock_quantity: e.target.value }))}
                    placeholder="e.g. 10"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B]" />
                </div>
              </div>
              <button onClick={save} disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#B8860B] text-white font-bold rounded-full hover:bg-[#8B6508] transition-colors disabled:opacity-60 text-sm">
                <Save size={14} /> {saving ? 'Saving...' : modal === 'add' ? 'Add Product' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
