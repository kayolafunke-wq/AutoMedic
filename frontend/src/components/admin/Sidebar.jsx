import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronRight, LogOut, X } from 'lucide-react'
import Logo from '../Logo'

// ── GROUPED NAV STRUCTURE ────────────────────────────────────────────────────
export const NAV_GROUPS = [
  {
    label: null, // no section header — top-level items
    items: [
      { path: '', icon: 'LayoutDashboard', label: 'Dashboard' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { path: 'appointments', icon: 'Calendar', label: 'Appointments' },
      { path: 'inspection', icon: 'ClipboardCheck', label: 'Inspections' },
      { path: 'vehicles', icon: 'Car', label: 'Vehicles' },
      { path: 'customers', icon: 'Users', label: 'Customers' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { path: 'invoices', icon: 'FileText', label: 'Invoices' },
      { path: 'revenue', icon: 'DollarSign', label: 'Revenue' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { path: 'reports', icon: 'BarChart2', label: 'Reports' },
      { path: 'analytics', icon: 'TrendingUp', label: 'Analytics' },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { path: 'products', icon: 'Package', label: 'Products & Parts' },
      { path: 'inventory', icon: 'TrendingUp', label: 'Inventory Tracking' },
      { path: 'services-mgmt', icon: 'Wrench', label: 'Services' },
      { path: 'checkouts', icon: 'ShoppingCart', label: 'Checkout Logs' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { path: 'users', icon: 'Users', label: 'User Management' },
      { path: 'settings', icon: 'Settings', label: 'Settings' },
    ],
  },
]

export default function Sidebar({ logout, open, onClose, navGroups = NAV_GROUPS }) {
  const location = useLocation()

  // Default: only Operations (index 1) is open — everything else collapsed
  const DEFAULT_COLLAPSED = { 0: false, 1: false, 2: true, 3: true, 4: true, 5: true }

  const [collapsed, setCollapsed] = useState(() => {
    try {
      const stored = sessionStorage.getItem('am_sidebar')
      return stored ? JSON.parse(stored) : DEFAULT_COLLAPSED
    } catch {
      return DEFAULT_COLLAPSED
    }
  })

  const isActive = (p) => {
    const full = '/admin' + (p ? '/' + p : '')
    return location.pathname === full || (p === '' && location.pathname === '/admin')
  }

  const toggleGroup = (idx) => {
    setCollapsed((prev) => {
      const next = { ...prev, [idx]: !prev[idx] }
      try {
        sessionStorage.setItem('am_sidebar', JSON.stringify(next))
      } catch {}
      return next
    })
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-dark text-white w-72 shadow-xl z-50 transform transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <Logo className="text-white" size="sm" />
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            {navGroups.map((group, idx) => (
              <div key={idx} className="mb-4">
                {group.label && (
                  <button
                    onClick={() => toggleGroup(idx)}
                    className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 px-3 py-2 hover:text-white transition"
                  >
                    <span>{group.label}</span>
                    {collapsed[idx] ? (
                      <ChevronRight size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>
                )}
                {!collapsed[idx] && (
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.path}
                        to={`/admin${item.path ? '/' + item.path : ''}`}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                          isActive(item.path)
                            ? 'bg-primary text-white font-medium'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        <item.icon size={18} />
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-red-500/10 hover:text-red-400 transition"
            >
              <LogOut size={18} />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
