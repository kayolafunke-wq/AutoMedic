import { useState, useEffect } from 'react'
import api from '../../services/api'
import { Plus, X, Edit2, Trash2, RefreshCw, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'

export default function UserManagement() {
  const [users,    setUsers]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(null)  // 'create' | 'edit' | 'reset'
  const [selected, setSelected] = useState(null)
  const [toast,    setToast]    = useState({ show:false, msg:'', type:'success' })
  const [filter,   setFilter]   = useState('all')
  const [showPwd,  setShowPwd]  = useState(false)
  const [form,     setForm]     = useState({ name:'', email:'', phone:'', role:'technician', password:'' })
  const [newPwd,   setNewPwd]   = useState('')
  const [saving,   setSaving]   = useState(false)

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await api.get('/users')
      setUsers(res.data.data)
    } catch { setUsers([]) } finally { setLoading(false) }
  }

  const showToast = (msg, type='success') => {
    setToast({ show:true, msg, type })
    setTimeout(() => setToast({ show:false, msg:'', type:'success' }), 3500)
  }

  const createUser = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const res = await api.post('/users', form)
      setUsers(prev => [res.data.data, ...prev])
      setModal(null); setForm({ name:'', email:'', phone:'', role:'technician', password:'' })
      showToast(`âœ“ ${form.name} account created successfully`)
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create user', 'error')
    } finally { setSaving(false) }
  }

  const toggleActive = async (user) => {
    try {
      await api.patch(`/users/${user.id}`, { is_active: !user.is_active })
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u))
      showToast(`${user.name} ${user.is_active ? 'deactivated' : 'activated'}`)
    } catch { showToast('Failed to update user', 'error') }
  }

  const resetPassword = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post(`/users/${selected.id}/reset-password`, { new_password: newPwd })
      setModal(null); setNewPwd('')
      showToast(`âœ“ Password reset for ${selected.name}`)
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reset password', 'error')
    } finally { setSaving(false) }
  }

  const filtered = users.filter(u => filter === 'all' || u.role === filter)

  const roleColor = (r) => ({
    admin:      'bg-purple-50 text-purple-600 border border-purple-100',
    technician: 'bg-blue-50 text-blue-600 border border-blue-100',
    customer:   'bg-green-50 text-green-600 border border-green-100',
  }[r] || 'bg-gray-50 text-gray-500')

  return (
    <div>
      {/* Toast */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl transition-all
          ${toast.type === 'success' ? 'bg-[#1A1A2E] text-white' : 'bg-red-500 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
          {toast.msg}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-display text-2xl text-dark">User Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">Create and manage technician, admin and customer accounts</p>
        </div>
        <button onClick={() => { setModal('create'); setForm({ name:'', email:'', phone:'', role:'technician', password:'' }) }}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-full hover:bg-primary-dark transition-all hover:shadow-lg hover:shadow-primary/30">
          <Plus size={15} /> Create Account
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          ['ðŸ‘¥', users.length,                                   'Total Users',   'bg-blue-50 text-blue-600'],
          ['ðŸ› ï¸', users.filter(u=>u.role==='technician').length,  'Technicians',   'bg-orange-50 text-orange-600'],
          ['ðŸ‘¤', users.filter(u=>u.role==='customer').length,    'Customers',     'bg-green-50 text-green-600'],
          ['âœ…', users.filter(u=>u.is_active).length,            'Active',        'bg-purple-50 text-purple-600'],
        ].map(([icon, val, label, cls], i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50 flex items-center gap-3">
            <div className={`w-11 h-11 ${cls} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>{icon}</div>
            <div><div className="text-xl font-black text-dark leading-none">{val}</div><div className="text-xs text-gray-400 mt-0.5">{label}</div></div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5">
        {['all','admin','technician','customer'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-xs font-semibold capitalize transition-all border ${filter===f ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-gray-500 hover:border-primary hover:text-primary'}`}>
            {f} {f !== 'all' && <span className="ml-1 opacity-70">({users.filter(u=>u.role===f).length})</span>}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80">
              {['Name','Email','Phone','Role','Status','Last Login','Actions'].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-black text-xs flex-shrink-0">
                      {u.name.charAt(0)}{u.name.split(' ')[1]?.charAt(0)||''}
                    </div>
                    <span className="font-semibold text-dark">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-gray-500 text-xs">{u.email}</td>
                <td className="px-4 py-3.5 text-gray-400 text-xs">{u.phone || 'â€”'}</td>
                <td className="px-4 py-3.5">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${roleColor(u.role)}`}>{u.role}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${u.is_active ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-500 border border-red-100'}`}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-gray-400 text-xs">{u.last_login ? new Date(u.last_login).toLocaleDateString('en-GB') : 'Never'}</td>
                <td className="px-4 py-3.5">
                  <div className="flex gap-1.5">
                    <button onClick={() => { setSelected(u); setModal('reset') }}
                      title="Reset password"
                      className="w-7 h-7 border border-gray-200 rounded-lg flex items-center justify-center hover:border-primary hover:text-primary transition-colors">
                      <RefreshCw size={11} />
                    </button>
                    <button onClick={() => toggleActive(u)}
                      title={u.is_active ? 'Deactivate' : 'Activate'}
                      className={`w-7 h-7 border rounded-lg flex items-center justify-center transition-colors ${u.is_active ? 'border-gray-200 hover:border-red-400 hover:text-red-500' : 'border-green-200 text-green-500 hover:bg-green-50'}`}>
                      {u.is_active ? <Trash2 size={11}/> : <CheckCircle size={11}/>}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE USER MODAL */}
      {modal === 'create' && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl p-7 max-w-md w-full shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-dark text-lg">Create New Account</h3>
                <p className="text-xs text-gray-400 mt-0.5">Create technician or admin accounts</p>
              </div>
              <button onClick={() => setModal(null)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"><X size={14}/></button>
            </div>
            <form onSubmit={createUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Role *</label>
                <div className="flex gap-2">
                  {['technician','admin','customer'].map(r => (
                    <button key={r} type="button" onClick={() => setForm(f=>({...f,role:r}))}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border-[1.5px] capitalize transition-all ${form.role===r ? 'bg-primary border-primary text-white' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-primary'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              {[['Full Name *','text','name','e.g. Peter Nkosi'],['Email *','email','email','email@example.com'],['Phone','tel','phone','+265 999 000 000']].map(([label,type,key,ph]) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
                  <input type={type} placeholder={ph} required={key!=='phone'} value={form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password *</label>
                <div className="relative">
                  <input type={showPwd?'text':'password'} placeholder="Min 6 characters" required value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary pr-10" />
                  <button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPwd?<EyeOff size={15}/>:<Eye size={15}/>}
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

      {/* RESET PASSWORD MODAL */}
      {modal === 'reset' && selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl p-7 max-w-sm w-full shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-dark text-base">Reset Password</h3>
              <button onClick={() => setModal(null)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"><X size={14}/></button>
            </div>
            <p className="text-sm text-gray-500 mb-5">Set a new password for <strong className="text-dark">{selected.name}</strong></p>
            <form onSubmit={resetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">New Password *</label>
                <div className="relative">
                  <input type={showPwd?'text':'password'} placeholder="Min 6 characters" required value={newPwd} onChange={e=>setNewPwd(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary pr-10" />
                  <button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPwd?<EyeOff size={15}/>:<Eye size={15}/>}
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
    </div>
  )
}

