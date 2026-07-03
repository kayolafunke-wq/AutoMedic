import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import {
  ArrowLeft, TrendingUp, CheckCircle, Clock, DollarSign,
  ChevronRight, X, Calendar, Car, User, Wrench,
  Package, TrendingDown, Zap, AlertTriangle
} from 'lucide-react'

const fmt = (n) => {
  const v = Number(n || 0)
  if (v === 0) return 'MK 0'
  if (v >= 1_000_000) return `MK ${(v / 1_000_000).toFixed(2)}M`
  if (v >= 1_000)     return `MK ${(v / 1_000).toFixed(1)}K`
  return `MK ${v.toLocaleString()}`
}

// ── DRILL-DOWN MODAL ─────────────────────────────────────────────────────────
function MonthModal({ month, onClose }) {
  const [jobs, setJobs]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/reports/revenue/${month}`)
      .then(r => setJobs(r.data.data || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false))
  }, [month])

  const total = jobs.reduce((s, j) => s + Number(j.final_cost || 0), 0)

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-12 p-4 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl mb-8" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h3 className="font-bold text-[#1A1A2E] text-base">Revenue Details — {month}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{jobs.length} completed job{jobs.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-4 py-1.5 bg-[#B8860B]/10 text-[#B8860B] rounded-full text-sm font-black">{fmt(total)}</div>
            <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="font-semibold text-gray-500">No completed jobs for {month}</p>
              <p className="text-xs text-gray-400 mt-1">Jobs will appear here once marked as completed with a final cost</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((j, i) => (
                <div key={i} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 hover:border-[#B8860B]/30 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-[#B8860B]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Wrench size={15} className="text-[#B8860B]" />
                      </div>
                      <div>
                        <p className="font-bold text-[#1A1A2E] text-sm">{j.tracking_number || '—'}</p>
                        <p className="text-xs text-gray-400">{j.preferred_date || '—'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-[#B8860B] text-base">{fmt(j.final_cost)}</p>
                      <span className="text-[10px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded-full border border-green-100">
                        Completed
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Car size={11} className="text-gray-400 flex-shrink-0" />
                      {j.make} {j.model} · {j.registration_number}
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <User size={11} className="text-gray-400 flex-shrink-0" />
                      {j.customer_name || '—'}
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Wrench size={11} className="text-gray-400 flex-shrink-0" />
                      {j.service_name || '—'}
                    </div>
                  </div>
                  {j.technician_name && (
                    <p className="text-[10px] text-gray-400 mt-2">Technician: <strong className="text-gray-600">{j.technician_name}</strong></p>
                  )}
                </div>
              ))}

              {/* Month total */}
              <div className="flex justify-between items-center bg-[#1A1A2E] text-white rounded-2xl px-5 py-4 mt-4">
                <span className="font-semibold text-sm">Total Revenue — {month}</span>
                <span className="font-black text-[#B8860B] text-lg">{fmt(total)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── PRODUCT MOVEMENT SECTION ─────────────────────────────────────────────────
function ProductMovement() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('fast') // 'fast' | 'slow'

  useEffect(() => {
    api.get('/reports/product-movement')
      .then(r => setData(r.data.data))
      .catch(() => setData({ fast_moving: [], slow_moving: [], all: [] }))
      .finally(() => setLoading(false))
  }, [])

  const fmtP = (n) => n != null ? `MK ${Number(n).toLocaleString()}` : '—'

  const rows = tab === 'fast' ? (data?.fast_moving || []) : (data?.slow_moving || [])

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden mt-6">
      {/* Header + tabs */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-bold text-[#1A1A2E] text-sm flex items-center gap-2">
            <Package size={15} className="text-[#B8860B]" />
            Product &amp; Parts Movement
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Based on stock checkouts in the last 90 days</p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          <button onClick={() => setTab('fast')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all
              ${tab === 'fast' ? 'bg-[#B8860B] text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}>
            <Zap size={11} /> Fast Moving
          </button>
          <button onClick={() => setTab('slow')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all
              ${tab === 'slow' ? 'bg-[#1A1A2E] text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}>
            <TrendingDown size={11} /> Slow Moving
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-3">{tab === 'fast' ? '⚡' : '🐌'}</div>
          <p className="font-semibold text-gray-500 text-sm">
            {tab === 'fast' ? 'No sales recorded in the last 90 days' : 'All products are selling well!'}
          </p>
          <p className="text-xs text-gray-400 mt-1">Data appears once stock checkouts are processed</p>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80">
              {['#', 'Product', 'Category', 'Cost Price', 'Selling Price', 'Margin', 'Qty Sold (90d)', 'Current Stock', 'Revenue'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => {
              const margin = p.cost_price != null && p.selling_price != null
                ? Number(p.selling_price) - Number(p.cost_price) : null
              const marginPct = p.cost_price > 0 && margin != null
                ? Math.round((margin / Number(p.cost_price)) * 100) : null
              return (
                <tr key={p.product_id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black
                      ${tab === 'fast'
                        ? i === 0 ? 'bg-[#B8860B] text-white' : i === 1 ? 'bg-gray-200 text-gray-700' : i === 2 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                        : 'bg-red-50 text-red-400'}`}>
                      {tab === 'fast' ? i + 1 : <AlertTriangle size={10} />}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      {tab === 'fast' && i < 3 && (
                        <span className="text-sm">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                      )}
                      <div>
                        <p className="font-semibold text-[#1A1A2E] text-xs">{p.name}</p>
                        <p className="text-[10px] text-gray-400">{p.transactions} transaction{p.transactions !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{p.category || '—'}</span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500">{p.cost_price != null ? fmtP(p.cost_price) : <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-[#B8860B]">{fmtP(p.selling_price)}</td>
                  <td className="px-4 py-3.5">
                    {margin != null ? (
                      <div>
                        <span className={`text-xs font-bold ${margin >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {margin >= 0 ? '+' : ''}{fmtP(margin)}
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
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-12">
                        <div className={`h-full rounded-full ${tab === 'fast' ? 'bg-[#B8860B]' : 'bg-red-300'}`}
                          style={{ width: `${tab === 'fast' ? Math.min(100, (p.total_qty_sold / (rows[0]?.total_qty_sold || 1)) * 100) : 5}%` }} />
                      </div>
                      <span className={`text-xs font-black ${tab === 'fast' ? 'text-[#B8860B]' : 'text-red-500'}`}>
                        {p.total_qty_sold}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-semibold ${
                      p.stock_quantity === 0 ? 'text-red-500' : p.stock_quantity < 5 ? 'text-amber-500' : 'text-gray-600'
                    }`}>
                      {p.stock_quantity}
                      {p.stock_quantity === 0 && <span className="ml-1 text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded-full border border-red-100">Out</span>}
                      {p.stock_quantity > 0 && p.stock_quantity < 5 && <span className="ml-1 text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full border border-amber-100">Low</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-gray-700">{fmtP(p.total_revenue)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {/* Summary footer */}
      {!loading && data && tab === 'fast' && data.fast_moving.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Top {data.fast_moving.length} products by units sold in last 90 days
          </p>
          <p className="text-xs font-bold text-[#B8860B]">
            Total: {fmtP(data.fast_moving.reduce((s, p) => s + Number(p.total_revenue || 0), 0))}
          </p>
        </div>
      )}
      {!loading && data && tab === 'slow' && data.slow_moving.length > 0 && (
        <div className="px-6 py-3 bg-red-50 border-t border-red-100 flex items-center gap-2">
          <AlertTriangle size={13} className="text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-600">
            {data.slow_moving.length} product{data.slow_moving.length !== 1 ? 's' : ''} with 0–2 units sold in 90 days — consider promotions or reorder review
          </p>
        </div>
      )}
    </div>
  )
}

// ── MAIN REVENUE PAGE ────────────────────────────────────────────────────────
export default function RevenuePage() {
  const navigate = useNavigate()
  const [monthly,    setMonthly]    = useState([])
  const [dashStats,  setDashStats]  = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [drillMonth, setDrillMonth] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get('/reports/revenue'),
      api.get('/reports/dashboard'),
    ]).then(([rev, dash]) => {
      setMonthly(rev.data.data || [])
      setDashStats(dash.data.data)
    }).catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const totalAllTime = monthly.reduce((s, m) => s + Number(m.total_revenue || 0), 0)
  const totalJobs    = monthly.reduce((s, m) => s + Number(m.completed_jobs || 0), 0)
  const thisMonth    = dashStats?.monthly_revenue || 0
  const completedThisMonth = dashStats?.completed_jobs || 0

  // Chart data — most recent 6 months, oldest first
  const chartData = [...monthly].slice(0, 6).reverse().map(m => ({
    month: m.month,
    revenue: Number(m.total_revenue || 0),
    jobs: Number(m.completed_jobs || 0),
  }))

  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1)

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {drillMonth && <MonthModal month={drillMonth} onClose={() => setDrillMonth(null)} />}

      {/* Top bar */}
      <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin')}
            className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100 hover:border-[#B8860B] hover:text-[#B8860B] transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="font-display text-2xl text-[#1A1A2E]">Revenue</h1>
            <p className="text-sm text-gray-400">Completed job earnings — click any month to drill down</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-[#B8860B] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-4 gap-4 mb-7">
            {[
              [TrendingUp,  fmt(thisMonth),      `This month's revenue`,  completedThisMonth + ' completed jobs', 'bg-[#B8860B]/10 text-[#B8860B]'],
              [DollarSign,  fmt(totalAllTime),   'All-time revenue',      totalJobs + ' total completed jobs',    'bg-green-50 text-green-600'],
              [CheckCircle, totalJobs,           'Completed jobs (total)','Across all time',                      'bg-blue-50 text-blue-600'],
              [Clock,       monthly.length,      'Active months',         'Months with completed jobs',           'bg-purple-50 text-purple-600'],
            ].map(([Icon, val, label, sub, cls], i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-50">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-11 h-11 ${cls} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="text-xl font-black text-[#1A1A2E] leading-none">{val}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{label}</div>
                  </div>
                </div>
                <p className="text-xs text-gray-400 pl-14">{sub}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-50 mb-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-bold text-[#1A1A2E]">Monthly Revenue Chart</h2>
                  <p className="text-xs text-gray-400">Last {chartData.length} months — completed jobs only</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} barCategoryGap="35%">
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                    tickFormatter={v => v === 0 ? 'MK 0' : `MK ${(v/1000).toFixed(0)}K`} />
                  <Tooltip
                    formatter={(v) => [fmt(v), 'Revenue']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }} />
                  <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                    {chartData.map((d, i) => (
                      <Cell key={i}
                        fill={d.revenue === maxRevenue ? '#B8860B' : '#E8D5A3'}
                        cursor="pointer"
                        onClick={() => setDrillMonth(d.month)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-center text-xs text-gray-400 mt-2">Highest month highlighted in gold · Click a bar to see details</p>
            </div>
          )}

          {/* Monthly table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
              <h2 className="font-bold text-[#1A1A2E] text-sm">Monthly Breakdown</h2>
              <span className="text-xs text-gray-400">{monthly.length} month{monthly.length !== 1 ? 's' : ''} with revenue</span>
            </div>

            {monthly.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4 text-3xl">💰</div>
                <h3 className="font-bold text-[#1A1A2E] text-base mb-1">No revenue yet</h3>
                <p className="text-sm text-gray-400 max-w-xs">
                  Revenue will appear here once job cards are marked as <strong>completed</strong> with a final cost set.
                </p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80">
                    {['Month', 'Completed Jobs', 'Invoice Revenue', 'Walk-in Sales', 'Total Revenue', 'Avg per Job', ''].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthly.map((row, i) => {
                    const rev  = Number(row.total_revenue   || 0)
                    const invR = Number(row.invoice_revenue || 0)
                    const wkR  = Number(row.walkin_revenue  || 0)
                    const jobs = Number(row.appointments    || 0)
                    const avg  = jobs > 0 ? Math.round(rev / jobs) : 0
                    const isTop = rev === Math.max(...monthly.map(m => Number(m.total_revenue || 0)))
                    return (
                      <tr key={i}
                        className={`border-t border-gray-50 hover:bg-[#B8860B]/3 cursor-pointer transition-colors ${isTop ? 'bg-[#B8860B]/5' : ''}`}
                        onClick={() => setDrillMonth(row.month)}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#B8860B]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Calendar size={13} className="text-[#B8860B]" />
                            </div>
                            <span className="font-semibold text-[#1A1A2E]">{row.month}</span>
                            {isTop && <span className="text-[10px] bg-[#B8860B] text-white px-2 py-0.5 rounded-full font-bold">Top</span>}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="flex items-center gap-1.5 text-gray-600">
                            <CheckCircle size={12} className="text-green-500" />
                            {jobs} job{jobs !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-gray-600 text-xs font-medium">{fmt(invR)}</td>
                        <td className="px-5 py-4 text-gray-500 text-xs">
                          {wkR > 0 ? <span className="text-blue-600 font-medium">{fmt(wkR)}</span> : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-5 py-4 font-black text-[#B8860B] text-base">{fmt(rev)}</td>
                        <td className="px-5 py-4 text-gray-500 text-xs">{avg > 0 ? fmt(avg) : '—'}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1 text-[#B8860B] text-xs font-semibold hover:gap-2 transition-all">
                            Details <ChevronRight size={13} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                {/* Grand total */}
                <tfoot>
                  <tr className="bg-[#1A1A2E]">
                    <td className="px-5 py-4 font-bold text-white text-sm">All Time Total</td>
                    <td className="px-5 py-4 text-white/60 text-sm">{totalJobs} jobs</td>
                    <td colSpan={2} className="px-5 py-4 text-white/50 text-xs">invoices + walk-ins</td>
                    <td className="px-5 py-4 font-black text-[#B8860B] text-lg">{fmt(totalAllTime)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          {/* Product movement report */}
          <ProductMovement />
        </>
      )}
    </div>
  )
}
