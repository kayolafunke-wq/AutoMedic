import { Calendar, DollarSign, Car, Users } from 'lucide-react'

const StatCard = ({ icon: Icon, label, value, color, trend }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <div className="flex items-center justify-between mb-3">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="text-white" size={20} />
      </div>
      {trend && (
        <span className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-500 mt-1">{label}</p>
  </div>
)

export default function StatsCards({ stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        icon={Calendar}
        label="Total Appointments"
        value={stats.appointments || 0}
        color="bg-primary"
      />
      <StatCard
        icon={DollarSign}
        label="Total Revenue"
        value={`MK ${(stats.revenue || 0).toLocaleString()}`}
        color="bg-green-500"
      />
      <StatCard
        icon={Car}
        label="Vehicles Serviced"
        value={stats.vehicles || 0}
        color="bg-blue-500"
      />
      <StatCard
        icon={Users}
        label="Active Customers"
        value={stats.customers || 0}
        color="bg-purple-500"
      />
    </div>
  )
}
