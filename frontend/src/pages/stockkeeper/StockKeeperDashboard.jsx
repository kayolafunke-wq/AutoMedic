import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import {
  ShoppingCart, Package, History, LogOut,
  Plus, X, Search, CheckCircle, AlertCircle,
  Trash2, RefreshCw, Eye, Printer, User, Car, FileText,
  Menu, Bell
} from 'lucide-react'

const fmt = (n) => `MK ${Number(n || 0).toLocaleString()}`

// ── RECEIPT MODAL COMPONENT ──────────────────────────────────────────────────
function ReceiptModal({ receipt, onClose }) {
  if (!receipt) return null

  const checkout = receipt.data || receipt
  const items = typeof checkout.items === 'string' ? JSON.parse(checkout.items) : (checkout.items || [])

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:p-0 print:static print:bg-white">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl flex flex-col max-h-[90vh] print:shadow-none print:w-full print:max-w-none">
        {/* Header — always visible, never scrolls */}
        <div className="flex justify-between items-start border-b border-gray-100 px-6 pt-6 pb-4 flex-shrink-0 print:hidden">
          <div>
            <h3 className="font-bold text-dark text-lg flex items-center gap-2">
              <CheckCircle className="text-green-500" size={20} />
              Checkout Complete
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">Receipt generated successfully</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
            <X size={14} />
          </button>
        </div>

        {/* Receipt Content — scrollable */}
        <div className="flex-1 overflow-y-auto space-y-4 px-6 py-4 print:overflow-visible">
          {/* Brand header */}
          <div className="text-center pb-4 border-b border-dashed border-gray-200">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-white font-black text-sm mx-auto mb-2">AM</div>
            <h2 className="text-base font-black tracking-tight text-dark uppercase">AutoMedic Garage</h2>
            <p className="text-[10px] text-gray-400">Blantyre, Malawi · Phone: +265 999 123 456</p>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-y-2 text-xs border-b border-dashed border-gray-200 pb-4">
            <span className="text-gray-400">Checkout ID:</span>
            <span className="font-mono text-right text-dark truncate">{checkout.id}</span>

            <span className="text-gray-400">Date:</span>
            <span className="text-right text-dark">{new Date(checkout.created_at || Date.now()).toLocaleString('en-GB')}</span>

            <span className="text-gray-400">Type:</span>
            <span className="text-right font-semibold uppercase text-primary text-[10px]">{checkout.type === 'job_card' ? 'Job Card Repair' : 'Walk-in Sale'}</span>

            <span className="text-gray-400">Customer:</span>
            <span className="text-right text-dark font-medium">{checkout.customer_name || 'Walk-in Guest'}</span>

            {checkout.invoice_id && (
              <>
                <span className="text-gray-400">Invoice Ref:</span>
                <span className="text-right font-mono text-dark">{checkout.invoice_id.slice(0, 8).toUpperCase()}</span>
              </>
            )}
          </div>

          {/* Items */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider text-[10px]">Items Summary</p>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-xs">
                  <div className="max-w-[70%]">
                    <p className="font-semibold text-dark leading-tight">{item.name}</p>
                    <p className="text-[10px] text-gray-400">{item.qty} x {fmt(item.unit_price)}</p>
                  </div>
                  <span className="font-bold text-dark">{fmt(item.unit_price * item.qty)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {checkout.notes && (
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-xs">
              <span className="font-semibold text-gray-400 block mb-0.5">Notes:</span>
              <p className="text-gray-600 italic">{checkout.notes}</p>
            </div>
          )}

          {/* Summary pricing */}
          <div className="border-t border-dashed border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtotal:</span>
              <span>{fmt(checkout.subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>VAT (16.5%):</span>
              <span>{fmt(checkout.tax)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-dark pt-1.5 border-t border-gray-100">
              <span>TOTAL PAID:</span>
              <span>{fmt(checkout.total)}</span>
            </div>
          </div>
        </div>

        {/* Buttons — pinned to bottom, never scrolls off screen */}
        <div className="flex gap-2.5 border-t border-gray-100 px-6 py-4 flex-shrink-0 print:hidden">
          <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-full transition-colors">
            <Printer size={13} />
            Print Receipt
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-full transition-colors">
            Close & Reset
          </button>
        </div>
      </div>
    </div>
  )
}

// ── CHECKOUT SECTION ─────────────────────────────────────────────────────────
function CheckoutSection() {
  const [mode, setMode]           = useState('job_card') // 'job_card' | 'walkin'
  const [jobCards, setJobCards]   = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts]   = useState([])
  const [selectedJob, setSelectedJob]   = useState(null)
  const [selectedCust, setSelectedCust] = useState(null)
  const [walkName, setWalkName]   = useState('')
  const [cart, setCart]           = useState([])
  const [productSearch, setProductSearch] = useState('')
  const [notes, setNotes]         = useState('')
  const [saving, setSaving]       = useState(false)
  const [toast, setToast]         = useState({ msg: '', type: 'success' })
  const [receipt, setReceipt]     = useState(null)
  const [jobSearch, setJobSearch] = useState('')
  const [custSearch, setCustSearch] = useState('')

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: 'success' }), 4000)
  }

  const loadData = () => {
    api.get('/checkout/job-cards').then(r => setJobCards(r.data.data || [])).catch(() => {})
    api.get('/checkout/customers').then(r => setCustomers(r.data.data || [])).catch(() => {})
    api.get('/checkout/products').then(r => setProducts(r.data.data || [])).catch(() => {})
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredProducts = products.filter(p =>
    !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(productSearch.toLowerCase())
  )

  const addToCart = (p) => {
    if (p.stock_quantity <= 0) {
      showToast(`"${p.name}" is out of stock!`, 'error')
      return
    }
    setCart(prev => {
      const existing = prev.find(i => i.product_id === p.id)
      if (existing) {
        const nextQty = existing.qty + 1
        return prev.map(i => i.product_id === p.id ? { ...i, qty: Math.min(nextQty, p.stock_quantity) } : i)
      }
      return [...prev, { product_id: p.id, name: p.name, unit_price: p.price || 0, qty: 1, max: p.stock_quantity }]
    })
    setProductSearch('')
  }

  const removeFromCart = (productId) => setCart(prev => prev.filter(i => i.product_id !== productId))
  
  const setQty = (productId, qty) => {
    const n = Math.max(1, Number(qty))
    setCart(prev => prev.map(i => i.product_id === productId ? { ...i, qty: Math.min(n, i.max) } : i))
  }

  const subtotal = cart.reduce((s, i) => s + i.unit_price * i.qty, 0)
  const tax      = Math.round(subtotal * 0.165)
  const total    = subtotal + tax

  const reset = () => {
    setCart([]); setSelectedJob(null); setSelectedCust(null)
    setWalkName(''); setNotes(''); setReceipt(null)
    setJobSearch(''); setCustSearch('')
    loadData()
  }

  const confirm = async () => {
    if (!cart.length) return showToast('Add at least one item', 'error')
    if (mode === 'job_card' && !selectedJob) return showToast('Select a job card', 'error')
    if (mode === 'walkin' && !selectedCust && !walkName.trim()) return showToast('Select a customer or enter a name', 'error')
    setSaving(true)
    try {
      const items = cart.map(i => ({ product_id: i.product_id, qty: i.qty, unit_price: i.unit_price }))
      let res
      if (mode === 'job_card') {
        res = await api.post('/checkout/job-card', { job_card_id: selectedJob.id, items, notes })
      } else {
        res = await api.post('/checkout/walkin', {
          customer_id:   selectedCust?.id   || null,
          customer_name: selectedCust?.name || walkName.trim(),
          items, notes
        })
      }
      setReceipt(res.data)
      showToast(res.data.message || 'Checkout successful')
    } catch (err) {
      showToast(err.response?.data?.message || 'Checkout failed', 'error')
    } finally { setSaving(false) }
  }

  const filteredJobs = jobCards.filter(jc =>
    !jobSearch ||
    (jc.customer_name || '').toLowerCase().includes(jobSearch.toLowerCase()) ||
    (jc.tracking_number || '').toLowerCase().includes(jobSearch.toLowerCase()) ||
    (jc.registration_number || '').toLowerCase().includes(jobSearch.toLowerCase())
  )

  const filteredCustomers = customers.filter(c =>
    !custSearch ||
    (c.name || '').toLowerCase().includes(custSearch.toLowerCase()) ||
    (c.phone || '').toLowerCase().includes(custSearch.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast.msg && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl border
          ${toast.type === 'success' ? 'bg-[#1A1A2E] text-white border-primary/20' : 'bg-red-500 text-white border-red-400'}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Setup & Picker */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 shadow-sm border border-gray-50 space-y-6">
          
          {/* Toggle Mode */}
          <div className="flex bg-gray-50 rounded-xl p-1 border border-gray-100">
            <button onClick={() => { setMode('job_card'); reset() }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all
                ${mode === 'job_card' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-dark'}`}>
              <Car size={14} />
              Job Card Checkout
            </button>
            <button onClick={() => { setMode('walkin'); reset() }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all
                ${mode === 'walkin' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-dark'}`}>
              <ShoppingCart size={14} />
              Walk-in Sale
            </button>
          </div>

          {/* Mode-Specific Picker */}
          {mode === 'job_card' ? (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Select Active Job Card *</label>
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by customer name, registration, tracking no..."
                  value={jobSearch}
                  onChange={e => setJobSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                />
              </div>

              {selectedJob ? (
                <div className="bg-[#B8860B]/5 border border-[#B8860B]/10 rounded-2xl p-4 flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Selected Job</p>
                    <h4 className="font-bold text-dark text-sm">{selectedJob.customer_name}</h4>
                    <p className="text-xs text-gray-500">
                      {selectedJob.make} {selectedJob.model} · <strong className="text-gray-700">{selectedJob.registration_number}</strong>
                    </p>
                    <div className="flex gap-2.5 mt-2">
                      <span className="bg-white px-2.5 py-1 text-[9px] font-bold border border-gray-200 text-gray-500 rounded-md">
                        TRACK: {selectedJob.tracking_number}
                      </span>
                      <span className="bg-white px-2.5 py-1 text-[9px] font-bold border border-gray-200 text-gray-500 rounded-md capitalize">
                        ASSIGNED: {selectedJob.technician_name || 'None'}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedJob(null)} className="w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:border-red-500 text-gray-400 hover:text-red-500">
                    <X size={11} />
                  </button>
                </div>
              ) : (
                <div className="border border-gray-100 rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-gray-50">
                  {filteredJobs.length ? filteredJobs.map(jc => (
                    <button key={jc.id} onClick={() => setSelectedJob(jc)}
                      className="w-full text-left p-3 hover:bg-gray-50 transition-colors flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-dark">{jc.customer_name}</p>
                        <p className="text-gray-400 text-[10px]">{jc.make} {jc.model} ({jc.registration_number})</p>
                      </div>
                      <span className="font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] font-semibold">{jc.tracking_number}</span>
                    </button>
                  )) : (
                    <p className="p-4 text-center text-gray-400 text-xs">No active job cards found</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Customer Option *</label>
                
                {selectedCust ? (
                  <div className="bg-[#B8860B]/5 border border-[#B8860B]/10 rounded-2xl p-4 flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Registered Customer</p>
                      <h4 className="font-bold text-dark text-sm">{selectedCust.name}</h4>
                      <p className="text-xs text-gray-400">{selectedCust.email} · {selectedCust.phone}</p>
                    </div>
                    <button onClick={() => setSelectedCust(null)} className="w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:border-red-500 text-gray-400 hover:text-red-500">
                      <X size={11} />
                    </button>
                  </div>
                ) : !walkName.trim() ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search registered customers..."
                        value={custSearch}
                        onChange={e => setCustSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="border border-gray-100 rounded-xl overflow-hidden max-h-40 overflow-y-auto divide-y divide-gray-50">
                      {filteredCustomers.length ? filteredCustomers.map(c => (
                        <button key={c.id} onClick={() => setSelectedCust(c)}
                          className="w-full text-left p-2.5 hover:bg-gray-50 transition-colors flex justify-between items-center text-xs">
                          <span className="font-bold text-dark">{c.name}</span>
                          <span className="text-gray-400 text-[10px]">{c.phone || '—'}</span>
                        </button>
                      )) : (
                        <p className="p-3 text-center text-gray-400 text-xs">No matching customers found</p>
                      )}
                    </div>
                    
                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-gray-100"></div>
                      <span className="flex-shrink mx-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Or Guest Sale</span>
                      <div className="flex-grow border-t border-gray-100"></div>
                    </div>

                    <input
                      type="text"
                      placeholder="Enter customer guest name (e.g. John Doe)"
                      value={walkName}
                      onChange={e => setWalkName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Guest Customer</p>
                      <h4 className="font-bold text-dark text-sm">{walkName}</h4>
                    </div>
                    <button onClick={() => setWalkName('')} className="w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:border-red-500 text-gray-400 hover:text-red-500">
                      <X size={11} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Product Search & Grid Selection */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Search & Add Products</label>
              <span className="text-[10px] text-gray-400 font-semibold">{filteredProducts.length} items available</span>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by name or category..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div className="border border-gray-100 rounded-xl overflow-hidden max-h-52 overflow-y-auto divide-y divide-gray-50 bg-gray-50/50">
              {filteredProducts.length ? filteredProducts.map(p => (
                <div key={p.id} className="p-3 flex items-center justify-between hover:bg-white transition-colors group">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-dark">{p.name}</p>
                    <p className="text-[10px] text-gray-400 capitalize">{p.category} · <span className="font-semibold text-gray-500">{fmt(p.price)}</span></p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                      ${p.stock_quantity === 0 ? 'bg-red-50 text-red-500 border border-red-100' :
                        p.stock_quantity <= 5 ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        'bg-green-50 text-green-600 border border-green-100'}`}>
                      {p.stock_quantity === 0 ? 'Out of Stock' : `${p.stock_quantity} Left`}
                    </span>
                    <button onClick={() => addToCart(p)} disabled={p.stock_quantity === 0}
                      className="px-3 py-1 bg-white hover:bg-primary border border-gray-200 hover:border-primary text-gray-500 hover:text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                      <Plus size={10} /> Add
                    </button>
                  </div>
                </div>
              )) : (
                <p className="p-4 text-center text-gray-400 text-xs">No products match search query</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Cart Overview */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 shadow-sm border border-gray-50 flex flex-col min-h-[480px]">
          <h3 className="font-display text-lg text-dark border-b border-gray-100 pb-3 mb-4 flex items-center justify-between">
            <span>Checkout Cart</span>
            <span className="text-xs bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-full">{cart.reduce((s, i) => s + i.qty, 0)} Items</span>
          </h3>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-80">
            {cart.length ? cart.map(item => (
              <div key={item.product_id} className="bg-gray-50/70 border border-gray-100 rounded-xl p-3 flex justify-between items-center text-xs">
                <div className="max-w-[50%] space-y-0.5">
                  <p className="font-bold text-dark truncate">{item.name}</p>
                  <p className="text-[10px] text-gray-400">{fmt(item.unit_price)} each</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="flex items-center border border-gray-200 bg-white rounded-lg overflow-hidden">
                    <button onClick={() => setQty(item.product_id, item.qty - 1)} className="px-2.5 py-1 hover:bg-gray-50 text-gray-500 font-bold">-</button>
                    <span className="px-2 text-dark font-semibold text-center min-w-[20px]">{item.qty}</span>
                    <button onClick={() => setQty(item.product_id, item.qty + 1)} className="px-2.5 py-1 hover:bg-gray-50 text-gray-500 font-bold">+</button>
                  </div>
                  <button onClick={() => removeFromCart(item.product_id)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                <ShoppingCart size={32} className="opacity-30 mb-2.5" />
                <p className="text-xs">Your checkout cart is empty</p>
                <p className="text-[10px] mt-0.5">Search and add parts from inventory</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
            {/* Notes */}
            {cart.length > 0 && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Internal Notes</label>
                <textarea
                  placeholder="Reason, technician request notes, or general remarks..."
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
                />
              </div>
            )}

            {/* Calculations */}
            <div className="space-y-2 border-t border-gray-50 pt-3 text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal:</span>
                <span className="font-semibold text-dark">{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>VAT Tax (16.5%):</span>
                <span className="font-semibold text-dark">{fmt(tax)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-dark pt-2 border-t border-gray-100">
                <span>Total Amount:</span>
                <span>{fmt(total)}</span>
              </div>
            </div>

            <button
              onClick={confirm}
              disabled={saving || !cart.length || (mode === 'job_card' && !selectedJob) || (mode === 'walkin' && !selectedCust && !walkName.trim())}
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
              {saving ? 'Processing Checkout...' : 'Deduct Stock & Checkout'}
            </button>
          </div>
        </div>
      </div>

      <ReceiptModal receipt={receipt} onClose={reset} />
    </div>
  )
}

// ── STOCK OVERVIEW SECTION ───────────────────────────────────────────────────
function StockOverviewSection() {
  const [products, setProducts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [category, setCategory]   = useState('all')
  const [restockModal, setRestockModal] = useState(null)
  const [restockQty, setRestockQty]     = useState('')
  const [restockNotes, setRestockNotes] = useState('')
  const [saving, setSaving]       = useState(false)
  const [toast, setToast]         = useState('')

  const categories = ['all', 'tyres', 'oils', 'brakes', 'filters', 'electrical', 'body', 'engine', 'accessories', 'other']

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 4000)
  }

  const load = () => {
    setLoading(true)
    api.get('/checkout/products')
      .then(r => setProducts(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleRestock = async (e) => {
    e.preventDefault()
    if (!restockQty || Number(restockQty) <= 0) return showToast('Quantity must be greater than zero')
    setSaving(true)
    try {
      const res = await api.patch(`/checkout/restock/${restockModal.id}`, {
        qty: Number(restockQty),
        notes: restockNotes
      })
      showToast(`✓ ${res.data.message}`)
      setRestockModal(null)
      setRestockQty('')
      setRestockNotes('')
      load()
    } catch (err) {
      showToast('✕ ' + (err.response?.data?.message || 'Restock failed'))
    } finally { setSaving(false) }
  }

  const filtered = products.filter(p => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.category || '').toLowerCase().includes(search.toLowerCase())
    const matchesCat    = category === 'all' || p.category === category
    return matchesSearch && matchesCat
  })

  // Alerts calculations
  const outOfStockCount = products.filter(p => p.stock_quantity === 0).length
  const lowStockCount   = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl border
          ${toast.startsWith('✓') ? 'bg-[#1A1A2E] text-white border-primary/20' : 'bg-red-500 text-white border-red-400'}`}>
          {toast}
        </div>
      )}

      {/* Alerts statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-lg">📦</div>
          <div>
            <h4 className="text-lg font-black text-dark leading-none">{products.length}</h4>
            <p className="text-xs text-gray-400 mt-1">Total Unique Parts</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold text-lg">⚠️</div>
          <div>
            <h4 className="text-lg font-black text-dark leading-none">{lowStockCount}</h4>
            <p className="text-xs text-gray-400 mt-1">Low Stock Alerts (≤ 5)</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex items-center gap-3 sm:col-span-2 lg:col-span-1">
          <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center font-bold text-lg">🚨</div>
          <div>
            <h4 className="text-lg font-black text-dark leading-none">{outOfStockCount}</h4>
            <p className="text-xs text-gray-400 mt-1">Out of Stock Parts</p>
          </div>
        </div>
      </div>

      {/* Filters and Table Container */}
      <div className="bg-white rounded-2xl p-4 lg:p-5 shadow-sm border border-gray-50 space-y-4">
        <div className="flex flex-col gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search product inventory..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
            {categories.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold capitalize border flex-shrink-0 transition-colors
                  ${category === c ? 'bg-primary border-primary text-white' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-primary hover:text-primary'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Table list */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-400 font-bold uppercase tracking-wider text-[9px] border-b border-gray-100">
                <th className="px-4 py-3">Product Part</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Unit Price</th>
                <th className="px-4 py-3 text-center">Available Stock</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={14} className="animate-spin text-primary" />
                      Loading inventory...
                    </div>
                  </td>
                </tr>
              ) : filtered.length ? filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3.5 font-semibold text-dark">{p.name}</td>
                  <td className="px-4 py-3.5 capitalize text-gray-500">{p.category || 'other'}</td>
                  <td className="px-4 py-3.5 text-right font-semibold text-dark">{fmt(p.price)}</td>
                  <td className="px-4 py-3.5 text-center font-bold text-dark">{p.stock_quantity}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[9px]
                      ${p.stock_quantity === 0 ? 'bg-red-50 text-red-500 border border-red-100' :
                        p.stock_quantity <= 5 ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        'bg-green-50 text-green-600 border border-green-100'}`}>
                      {p.stock_quantity === 0 ? 'Out of Stock' : p.stock_quantity <= 5 ? 'Low Stock' : 'In Stock'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <button onClick={() => setRestockModal(p)}
                      className="px-2.5 py-1 text-[10px] font-bold bg-[#B8860B]/10 hover:bg-primary hover:text-white border border-[#B8860B]/15 hover:border-primary text-primary rounded-lg transition-all">
                      Restock
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
                    No products found matching filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-3">
          {loading ? (
            <div className="text-center py-10 text-gray-400">
              <div className="flex items-center justify-center gap-2">
                <RefreshCw size={14} className="animate-spin text-primary" />
                Loading inventory...
              </div>
            </div>
          ) : filtered.length ? filtered.map(p => (
            <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-dark text-sm truncate">{p.name}</h3>
                  <p className="text-xs text-gray-500 capitalize mt-1">{p.category || 'other'}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] flex-shrink-0 ml-2
                  ${p.stock_quantity === 0 ? 'bg-red-50 text-red-500 border border-red-100' :
                    p.stock_quantity <= 5 ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                    'bg-green-50 text-green-600 border border-green-100'}`}>
                  {p.stock_quantity === 0 ? 'Out of Stock' : p.stock_quantity <= 5 ? 'Low Stock' : 'In Stock'}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-400 block">Unit Price</span>
                  <span className="font-semibold text-dark">{fmt(p.price)}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Available Stock</span>
                  <span className="font-bold text-dark">{p.stock_quantity}</span>
                </div>
              </div>
              
              <button onClick={() => setRestockModal(p)}
                className="w-full px-3 py-2 text-xs font-bold bg-[#B8860B]/10 hover:bg-primary hover:text-white border border-[#B8860B]/15 hover:border-primary text-primary rounded-lg transition-all">
                Restock Product
              </button>
            </div>
          )) : (
            <div className="text-center py-10 text-gray-400">
              No products found matching filters
            </div>
          )}
        </div>
      </div>

      {/* Restock Modal Popup */}
      {restockModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setRestockModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-100">
              <h3 className="font-bold text-dark text-sm">Quick Restock Inventory</h3>
              <button onClick={() => setRestockModal(null)} className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center"><X size={12} /></button>
            </div>
            <div className="mb-4 bg-gray-50 p-3 rounded-xl">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Product Part</span>
              <span className="font-bold text-dark text-xs block">{restockModal.name}</span>
              <span className="text-[10px] text-gray-500 mt-1 block">Current Stock Level: <strong className="text-dark">{restockModal.stock_quantity}</strong></span>
            </div>
            <form onSubmit={handleRestock} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Add Quantity *</label>
                <input
                  type="number"
                  placeholder="e.g. 10"
                  min="1"
                  required
                  value={restockQty}
                  onChange={e => setRestockQty(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Remarks / Supplier Info</label>
                <input
                  type="text"
                  placeholder="Optional notes..."
                  value={restockNotes}
                  onChange={e => setRestockNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <button type="submit" disabled={saving}
                className="w-full py-2.5 bg-primary text-white font-bold rounded-full hover:bg-primary-dark transition-all disabled:opacity-50 text-xs">
                {saving ? 'Saving...' : 'Add Stock Qty'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ── CHECKOUT HISTORY SECTION ─────────────────────────────────────────────────
function CheckoutHistorySection() {
  const [history, setHistory]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [viewing, setViewing]   = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/checkout')
      .then(r => setHistory(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = history.filter(h => {
    const q = search.toLowerCase()
    return !search ||
      (h.customer_name || '').toLowerCase().includes(q) ||
      (h.id || '').toLowerCase().includes(q) ||
      (h.tracking_number || '').toLowerCase().includes(q)
  })

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-4 lg:p-5 shadow-sm border border-gray-50 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search checkouts by customer name, checkout ID, vehicle tracking no..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary"
          />
        </div>

        {/* Table list */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-400 font-bold uppercase tracking-wider text-[9px] border-b border-gray-100">
                <th className="px-4 py-3">Checkout ID</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Job Card Ref</th>
                <th className="px-4 py-3 text-right">Total Cost</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={14} className="animate-spin text-primary" />
                      Loading history logs...
                    </div>
                  </td>
                </tr>
              ) : filtered.length ? filtered.map(h => (
                <tr key={h.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-gray-400 text-[10px]">{h.id.slice(0, 10)}...</td>
                  <td className="px-4 py-3.5 text-gray-500">{new Date(h.created_at).toLocaleDateString('en-GB')} {new Date(h.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded font-bold text-[8px] uppercase
                      ${h.type === 'job_card' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-purple-50 text-purple-600 border border-purple-100'}`}>
                      {h.type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-dark">{h.customer_display_name || h.customer_name || 'Walk-in Guest'}</td>
                  <td className="px-4 py-3.5 font-mono text-gray-500 text-[10px]">{h.tracking_number || 'None'}</td>
                  <td className="px-4 py-3.5 text-right font-bold text-dark">{fmt(h.total)}</td>
                  <td className="px-4 py-3.5 text-center">
                    <button onClick={() => setViewing(h)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-lg transition-all">
                      <Eye size={11} /> Details
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    No past checkouts logged
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-3">
          {loading ? (
            <div className="text-center py-10 text-gray-400">
              <div className="flex items-center justify-center gap-2">
                <RefreshCw size={14} className="animate-spin text-primary" />
                Loading history logs...
              </div>
            </div>
          ) : filtered.length ? filtered.map(h => (
            <div key={h.id} className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-gray-400 text-[10px]">{h.id.slice(0, 10)}...</span>
                    <span className={`px-2 py-0.5 rounded font-bold text-[8px] uppercase flex-shrink-0
                      ${h.type === 'job_card' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-purple-50 text-purple-600 border border-purple-100'}`}>
                      {h.type}
                    </span>
                  </div>
                  <h3 className="font-semibold text-dark text-sm">{h.customer_display_name || h.customer_name || 'Walk-in Guest'}</h3>
                  <p className="text-xs text-gray-500">{new Date(h.created_at).toLocaleDateString('en-GB')} {new Date(h.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <div className="font-bold text-dark text-sm">{fmt(h.total)}</div>
                  <div className="text-xs text-gray-400">Total Cost</div>
                </div>
              </div>
              
              <div className="text-xs">
                <span className="text-gray-400 block">Job Card Reference</span>
                <span className="font-mono text-gray-500">{h.tracking_number || 'None'}</span>
              </div>
              
              <button onClick={() => setViewing(h)}
                className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-lg transition-all">
                <Eye size={12} /> View Details
              </button>
            </div>
          )) : (
            <div className="text-center py-10 text-gray-400">
              No past checkouts logged
            </div>
          )}
        </div>
      </div>

      <ReceiptModal receipt={viewing} onClose={() => setViewing(null)} />
    </div>
  )
}

// ── MAIN STOCKKEEPER DASHBOARD ───────────────────────────────────────────────
export default function StockKeeperDashboard() {
  const { user, logout } = useAuth()
  const [section, setSection] = useState('checkout')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const res = await api.get('/notifications')
        setNotifications(res.data.data || [])
        setUnreadCount(res.data.data?.filter(n => !n.is_read).length || 0)
      } catch (err) {
        console.log('Failed to load notifications')
      }
    }
    loadNotifications()
  }, [])

  const getSectionTitle = () => {
    switch (section) {
      case 'checkout': return 'Stock Checkout Outlet'
      case 'stock': return 'Inventory Stock Levels'
      case 'history': return 'Checkout History Logs'
      default: return 'Dashboard'
    }
  }

  const renderContent = () => {
    switch (section) {
      case 'checkout': return <CheckoutSection />
      case 'stock': return <StockOverviewSection />
      case 'history': return <CheckoutHistorySection />
      default: return null
    }
  }

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Header bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#1A1A2E] border-b border-white/5 flex items-center justify-between px-4 lg:px-6">
        {/* Left side - Brand and mobile menu */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger menu */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu size={18} />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black text-xs">AM</div>
            <span className="font-black text-white text-base tracking-tight">
              AutoMedic <span className="text-primary font-normal">Stock</span>
            </span>
          </div>
        </div>

        {/* Right side - User info and notifications */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative">
            <button className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors">
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          <span className="bg-primary/20 text-primary border border-primary/25 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full hidden sm:block">
            Stock Keeper
          </span>
          <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white font-bold text-xs capitalize">
            {user?.name?.charAt(0) || 'SK'}
          </div>
        </div>
      </header>

      {/* Main panel layout */}
      <div className="flex pt-16 flex-1 min-h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside className={`
          w-[220px] bg-[#1A1A2E] flex flex-col py-4 px-3 border-r border-white/5 fixed top-16 left-0 bottom-0 z-40 transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}>
          {/* Mobile sidebar header */}
          <div className="flex items-center justify-between mb-4 lg:hidden">
            <span className="text-white font-semibold text-sm">Menu</span>
            <button
              onClick={closeSidebar}
              className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <nav className="flex flex-col gap-1 flex-1">
            {[
              { id: 'checkout', icon: ShoppingCart, label: 'Stock Checkout' },
              { id: 'stock',    icon: Package,      label: 'Stock Overview' },
              { id: 'history',  icon: History,      label: 'Checkout History' },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => {
                  setSection(id)
                  closeSidebar()
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all
                  ${section === id
                    ? 'bg-primary text-white shadow-md shadow-primary/10'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}>
                <Icon size={14} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="border-t border-white/5 pt-3">
            <button onClick={logout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-all">
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Content body */}
        <main className="flex-1 p-4 lg:p-6 xl:p-8 bg-[#FAFAF8] overflow-y-auto lg:ml-[220px]">
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <h1 className="font-display text-xl lg:text-2xl text-dark font-black tracking-tight">{getSectionTitle()}</h1>
              <p className="text-xs text-gray-400 mt-1">Logged in as {user?.name || 'Stock Keeper'} · {user?.email}</p>
            </div>
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}
