import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import {
  Package, TrendingUp, TrendingDown, Settings2, Search, X,
  ChevronDown, AlertTriangle, CheckCircle, RefreshCw, ArrowUpCircle,
  ArrowDownCircle, SlidersHorizontal, Calendar, User, FileText, BarChart3
} from 'lucide-react'
import Pagination from '../../components/ui/Pagination'

const LEDGER_PAGE_SIZE  = 12
const SUMMARY_PAGE_SIZE = 12

const TYPE_META = {
  stock_in:   { label: 'Stock In',   icon: ArrowUpCircle,   bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-200',  dot: 'bg-green-500' },
  stock_out:  { label: 'Stock Out',  icon: ArrowDownCircle, bg: 'bg-red-50',    text: 'text-red-600',    border: 'border-red-200',    dot: 'bg-red-500'   },
  adjustment: { label: 'Adjustment', icon: Settings2,        bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-200',   dot: 'bg-blue-500'  },
}

const fmtDate = (d) => d ? new Date(d).toLocaleString('en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'
const fmtQty  = (n, type) => {
  const abs = Math.abs(n)
  if (type === 'stock_in')   return `+${abs}`
  if (type === 'stock_out')  return `-${abs}`
  return n > 0 ? `+${n}` : `${n}`
}

export default function InventoryTracking() {
  const [logs,        setLogs]        = useState([])
  const [summary,     setSummary]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [tab,         setTab]         = useState('ledger') // 'ledger' | 'summary'
  const [search,      setSearch]      = useState('')
  const [typeFilter,  setTypeFilter]  = useState('all')
  const [productFilter, setProductFilter] = useState('')
  const [fromDate,    setFromDate]    = useState('')
  const [toDate,      setToDate]      = useState('')
  const [adjustModal, setAdjustModal] = useState(null)
  const [adjQty,      setAdjQty]      = useState('')
  const [adjReason,   setAdjReason]   = useState('')
  const [adjSaving,   setAdjSaving]   = useState(false)
  const [toast,       setToast]       = useState('')
  const [products,    setProducts]    = useState([])
  const [ledgerPage,  setLedgerPage]  = useState(1)
  const [summaryPage, setSummaryPage] = useState(1)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: 500 })
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (productFilter)        params.set('product_id', productFilter)
      if (fromDate)             params.set('from', fromDate)
      if (toDate)               params.set('to', toDate)

      const [logsRes, sumRes, prodRes] = await Promise.all([
        api.get(`/inventory/logs?${params}`),
        api.get('/inventory/summary'),
        api.get('/products'),
      ])
      setLogs(logsRes.data.data || [])
      setSummary(sumRes.data.data || [])
      setProducts(prodRes.data.data || [])
    } catch { }
    setLoading(false)
  }, [typeFilter, productFilter, fromDate, toDate])

  useEffect(() => { load() }, [load])

  const adjust = async () => {
    if (!adjQty || Number(adjQty) < 0) return showToast('Enter a valid quantity')
    setAdjSaving(true)
    try {
      await api.post('/inventory/adjust', {
        product_id:   adjustModal.id,
        new_quantity: Number(adjQty),
        reason:       adjReason || 'Manual adjustment',
      })
      showToast(`Stock adjusted for ${adjustModal.name}`)
      setAdjustModal(null); setAdjQty(''); setAdjReason('')
      load()
    } catch (err) {
      showToast('Failed: ' + (err.response?.data?.message || err.message))
    } finally { setAdjSaving(false) }
  }

  // KPIs from summary
  const totalIn    = summary.reduce((s, p) => s + Number(p.total_in  || 0), 0)
  const totalOut   = summary.reduce((s, p) => s + Number(p.total_out || 0), 0)
  const lowStock   = summary.filter(p => p.stock_quantity > 0 && p.stock_quantity < 5).length
  const outStock   = summary.filter(p => p.stock_quantity === 0).length

  const filtered = logs.filter(l => {
    if (!search) return true
    return (l.product_name || '').toLowerCase().includes(search.toLowerCase()) ||
           (l.reason       || '').toLowerCase().includes(search.toLowerCase()) ||
           (l.created_by_name || '').toLowerCase().includes(search.toLowerCase())
  })

  // Pagination computed values
  const ledgerTotal  = filtered.length
  const ledgerPages  = Math.max(1, Math.ceil(ledgerTotal / LEDGER_PAGE_SIZE))
  const safeLedger   = Math.min(ledgerPage, ledgerPages)
  const paginatedLog = filtered.slice((safeLedger - 1) * LEDGER_PAGE_SIZE, safeLedger * LEDGER_PAGE_SIZE)

  const summaryTotal = summary.length
  const summaryPages = Math.max(1, Math.ceil(summaryTotal / SUMMARY_PAGE_SIZE))
  const safeSummary  = Math.min(summaryPage, summaryPages)
  const paginatedSum = summary.slice((safeSummary - 1) * SUMMARY_PAGE_SIZE, safeSummary * SUMMARY_PAGE_SIZE)

  // Reset pages when filters/search change
  const handleSearch = (v) => { setSearch(v); setLedgerPage(1) }
  const handleTypeFilter = (v) => { setTypeFilter(v); setLedgerPage(1) }
  const handleProductFilter = (v) => { setProductFilter(v); setLedgerPage(1) }
  const handleFromDate = (v) => { setFromDate(v); setLedgerPage(1) }
  const handleToDate = (v) => { setToDate(v); setLedgerPage(1) }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl flex items-center gap-2
          ${toast.includes('adjusted') || toast.includes('Success') ? 'bg-[#1A1A2E] text-white' : 'bg-red-500 text-white'}`}>
          {toast.includes('adjusted') || toast.includes('Success') ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-xl sm:text-2xl text-[#1A1A2E]">Inventory Tracking</h1>
          <p className="text-sm text-gray-400 mt-0.5">Full audit trail of every stock movement</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-full hover:bg-gray-50 transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          [ArrowUpCircle,   totalIn,    'Total Stock In',   'bg-green-50 text-green-600'],
          [ArrowDownCircle, totalOut,   'Total Stock Out',  'bg-red-50 text-red-600'],
          [AlertTriangle,   lowStock,   'Low Stock Items',  'bg-amber-50 text-amber-600'],
          [Package,         outStock,   'Out of Stock',     'bg-gray-100 text-gray-500'],
        ].map(([Icon, val, label, cls], i) => (
          <div key={i} className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-50 flex items-center gap-2 sm:gap-3">
            <div className={`w-9 h-9 sm:w-11 sm:h-11 ${cls} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg sm:text-2xl font-black text-[#1A1A2E] leading-none">{val}</div>
              <div className="text-xs text-gray-400 mt-1 truncate">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5 w-full sm:w-fit overflow-x-auto">
        {[['ledger', 'Movement Ledger', FileText],['summary', 'Product Summary', BarChart3]].map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 sm:flex-none px-4 sm:px-5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2
              ${tab === key ? 'bg-white text-[#B8860B] shadow' : 'text-gray-500 hover:text-gray-700'}`}>
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── LEDGER TAB ─────────────────────────────────────────────────── */}
      {tab === 'ledger' && (
        <>
          {/* Filters */}
          <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-3 mb-5 sm:items-center">
            {/* Search */}
            <div className="relative order-1">
              <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input value={search} onChange={e => handleSearch(e.target.value)}
                placeholder="Search product, reason, user..."
                className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#B8860B] bg-white w-full sm:w-56" />
              {search && <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X size={12} /></button>}
            </div>

            {/* Type filter */}
            <div className="flex gap-1.5 order-2 overflow-x-auto pb-2 sm:pb-0">
              {[['all','All'],['stock_in','In'],['stock_out','Out'],['adjustment','Adjust']].map(([val, label]) => (
                <button key={val} onClick={() => handleTypeFilter(val)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all border whitespace-nowrap
                    ${typeFilter === val ? 'bg-[#B8860B] text-white border-[#B8860B]' : 'bg-white border-gray-200 text-gray-500 hover:border-[#B8860B] hover:text-[#B8860B]'}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Product filter */}
            <select value={productFilter} onChange={e => handleProductFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#B8860B] bg-white w-full sm:w-auto order-3">
              <option value="">All Products</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            {/* Date range */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 order-4">
              <div className="flex items-center gap-2">
                <Calendar size={13} className="text-gray-400 flex-shrink-0" />
                <input type="date" value={fromDate} onChange={e => handleFromDate(e.target.value)}
                  className="flex-1 sm:flex-none px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#B8860B] bg-white" />
              </div>
              <span className="text-gray-400 text-xs hidden sm:block">to</span>
              <input type="date" value={toDate} onChange={e => handleToDate(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#B8860B] bg-white" />
              {(fromDate || toDate) && (
                <button onClick={() => { setFromDate(''); setToDate(''); setLedgerPage(1) }} className="text-gray-400 hover:text-red-500 transition-colors p-1"><X size={13} /></button>
              )}
            </div>
          </div>

          {/* Log table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
            <div className="px-4 sm:px-5 py-3 border-b border-gray-100 flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {filtered.length} movement{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-7 h-7 border-4 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <Package size={32} className="text-gray-200 mb-3" />
                <p className="text-gray-400 text-sm">No movements found</p>
              </div>
            ) : (
              <>
                {/* Mobile card view */}
                <div className="block lg:hidden">
                  {paginatedLog.map((log, i) => {
                    const meta = TYPE_META[log.type] || TYPE_META.adjustment
                    const Icon = meta.icon
                    return (
                      <div key={log.id} className="border-t border-gray-50 p-4 hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${meta.bg} ${meta.text} ${meta.border}`}>
                              <Icon size={10} />{meta.label}
                            </span>
                            <span className={`text-sm font-black ${log.type === 'stock_in' ? 'text-green-600' : log.type === 'stock_out' ? 'text-red-500' : Number(log.qty_change) >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>
                              {fmtQty(log.qty_change, log.type)}
                            </span>
                          </div>
                          <div className="text-right text-xs">
                            <div className="text-gray-600 font-mono">
                              <span className="text-gray-400">{log.qty_before}</span>
                              <span className="mx-1.5 text-gray-300">→</span>
                              <span className={`font-bold ${log.qty_after === 0 ? 'text-red-500' : log.qty_after < 5 ? 'text-amber-500' : 'text-gray-700'}`}>
                                {log.qty_after}
                              </span>
                            </div>
                            <div className="text-gray-400 mt-1">{fmtDate(log.created_at)}</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="font-semibold text-[#1A1A2E] text-sm">{log.product_name || '—'}</p>
                            {log.product_category && <p className="text-[10px] text-gray-400 capitalize">{log.product_category}</p>}
                          </div>
                          {log.reason && (
                            <p className="text-xs text-gray-500">{log.reason}</p>
                          )}
                          {log.created_by_name && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <div className="w-5 h-5 bg-[#B8860B]/10 text-[#B8860B] rounded-full flex items-center justify-center font-black text-[9px] flex-shrink-0">
                                {log.created_by_name.charAt(0)}
                              </div>
                              {log.created_by_name}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Desktop table view */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-sm min-w-[1000px]">
                    <thead>
                      <tr className="bg-gray-50/80">
                        {['Type','Product','Qty Change','Before → After','Reason','Reference','By','Date'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedLog.map((log, i) => {
                        const meta = TYPE_META[log.type] || TYPE_META.adjustment
                        const Icon = meta.icon
                        return (
                          <tr key={log.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                            {/* Type badge */}
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${meta.bg} ${meta.text} ${meta.border}`}>
                                <Icon size={10} />{meta.label}
                              </span>
                            </td>
                            {/* Product */}
                            <td className="px-4 py-3">
                              <p className="font-semibold text-[#1A1A2E] text-xs">{log.product_name || '—'}</p>
                              {log.product_category && <p className="text-[10px] text-gray-400 capitalize">{log.product_category}</p>}
                            </td>
                            {/* Qty change */}
                            <td className="px-4 py-3">
                              <span className={`text-sm font-black ${log.type === 'stock_in' ? 'text-green-600' : log.type === 'stock_out' ? 'text-red-500' : Number(log.qty_change) >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>
                                {fmtQty(log.qty_change, log.type)}
                              </span>
                            </td>
                            {/* Before → After */}
                            <td className="px-4 py-3 text-xs text-gray-600 font-mono">
                              <span className="text-gray-400">{log.qty_before}</span>
                              <span className="mx-1.5 text-gray-300">→</span>
                              <span className={`font-bold ${log.qty_after === 0 ? 'text-red-500' : log.qty_after < 5 ? 'text-amber-500' : 'text-gray-700'}`}>
                                {log.qty_after}
                              </span>
                            </td>
                            {/* Reason */}
                            <td className="px-4 py-3 text-xs text-gray-500 max-w-[180px] truncate" title={log.reason}>{log.reason || '—'}</td>
                            {/* Reference */}
                            <td className="px-4 py-3 text-[10px] text-gray-400 font-mono truncate max-w-[80px]" title={log.reference}>
                              {log.reference ? log.reference.slice(0, 8) + '…' : '—'}
                            </td>
                            {/* By */}
                            <td className="px-4 py-3">
                              {log.created_by_name
                                ? <span className="flex items-center gap-1.5 text-xs text-gray-600">
                                    <div className="w-5 h-5 bg-[#B8860B]/10 text-[#B8860B] rounded-full flex items-center justify-center font-black text-[9px] flex-shrink-0">
                                      {log.created_by_name.charAt(0)}
                                    </div>
                                    {log.created_by_name}
                                  </span>
                                : <span className="text-gray-300 text-xs">System</span>}
                            </td>
                            {/* Date */}
                            <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDate(log.created_at)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
          <Pagination
            page={safeLedger} totalPages={ledgerPages} total={ledgerTotal}
            pageSize={LEDGER_PAGE_SIZE} onPage={setLedgerPage} label="movement" />
        </>
      )}

      {/* ── SUMMARY TAB ────────────────────────────────────────────────── */}
      {tab === 'summary' && (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
            <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-bold text-[#1A1A2E] text-sm">Per-Product Stock Summary</h2>
              <span className="text-xs text-gray-400">{summary.length} products</span>
            </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-7 h-7 border-4 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="block lg:hidden">
                {paginatedSum.map((p, i) => (
                  <div key={p.id} className="border-t border-gray-50 p-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#1A1A2E] text-sm truncate">{p.name}</p>
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{p.category || '—'}</span>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span className={`font-black text-lg ${p.stock_quantity === 0 ? 'text-red-500' : p.stock_quantity < 5 ? 'text-amber-500' : 'text-gray-800'}`}>
                            {p.stock_quantity}
                          </span>
                          {p.stock_quantity === 0 && <span className="text-[10px] bg-red-50 text-red-500 border border-red-100 px-1.5 py-0.5 rounded font-semibold">Out</span>}
                          {p.stock_quantity > 0 && p.stock_quantity < 5 && <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded font-semibold">Low</span>}
                          {p.stock_quantity >= 5 && <CheckCircle size={13} className="text-green-400" />}
                        </div>
                        <button onClick={() => { setAdjustModal(p); setAdjQty(String(p.stock_quantity)); setAdjReason('') }}
                          className="flex items-center gap-1 text-[10px] font-semibold text-[#B8860B] border border-[#B8860B]/30 px-2.5 py-1.5 rounded-lg hover:bg-[#B8860B]/5 transition-colors mt-2">
                          <SlidersHorizontal size={10} /> Adjust
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="text-center">
                        <div className="text-green-600 font-bold">+{p.total_in}</div>
                        <div className="text-gray-400">In</div>
                      </div>
                      <div className="text-center">
                        <div className="text-red-500 font-bold">-{p.total_out}</div>
                        <div className="text-gray-400">Out</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-semibold ${Number(p.total_adjusted) === 0 ? 'text-gray-300' : 'text-blue-600'}`}>
                          {Number(p.total_adjusted) > 0 ? '+' : ''}{p.total_adjusted}
                        </div>
                        <div className="text-gray-400">Adj</div>
                      </div>
                    </div>
                    {p.last_movement && (
                      <div className="text-[10px] text-gray-400 mt-2">Last: {fmtDate(p.last_movement)}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop table view */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm min-w-[800px]">
                  <thead>
                    <tr className="bg-gray-50/80">
                      {['Product','Category','Total In','Total Out','Adjustments','Current Stock','Last Movement','Action'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSum.map((p, i) => (
                      <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-[#1A1A2E] text-xs">{p.name}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{p.category || '—'}</span>
                        </td>
                        {/* Total In */}
                        <td className="px-4 py-3.5">
                          <span className="text-green-600 font-bold text-sm">+{p.total_in}</span>
                        </td>
                        {/* Total Out */}
                        <td className="px-4 py-3.5">
                          <span className="text-red-500 font-bold text-sm">-{p.total_out}</span>
                        </td>
                        {/* Adjustments */}
                        <td className="px-4 py-3.5">
                          <span className={`text-xs font-semibold ${Number(p.total_adjusted) === 0 ? 'text-gray-300' : 'text-blue-600'}`}>
                            {Number(p.total_adjusted) > 0 ? '+' : ''}{p.total_adjusted}
                          </span>
                        </td>
                        {/* Current stock */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className={`font-black text-base ${p.stock_quantity === 0 ? 'text-red-500' : p.stock_quantity < 5 ? 'text-amber-500' : 'text-gray-800'}`}>
                              {p.stock_quantity}
                            </span>
                            {p.stock_quantity === 0 && <span className="text-[10px] bg-red-50 text-red-500 border border-red-100 px-1.5 py-0.5 rounded font-semibold">Out</span>}
                            {p.stock_quantity > 0 && p.stock_quantity < 5 && <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded font-semibold">Low</span>}
                            {p.stock_quantity >= 5 && <CheckCircle size={13} className="text-green-400" />}
                          </div>
                        </td>
                        {/* Last movement */}
                        <td className="px-4 py-3.5 text-[10px] text-gray-400">{p.last_movement ? fmtDate(p.last_movement) : 'Never'}</td>
                        {/* Adjust action */}
                        <td className="px-4 py-3.5">
                          <button onClick={() => { setAdjustModal(p); setAdjQty(String(p.stock_quantity)); setAdjReason('') }}
                            className="flex items-center gap-1 text-[10px] font-semibold text-[#B8860B] border border-[#B8860B]/30 px-2.5 py-1.5 rounded-lg hover:bg-[#B8860B]/5 transition-colors">
                            <SlidersHorizontal size={10} /> Adjust
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          </div>
          <Pagination
            page={safeSummary} totalPages={summaryPages} total={summaryTotal}
            pageSize={SUMMARY_PAGE_SIZE} onPage={setSummaryPage} label="product" />
        </>
      )}

      {/* ── ADJUST MODAL ───────────────────────────────────────────────── */}
      {adjustModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm" onClick={() => setAdjustModal(null)}>
          <div className="bg-white rounded-2xl p-5 sm:p-7 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <div className="min-w-0 flex-1 mr-3">
                <h3 className="font-bold text-[#1A1A2E] text-base">Adjust Stock</h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{adjustModal.name}</p>
              </div>
              <button onClick={() => setAdjustModal(null)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 flex-shrink-0">
                <X size={14} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 mb-4 flex justify-between text-sm">
              <span className="text-gray-500">Current stock</span>
              <span className="font-black text-[#1A1A2E]">{adjustModal.stock_quantity} units</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">New Quantity</label>
                <input type="number" min="0" value={adjQty} onChange={e => setAdjQty(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] bg-gray-50 focus:bg-white" />
                {adjQty !== '' && Number(adjQty) !== adjustModal.stock_quantity && (
                  <p className={`text-xs mt-1 font-semibold ${Number(adjQty) > adjustModal.stock_quantity ? 'text-green-600' : 'text-red-500'}`}>
                    {Number(adjQty) > adjustModal.stock_quantity ? '+' : ''}{Number(adjQty) - adjustModal.stock_quantity} units {Number(adjQty) > adjustModal.stock_quantity ? 'added' : 'removed'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Reason</label>
                <input value={adjReason} onChange={e => setAdjReason(e.target.value)}
                  placeholder="e.g. Stock count correction, damaged goods..."
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] bg-gray-50 focus:bg-white" />
              </div>
              <button onClick={adjust} disabled={adjSaving}
                className="w-full py-3 sm:py-3.5 bg-[#B8860B] text-white font-bold rounded-xl hover:bg-[#8B6508] transition-all disabled:opacity-60 text-sm flex items-center justify-center gap-2">
                {adjSaving
                  ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                  : <><SlidersHorizontal size={14} /> Apply Adjustment</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
