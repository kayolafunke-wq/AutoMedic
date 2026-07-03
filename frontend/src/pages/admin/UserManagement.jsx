import { useState, useEffect } from 'react'
import api from '../../services/api'
import { Plus, X, Trash2, RefreshCw, Eye, EyeOff, CheckCircle, AlertCircle, ShieldAlert, Search, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 10

export default function UserManagement() {
  const [users,         setUsers]         = useState([])
  const [loading,       setLoading]       = useState(true)
  const [modal,         setModal]         = useState(null)
  const [selected,      setSelected]      = useState(null)
  const [toast,         setToast]         = useState({ show: false, msg: '', type: 'success' })
  const [filter,        setFilter]        = useState('all')
  const [search,        setSearch]        = useState('')
  const [page,          setPage]          = useState(1)
  const [showPwd,       setShowPwd]       = useState(false)
  const [form,          setForm]          = useState({ name: '', email: '', phone: '', role: 'technician', password: '' })
  const [newPwd,        setNewPwd]        = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [saving,        setSaving]        = useState(false)

  useEffect(() => { fetchUsers() }, [])

  // Reset to page 1 whenever filter or search changes
  useEffect(() => { setPage(1) }, [filter, search])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/users')
      setUsers(res.data.data)
    } catch { setUsers([]) } finally { setLoading(false) }
  }

  const showToast = (msg, type = 'success') => {
    setToast({ show: true, msg, type })
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 4000)
  }

  const createUser = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.post('/users', form)
      setUsers(prev => [res.data.data, ...prev])
      setModal(null)
      setForm({ name: '', email: '', phone: '', role: 'technician', password: '' })
      showToast(`Account created for ${form.name}`)
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create user', 'error')
    } finally { setSaving(false) }
  }

  const toggleActive = async (user) => {
    try {
      await api.patch(`/users/${user.id}`, { is_active: !user.is_active })
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u))
      showToast(`${user.name} ${user.is_active ? 'deactivated' : 'activated'}`)
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update user', 'error')
    }
  }

  const resetPassword = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post(`/users/${selected.id}/reset-password`, { new_password: newPwd })
      setModal(null)
      setNewPwd('')
      showToast(`Password reset for ${selected.name}`)
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reset password', 'error')
    } finally { setSaving(false) }
  }

  const permanentDelete = async () => {
    if (deleteConfirm.trim() !== selected.name.trim()) return
    setSaving(true)
    try {
      const res = await api.delete(`/users/${selected.id}/permanent`)
      setUsers(prev => prev.filter(u => u.id !== selected.id))
      setModal(null)
      setDeleteConfirm('')
      const d = res.data.deleted
      showToast(
        `${d.user} permanently deleted — ${d.appointments} appointments, ${d.vehicles} vehicles, ${d.invoices} invoices removed`
      )
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete user', 'error')
    } finally { setSaving(false) }
  }

  const openDelete = (user) => {
    setSelected(user)
    setDeleteConfirm('')
    setModal('delete')
  }

  // Filter → search → paginate
  const afterFilter = users.filter(u => filter === 'all' || u.role === filter)
  const afterSearch = afterFilter.filter(u => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      u.name.toLowerCase().includes(q)  ||
      u.email.toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    )
  })
  const totalPages = Math.max(1, Math.ceil(afterSearch.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = afterSearch.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const roleColor = (r) => ({
    admin:      'bg-red-50 text-red-600 border border-red-100',
    technician: 'bg-orange-50 text-orange-600 border border-orange-100',
    customer:   'bg-green-50 text-green-600 border border-green-100',
    stockkeeper: 'bg-blue-50 text-blue-600 border border-blue-100',
  }[r] || 'bg-gray-50 text-gray-500')

  return (
    <div>
      {/* Toast */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl
          ${toast.type === 'success' ? 'bg-[#1A1A2E] text-white' : 'bg-red-500 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-display text-2xl text-dark">User Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">Create and manage technician, admin, customer and stock keeper accounts</p>
        </div>
        <button
          onClick={() => { setModal('create'); setForm({ name: '', email: '', phone: '', role: 'technician', password: '' }) }}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-full hover:bg-primary-dark transition-all hover:shadow-lg hover:shadow-primary/30">
          <Plus size={15} /> Create Account
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          ['👥', users.length,                                   'Total Users',   'bg-blue-50 text-blue-600'],
          ['🔧', users.filter(u => u.role === 'technician').length, 'Technicians', 'bg-orange-50 text-orange-600'],
          ['👤', users.filter(u => u.role === 'customer').length,   'Customers',  'bg-green-50 text-green-600'],
          ['✅', users.filter(u => u.is_active).length,             'Active',     'bg-purple-50 text-purple-600'],
        ].map(([icon, val, label, cls], i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 flex items-center gap-3">
            <div className={`w-11 h-11 ${cls} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>{icon}</div>
            <div>
              <div className="text-xl font-black text-dark leading-none">{val}</div>
              <div className="text-xs text-gray-400 mt-0.5">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {['all', 'admin', 'technician', 'customer', 'stockkeeper'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-xs font-semibold capitalize transition-all border
              ${filter === f ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-gray-500 hover:border-primary hover:text-primary'}`}>
            {f} {f !== 'all' && <span className="ml-1 opacity-70">({users.filter(u => u.role === f).length})</span>}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="relative mb-5">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, phone or role..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-white"
        />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80">
              {['Name', 'Email', 'Phone', 'Role', 'Status', 'Last Login', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Loading users...
                </div>
              </td></tr>
            ) : paginated.map(u => (
              <tr key={u.id} className={`border-t border-gray-50 hover:bg-gray-50/50 transition-colors ${!u.is_active ? 'opacity-60' : ''}`}>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-black text-xs flex-shrink-0">
                      {u.name.charAt(0)}{u.name.split(' ')[1]?.charAt(0) || ''}
                    </div>
                    <span className="font-semibold text-dark">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-gray-500 text-xs">{u.email}</td>
                <td className="px-4 py-3.5 text-gray-400 text-xs">{u.phone || '—'}</td>
                <td className="px-4 py-3.5">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${roleColor(u.role)}`}>{u.role}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${u.is_active ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-500 border border-red-100'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-gray-400 text-xs">
                  {u.last_login ? new Date(u.last_login).toLocaleDateString('en-GB') : 'Never'}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex gap-1.5">
                    {/* Reset password */}
                    <button onClick={() => { setSelected(u); setModal('reset') }}
                      title="Reset password"
                      className="w-7 h-7 border border-gray-200 rounded-lg flex items-center justify-center hover:border-primary hover:text-primary transition-colors">
                      <RefreshCw size={11} />
                    </button>
                    {/* Deactivate / Activate */}
                    <button onClick={() => toggleActive(u)}
                      title={u.is_active ? 'Deactivate account' : 'Activate account'}
                      className={`w-7 h-7 border rounded-lg flex items-center justify-center transition-colors
                        ${u.is_active ? 'border-gray-200 hover:border-amber-400 hover:text-amber-500' : 'border-green-200 text-green-500 hover:bg-green-50'}`}>
                      {u.is_active ? <span className="text-[9px] font-black">OFF</span> : <CheckCircle size={11} />}
                    </button>
                    {/* Permanent delete */}
                    <button onClick={() => openDelete(u)}
                      title="Permanently delete account"
                      className="w-7 h-7 border border-gray-200 rounded-lg flex items-center justify-center hover:border-red-500 hover:bg-red-50 hover:text-red-600 transition-colors">
                      <Trash2 size={11} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && paginated.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                {search ? `No users match "${search}"` : 'No users found'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && afterSearch.length > 0 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-xs text-gray-400">
            Showing <strong className="text-gray-600">{(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, afterSearch.length)}</strong> of <strong className="text-gray-600">{afterSearch.length}</strong> user{afterSearch.length !== 1 ? 's' : ''}
            {search && <span className="ml-1">matching "<em>{search}</em>"</span>}
          </p>
          <div className="flex items-center gap-1.5">
            {/* Prev */}
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-primary hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft size={14} />
            </button>

            {/* Page numbers */}
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
                        ${safePage === p ? 'bg-primary border-primary text-white' : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'}`}>
                      {p}
                    </button>
              )
            }

            {/* Next */}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-primary hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── CREATE USER MODAL ── */}
      {modal === 'create' && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl p-7 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-dark text-lg">Create New Account</h3>
                <p className="text-xs text-gray-400 mt-0.5">Create technician, admin, customer or stock keeper accounts</p>
              </div>
              <button onClick={() => setModal(null)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"><X size={14} /></button>
            </div>
            <form onSubmit={createUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Role *</label>
                <div className="flex gap-2 flex-wrap">
                  {['technician', 'admin', 'customer', 'stockkeeper'].map(r => (
                    <button key={r} type="button" onClick={() => setForm(f => ({ ...f, role: r }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border-[1.5px] capitalize transition-all
                        ${form.role === r ? 'bg-primary border-primary text-white' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-primary'}`}>
                      {r === 'stockkeeper' ? 'Stock Keeper' : r}
                    </button>
                  ))}
                </div>
              </div>
              {[['Full Name *', 'text', 'name', 'e.g. Peter Nkosi'], ['Email *', 'email', 'email', 'email@example.com'], ['Phone', 'tel', 'phone', '+265 999 000 000']].map(([label, type, key, ph]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
                  <input type={type} placeholder={ph} required={key !== 'phone'} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password *</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} placeholder="Min 6 characters" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary pr-10" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={saving}
                className="w-full py-3 bg-primary text-white font-semibold rounded-full hover:bg-primary-dark transition-colors disabled:opacity-60 text-sm">
                {saving ? 'Creating...' : `Create ${form.role} Account`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── RESET PASSWORD MODAL ── */}
      {modal === 'reset' && selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl p-7 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-dark text-base">Reset Password</h3>
              <button onClick={() => setModal(null)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"><X size={14} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-5">Set a new password for <strong className="text-dark">{selected.name}</strong></p>
            <form onSubmit={resetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">New Password *</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} placeholder="Min 6 characters" required value={newPwd} onChange={e => setNewPwd(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary pr-10" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={saving}
                className="w-full py-3 bg-primary text-white font-semibold rounded-full hover:bg-primary-dark transition-colors disabled:opacity-60 text-sm">
                {saving ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── PERMANENT DELETE MODAL ── */}
      {modal === 'delete' && selected && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl p-7 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ShieldAlert size={20} className="text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1A1A2E] text-base">Permanently Delete Account</h3>
                  <p className="text-xs text-red-500 font-semibold mt-0.5">This action cannot be undone</p>
                </div>
              </div>
              <button onClick={() => setModal(null)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 flex-shrink-0">
                <X size={14} />
              </button>
            </div>

            {/* User info */}
            <div className="bg-gray-50 rounded-xl p-4 mb-5 flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-black text-sm flex-shrink-0">
                {selected.name.charAt(0)}{selected.name.split(' ')[1]?.charAt(0) || ''}
              </div>
              <div>
                <p className="font-bold text-[#1A1A2E] text-sm">{selected.name}</p>
                <p className="text-xs text-gray-400">{selected.email} · <span className="capitalize">{selected.role}</span></p>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
              <p className="text-sm font-bold text-red-700 mb-2">The following will be permanently deleted:</p>
              <ul className="text-xs text-red-600 space-y-1">
                <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0" /> User account and login credentials</li>
                {selected.role === 'customer' && <>
                  <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0" /> All registered vehicles</li>
                  <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0" /> All appointments and service history</li>
                  <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0" /> All invoices and payment records</li>
                  <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0" /> All notifications</li>
                </>}
                {selected.role === 'technician' && (
                  <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0" /> Job card assignments (history preserved)</li>
                )}
              </ul>
            </div>

            {/* Confirm input */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Type <strong className="text-[#1A1A2E]">{selected.name}</strong> to confirm
              </label>
              <input
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder={selected.name}
                className="w-full px-4 py-3 border border-red-200 rounded-xl text-sm focus:outline-none focus:border-red-500 bg-red-50/30"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button onClick={() => setModal(null)}
                className="flex-1 py-3 border border-gray-200 text-gray-500 text-sm font-semibold rounded-full hover:border-gray-300 transition-colors">
                Cancel
              </button>
              <button
                onClick={permanentDelete}
                disabled={saving || deleteConfirm.trim() !== selected.name.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 text-white text-sm font-bold rounded-full hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                <Trash2 size={14} />
                {saving ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
