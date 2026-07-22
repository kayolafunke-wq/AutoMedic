import { useState, useEffect } from 'react'
import { FileText, X, Printer, CheckCircle, Clock, AlertCircle, AlertTriangle, Search, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../../services/api'
import { useGarageSettings } from '../../hooks/useGarageSettings'
import Pagination from '../../components/ui/Pagination'

const PAGE_SIZE = 15

const fmt = (n) => {
  const v = Number(n || 0)
  if (v === 0) return 'MK 0'
  if (v >= 1_000_000) return `MK ${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000)     return `MK ${(v / 1_000).toFixed(1)}K`
  return `MK ${v.toLocaleString()}`
}

const STATUS_STYLES = {
  unpaid:  'bg-red-50 text-red-600 border border-red-100',
  partial: 'bg-amber-50 text-amber-600 border border-amber-100',
  paid:    'bg-green-50 text-green-600 border border-green-100',
}

// ── INVOICE DETAIL / PRINT MODAL ─────────────────────────────────────────────
function InvoiceModal({ invoice, onClose, onStatusChange }) {
  const { settings } = useGarageSettings()
  const [updating, setUpdating] = useState(false)
  const [toast, setToast]       = useState('')

  const subtotal   = Number(invoice.subtotal || 0)
  const tax        = Number(invoice.tax || 0)
  const total      = Number(invoice.total || 0)
  const lineItems  = (() => {
    try {
      const p = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items
      if (Array.isArray(p) && p.length) return p
    } catch {}
    return [{ description: invoice.service_name || 'Service', qty: 1, unit_price: subtotal }]
  })()

  const markAs = async (status) => {
    setUpdating(true)
    try {
      await api.patch(`/invoices/${invoice.id}/status`, { status })
      onStatusChange(invoice.id, status)
      setToast(`Invoice marked as ${status}`)
      setTimeout(() => setToast(''), 2500)
    } catch (err) {
      setToast('Error: ' + (err.response?.data?.message || err.message))
      setTimeout(() => setToast(''), 3000)
    } finally { setUpdating(false) }
  }

  const handlePrint = () => {
    const rows = lineItems.map(i => {
      const lt = Number(i.qty || 1) * Number(i.unit_price || 0)
      return `<tr><td>${i.description}</td><td style="text-align:center">${i.qty||1}</td>
        <td style="text-align:right">MK ${Number(i.unit_price||0).toLocaleString()}</td>
        <td style="text-align:right;font-weight:700">MK ${lt.toLocaleString()}</td></tr>`
    }).join('')
    const isPaid = invoice.status === 'paid'
    const w = window.open('', '_blank', 'width=820,height=960')
    w.document.write(`<!DOCTYPE html><html><head><title>Invoice ${invoice.invoice_number}</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;padding:48px;color:#1A1A2E;font-size:13px}
    .hdr{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:2px solid #1A1A2E;margin-bottom:28px}
    .logo{width:44px;height:44px;background:#B8860B;color:#fff;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:14px}
    .g2{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-bottom:24px}
    table{width:100%;border-collapse:collapse;margin:20px 0}
    th{background:#f5f3ee;padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#888}
    td{padding:11px 12px;border-bottom:1px solid #eee;font-size:12px}
    .tot{width:260px;margin-left:auto}.tr{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;font-size:12px}
    .tf{border-top:2px solid #1A1A2E;border-bottom:none;font-size:14px;font-weight:900;padding-top:10px}
    .foot{margin-top:32px;text-align:center;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:16px}
    @media print{body{padding:20px}}</style></head><body>
    <div class="hdr">
      <div style="display:flex;align-items:center;gap:10px">
        <div class="logo">AM</div>
        <div><strong style="font-size:18px">${settings.garage_name}</strong><br/><span style="font-size:11px;color:#888">${settings.address} · ${settings.phone}</span></div>
      </div>
      <div style="text-align:right">
        <div style="font-size:24px;font-weight:900">INVOICE</div>
        <div style="color:#B8860B;font-weight:700;font-size:15px;margin:4px 0">#${invoice.invoice_number}</div>
        <div style="font-size:11px;color:#888">${new Date(invoice.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</div>
        <span style="display:inline-block;margin-top:6px;padding:3px 12px;border-radius:50px;font-size:11px;font-weight:700;background:${isPaid?'#e8f5e9':'#fff3e0'};color:${isPaid?'#2e7d32':'#e65100'}">${isPaid?'PAID':'UNPAID'}</span>
      </div>
    </div>
    <div class="g2">
      <div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#888;margin-bottom:8px">From</div>
        <strong>${settings.garage_name}</strong><br/>${settings.address}<br/>${settings.phone}<br/>${settings.email}</div>
      <div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#888;margin-bottom:8px">Bill To</div>
        <strong>${invoice.customer_name||'Customer'}</strong><br/>${invoice.customer_phone||''}</div>
    </div>
    <div style="background:#f5f3ee;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:12px">
      <strong>Vehicle:</strong> ${invoice.make||''} ${invoice.model||''} &nbsp;·&nbsp;
      <strong>Reg:</strong> ${invoice.registration_number||''} &nbsp;·&nbsp;
      <strong>Booking:</strong> ${invoice.tracking_number||''}
    </div>
    <table><thead><tr><th>Description</th><th>Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <div class="tot">
      <div class="tr"><span>Subtotal</span><span>MK ${subtotal.toLocaleString()}</span></div>
      <div class="tr"><span>VAT (16.5%)</span><span>MK ${tax.toLocaleString()}</span></div>
      <div class="tr tf"><span>TOTAL DUE</span><span style="color:#B8860B">MK ${total.toLocaleString()}</span></div>
    </div>
    <div class="foot"><p>Thank you for choosing AutoMedic — Lilongwe's Premier Garage</p></div>
    </body></html>`)
    w.document.close(); w.focus(); setTimeout(() => w.print(), 500)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-4 sm:pt-10 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl mb-8" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 bg-[#B8860B]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText size={16} className="text-[#B8860B]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[#1A1A2E] text-sm truncate">#{invoice.invoice_number}</p>
              <p className="text-xs text-gray-400 truncate">{invoice.customer_name} · {invoice.tracking_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-[10px] font-bold px-2 sm:px-3 py-1.5 rounded-full capitalize ${STATUS_STYLES[invoice.status] || STATUS_STYLES.unpaid}`}>
              {invoice.status}
            </span>
            <button onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-[#1A1A2E] text-white text-xs font-semibold rounded-full hover:bg-black transition-colors">
              <Printer size={12} /> <span className="hidden sm:inline">Print</span>
            </button>
            <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6">
          {/* From / To */}
          <div className="flex justify-between items-start mb-6 pb-5 border-b-2 border-[#1A1A2E]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-[#B8860B] rounded-xl flex items-center justify-center text-white font-black text-sm">AM</div>
              <div><p className="font-black text-[#1A1A2E]">{settings.garage_name}</p><p className="text-xs text-gray-400">{settings.address}</p></div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-[#1A1A2E]">INVOICE</p>
              <p className="text-[#B8860B] font-bold text-sm">#{invoice.invoice_number}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(invoice.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">From</p>
              <p className="font-bold text-[#1A1A2E] text-sm">{settings.garage_name}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{settings.address}<br/>{settings.phone}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Bill To</p>
              <p className="font-bold text-[#1A1A2E] text-sm">{invoice.customer_name}</p>
              <p className="text-xs text-gray-500 mt-1">{invoice.customer_phone || '—'}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5 text-xs text-gray-600">
            <div className="flex flex-wrap gap-2 sm:gap-4">
              <span><strong>Vehicle:</strong> {invoice.make} {invoice.model}</span>
              <span><strong>Reg:</strong> {invoice.registration_number}</span>
              <span><strong>Booking:</strong> {invoice.tracking_number}</span>
            </div>
          </div>

          {/* Line items */}
          <div className="overflow-x-auto mb-5">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="bg-gray-50">
                  {['Description','Qty','Unit Price','Total'].map((h,i) => (
                    <th key={h} className={`px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 ${i > 1 ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, i) => {
                  const lt = Number(item.qty || 1) * Number(item.unit_price || 0)
                  return (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="px-3 py-3 text-[#1A1A2E]">{item.description}</td>
                      <td className="px-3 py-3 text-gray-500 text-center">{item.qty || 1}</td>
                      <td className="px-3 py-3 text-gray-500 text-right">MK {Number(item.unit_price || 0).toLocaleString()}</td>
                      <td className="px-3 py-3 font-bold text-[#1A1A2E] text-right">MK {lt.toLocaleString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="ml-auto w-full sm:w-60 space-y-2 mb-6">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="font-semibold">MK {subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">VAT (16.5%)</span><span className="font-semibold">MK {tax.toLocaleString()}</span></div>
            <div className="flex justify-between text-base font-black border-t-2 border-[#1A1A2E] pt-2.5">
              <span>TOTAL DUE</span><span className="text-[#B8860B]">MK {total.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment actions */}
          {toast && (
            <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${toast.includes('marked') || toast.includes('Invoice') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {toast.includes('marked') || toast.includes('Invoice') ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {toast}
            </div>
          )}

          {invoice.status !== 'paid' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={16} className="text-amber-600" />
                <p className="font-bold text-amber-800 text-sm">Confirm Payment Received</p>
              </div>
              <p className="text-xs text-amber-700 mb-4">
                Mark this invoice as paid once you have confirmed the customer has settled the full amount at the counter.
              </p>
              <div className="flex gap-2">
                <button onClick={() => markAs('paid')} disabled={updating}
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-bold rounded-full hover:bg-green-700 transition-colors disabled:opacity-60">
                  <CheckCircle size={14} /> {updating ? 'Updating...' : 'Mark as Paid'}
                </button>
                {invoice.status !== 'partial' && (
                  <button onClick={() => markAs('partial')} disabled={updating}
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-full hover:bg-amber-600 transition-colors disabled:opacity-60">
                    <Clock size={14} /> Partial Payment
                  </button>
                )}
                {invoice.status !== 'unpaid' && (
                  <button onClick={() => markAs('unpaid')} disabled={updating}
                    className="px-5 py-2.5 border border-gray-200 text-gray-500 text-sm font-semibold rounded-full hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-60">
                    Revert to Unpaid
                  </button>
                )}
              </div>
            </div>
          )}

          {invoice.status === 'paid' && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-green-800 text-sm">Payment Confirmed</p>
                <p className="text-xs text-green-600 mt-0.5">This invoice has been marked as paid.</p>
              </div>
              <button onClick={() => markAs('unpaid')} disabled={updating}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors font-medium">
                Revert
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── MAIN INVOICES PAGE ────────────────────────────────────────────────────────
export default function InvoicesManagement() {
  const { settings } = useGarageSettings()
  const [invoices, setInvoices]       = useState([])
  const [loading,  setLoading]        = useState(true)
  const [selected, setSelected]       = useState(null)
  const [filter,   setFilter]         = useState('all')
  const [search,   setSearch]         = useState('')
  const [page,     setPage]           = useState(1)
  const [toast,    setToast]          = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    api.get('/invoices')
      .then(r => setInvoices(r.data.data || []))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false))
  }, [])

  // Called from modal when status changes — update local list without reload
  const handleStatusChange = (id, newStatus) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: newStatus } : inv))
    // Also update the modal's invoice object
    setSelected(prev => prev && prev.id === id ? { ...prev, status: newStatus } : prev)
    showToast(`Invoice ${newStatus}`)
  }

  const filtered = invoices.filter(inv => {
    const matchFilter = filter === 'all' || inv.status === filter
    const matchSearch = !search ||
      (inv.invoice_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (inv.customer_name  || '').toLowerCase().includes(search.toLowerCase()) ||
      (inv.tracking_number|| '').toLowerCase().includes(search.toLowerCase()) ||
      (`${inv.make} ${inv.model}`).toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // Reset to page 1 when filter/search changes
  const setFilterAndReset = (f) => { setFilter(f); setPage(1) }
  const setSearchAndReset = (s) => { setSearch(s); setPage(1) }

  // KPIs
  const totalRevenue  = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total || 0), 0)
  const unpaidCount   = invoices.filter(i => i.status === 'unpaid').length
  const unpaidAmount  = invoices.filter(i => i.status === 'unpaid').reduce((s, i) => s + Number(i.total || 0), 0)
  const partialCount  = invoices.filter(i => i.status === 'partial').length

  return (
    <div>
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1A1A2E] text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl">
          {toast}
        </div>
      )}
      {selected && <InvoiceModal invoice={selected} onClose={() => setSelected(null)} onStatusChange={handleStatusChange} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="font-display text-xl sm:text-2xl text-[#1A1A2E]">Invoices</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track payments and confirm receipts</p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          [CheckCircle, fmt(totalRevenue),  'Total Collected',    'bg-green-50 text-green-600',  'paid'],
          [AlertCircle, unpaidCount,        'Unpaid Invoices',    'bg-red-50 text-red-500',       'unpaid'],
          [DollarSign,  fmt(unpaidAmount),  'Outstanding Amount', 'bg-orange-50 text-orange-500', 'unpaid'],
          [Clock,       partialCount,       'Partial Payments',   'bg-amber-50 text-amber-600',   'partial'],
        ].map(([Icon, val, label, cls, f], i) => (
          <button key={i} onClick={() => setFilter(f)}
            className={`bg-white rounded-2xl p-4 sm:p-5 shadow-sm border flex items-center gap-2 sm:gap-3 text-left transition-all hover:shadow-md hover:-translate-y-0.5
              ${filter === f ? 'border-[#B8860B]/40 shadow-md' : 'border-gray-50'}`}>
            <div className={`w-9 h-9 sm:w-11 sm:h-11 ${cls} rounded-xl flex items-center justify-center flex-shrink-0`}><Icon size={16} /></div>
            <div className="min-w-0 flex-1">
              <div className="text-lg sm:text-xl font-black text-[#1A1A2E] leading-none truncate">{val}</div>
              <div className="text-xs text-gray-400 mt-1 truncate">{label}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5 items-stretch sm:items-center">
        <div className="flex gap-1.5 bg-white rounded-xl p-1 shadow-sm border border-gray-100 overflow-x-auto">
          {['all','unpaid','partial','paid'].map(f => (
            <button key={f} onClick={() => setFilterAndReset(f)}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all whitespace-nowrap
                ${filter === f ? 'bg-[#B8860B] text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}>
              {f === 'all' ? 'All' : f}
              <span className="ml-1.5 opacity-70">
                {f === 'all' ? invoices.length : invoices.filter(i => i.status === f).length}
              </span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-full sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearchAndReset(e.target.value)}
            placeholder="Search invoice, customer..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#B8860B] bg-white" />
        </div>
      </div>

      {/* Unpaid alert banner */}
      {unpaidCount > 0 && filter === 'all' && (
        <div className="flex items-center gap-4 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 mb-5">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0 text-red-600 font-black text-lg">{unpaidCount}</div>
          <div className="flex-1">
            <p className="font-bold text-red-700 text-sm">Outstanding Payments</p>
            <p className="text-xs text-red-600/80 mt-0.5">{unpaidCount} invoice{unpaidCount > 1 ? 's' : ''} totalling <strong>{fmt(unpaidAmount)}</strong> are awaiting payment confirmation.</p>
          </div>
          <button onClick={() => setFilter('unpaid')} className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-full hover:bg-red-600 transition-colors">
            View Unpaid
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
        {/* Mobile card view for small screens */}
        <div className="block lg:hidden">
          {loading ? (
            <div className="px-4 py-10 text-center text-gray-400">
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
                Loading invoices...
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <div className="flex flex-col items-center gap-2">
                <FileText size={32} className="text-gray-200" />
                <p className="text-gray-400 text-sm">No invoices found</p>
              </div>
            </div>
          ) : paginated.map((inv) => (
            <div key={inv.id}
              className={`border-b border-gray-50 p-4 hover:bg-gray-50/50 transition-colors
                ${inv.status === 'unpaid' ? 'bg-red-50/20' : ''}`}
              onClick={() => setSelected(inv)}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-bold text-[#B8860B] text-sm">#{inv.invoice_number}</span>
                  <p className="font-medium text-[#1A1A2E] text-sm mt-1">{inv.customer_name}</p>
                </div>
                <div className="text-right">
                  <span className="font-black text-[#1A1A2E] text-base">{fmt(inv.total)}</span>
                  <span className={`block text-[10px] font-bold px-2.5 py-1 rounded-full capitalize mt-1 ${STATUS_STYLES[inv.status] || STATUS_STYLES.unpaid}`}>
                    {inv.status}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <div>{inv.make} {inv.model} • {inv.registration_number}</div>
                <div className="font-mono text-[#B8860B] font-bold">{inv.tracking_number}</div>
                <div>{new Date(inv.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</div>
              </div>
              {inv.status === 'unpaid' && (
                <p className="text-[10px] text-red-500 font-semibold mt-2 flex items-center gap-1">
                  <AlertTriangle size={10} />
                  Awaiting payment
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Desktop table view for large screens */}
        <table className="w-full text-sm hidden lg:table">
          <thead>
            <tr className="bg-gray-50/80">
              {['Invoice #','Customer','Vehicle','Booking','Amount','Status','Date','Action'].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
                  Loading invoices...
                </div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-16 text-center">
                <div className="flex flex-col items-center gap-2">
                  <FileText size={32} className="text-gray-200" />
                  <p className="text-gray-400 text-sm">No invoices found</p>
                </div>
              </td></tr>
            ) : paginated.map((inv) => (
              <tr key={inv.id}
                className={`border-t border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer
                  ${inv.status === 'unpaid' ? 'bg-red-50/20 hover:bg-red-50/40' : ''}`}
                onClick={() => setSelected(inv)}>
                <td className="px-4 py-3.5">
                  <span className="font-bold text-[#B8860B] text-xs">{inv.invoice_number}</span>
                </td>
                <td className="px-4 py-3.5">
                  <p className="font-medium text-[#1A1A2E] text-sm">{inv.customer_name}</p>
                  <p className="text-xs text-gray-400">{inv.customer_phone || '—'}</p>
                </td>
                <td className="px-4 py-3.5 text-gray-500 text-xs">{inv.make} {inv.model}<br/>{inv.registration_number}</td>
                <td className="px-4 py-3.5 text-xs font-mono text-[#B8860B] font-bold">{inv.tracking_number}</td>
                <td className="px-4 py-3.5">
                  <span className="font-black text-[#1A1A2E] text-base">{fmt(inv.total)}</span>
                  {inv.status === 'unpaid' && (
                    <p className="text-[10px] text-red-500 font-semibold mt-0.5 flex items-center gap-1">
                      <AlertTriangle size={10} />
                      Awaiting payment
                    </p>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[inv.status] || STATUS_STYLES.unpaid}`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-xs text-gray-400">
                  {new Date(inv.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
                </td>
                <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
                  <div className="flex gap-1.5">
                    <button onClick={() => setSelected(inv)}
                      className="text-[10px] font-semibold text-[#B8860B] border border-[#B8860B]/30 px-2.5 py-1.5 rounded-lg hover:bg-[#B8860B]/5 transition-colors">
                      View
                    </button>
                    {inv.status !== 'paid' && (
                      <button
                        onClick={async () => {
                          try {
                            await api.patch(`/invoices/${inv.id}/status`, { status: 'paid' })
                            handleStatusChange(inv.id, 'paid')
                          } catch { showToast('Failed to update') }
                        }}
                        className="text-[10px] font-semibold text-green-600 border border-green-200 px-2.5 py-1.5 rounded-lg hover:bg-green-50 transition-colors whitespace-nowrap flex items-center gap-1">
                        <CheckCircle size={10} />
                        Paid
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          {/* Footer totals */}
          {filtered.length > 0 && (
            <tfoot>
              <tr className="bg-[#1A1A2E]">
                <td colSpan={4} className="px-4 py-3.5 text-white/60 text-xs font-semibold">{filtered.length} invoice{filtered.length !== 1 ? 's' : ''}</td>
                <td className="px-4 py-3.5 font-black text-[#B8860B] text-base">
                  {fmt(filtered.reduce((s, i) => s + Number(i.total || 0), 0))}
                </td>
                <td colSpan={3} className="px-4 py-3.5 text-white/40 text-xs">
                  Paid: {fmt(filtered.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total || 0), 0))} &nbsp;|&nbsp;
                  Outstanding: {fmt(filtered.filter(i => i.status !== 'paid').reduce((s, i) => s + Number(i.total || 0), 0))}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <Pagination
        page={safePage} totalPages={totalPages} total={filtered.length}
        pageSize={PAGE_SIZE} onPage={setPage} label="invoice" />
    </div>
  )
}
