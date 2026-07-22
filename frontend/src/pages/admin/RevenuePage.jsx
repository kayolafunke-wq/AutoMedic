import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import {
  ArrowLeft, TrendingUp, CheckCircle, Clock, DollarSign,
  ChevronRight, X, Calendar, Car, User, Wrench, FileText
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
              <FileText size={48} className="text-gray-200 mb-3" />
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin')}
            className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100 hover:border-[#B8860B] hover:text-[#B8860B] transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="font-display text-xl sm:text-2xl text-[#1A1A2E]">Revenue</h1>
            <p className="text-sm text-gray-400">Completed job earnings — tap any month to drill down</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-7">
            {[
              [TrendingUp,  fmt(thisMonth),      `This month's revenue`,  completedThisMonth + ' completed jobs', 'bg-[#B8860B]/10 text-[#B8860B]'],
              [DollarSign,  fmt(totalAllTime),   'All-time revenue',      totalJobs + ' total completed jobs',    'bg-green-50 text-green-600'],
              [CheckCircle, totalJobs,           'Completed jobs (total)','Across all time',                      'bg-blue-50 text-blue-600'],
              [Clock,       monthly.length,      'Active months',         'Months with completed jobs',           'bg-purple-50 text-purple-600'],
            ].map(([Icon, val, label, sub, cls], i) => (
              <div key={i} className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-50">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className={`w-9 h-9 sm:w-11 sm:h-11 ${cls} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-lg sm:text-xl font-black text-[#1A1A2E] leading-none truncate">{val}</div>
                    <div className="text-xs text-gray-400 mt-0.5 truncate">{label}</div>
                  </div>
                </div>
                <p className="text-xs text-gray-400 pl-11 sm:pl-14 truncate">{sub}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-50 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
                <div>
                  <h2 className="font-bold text-[#1A1A2E]">Monthly Revenue Chart</h2>
                  <p className="text-xs text-gray-400">Last {chartData.length} months — completed jobs only</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barCategoryGap="35%">
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                    tickFormatter={v => v === 0 ? 'MK 0' : `MK ${(v/1000).toFixed(0)}K`} />
                  <Tooltip
                    formatter={(v) => [fmt(v), 'Revenue']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }}
                    cursor={{ fill: 'rgba(184, 134, 11, 0.1)' }} />
                  <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={d.revenue === maxRevenue ? '#B8860B' : '#E8D5A3'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-center text-xs text-gray-400 mt-2">Highest month highlighted in gold · Tap a bar to see details</p>
            </div>
          )}

          {/* Monthly table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-50 flex justify-between items-center">
              <h2 className="font-bold text-[#1A1A2E] text-sm">Monthly Breakdown</h2>
              <span className="text-xs text-gray-400">{monthly.length} month{monthly.length !== 1 ? 's' : ''} with revenue</span>
            </div>

            {monthly.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <DollarSign size={32} className="text-gray-300" />
                </div>
                <h3 className="font-bold text-[#1A1A2E] text-base mb-1">No revenue yet</h3>
                <p className="text-sm text-gray-400 max-w-xs">
                  Revenue will appear here once job cards are marked as <strong>completed</strong> with a final cost set.
                </p>
              </div>
            ) : (
              <>
                {/* Mobile card view */}
                <div className="block lg:hidden">
                  {monthly.map((row, i) => {
                    const rev  = Number(row.total_revenue   || 0)
                    const invR = Number(row.invoice_revenue || 0)
                    const wkR  = Number(row.walkin_revenue  || 0)
                    const jobs = Number(row.appointments    || 0)
                    const avg  = jobs > 0 ? Math.round(rev / jobs) : 0
                    const isTop = rev === Math.max(...monthly.map(m => Number(m.total_revenue || 0)))
                    return (
                      <div key={i}
                        className={`border-b border-gray-50 p-4 hover:bg-[#B8860B]/3 cursor-pointer transition-colors ${isTop ? 'bg-[#B8860B]/5' : ''}`}
                        onClick={() => setDrillMonth(row.month)}>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#B8860B]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Calendar size={13} className="text-[#B8860B]" />
                            </div>
                            <div>
                              <span className="font-semibold text-[#1A1A2E]">{row.month}</span>
                              {isTop && <span className="ml-2 text-[10px] bg-[#B8860B] text-white px-2 py-0.5 rounded-full font-bold">Top</span>}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-black text-[#B8860B] text-base">{fmt(rev)}</div>
                            <div className="text-xs text-gray-500">{jobs} job{jobs !== 1 ? 's' : ''}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-2">
                          <div>Invoice: {fmt(invR)}</div>
                          <div>Walk-in: {wkR > 0 ? fmt(wkR) : '—'}</div>
                          <div>Avg/job: {avg > 0 ? fmt(avg) : '—'}</div>
                          <div className="text-[#B8860B] font-semibold">Details →</div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Desktop table view */}
                <table className="w-full text-sm hidden lg:table">
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
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
