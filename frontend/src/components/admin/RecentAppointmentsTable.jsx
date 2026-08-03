import { Calendar, Car, User, Clock } from 'lucide-react'
import { APPOINTMENT_STATUS_COLORS } from '../../utils/constants'

export default function RecentAppointmentsTable({ appointments }) {
  if (!appointments || appointments.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-4">Recent Appointments</h3>
        <div className="text-center py-8 text-gray-400">
          No appointments yet
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Recent Appointments</h3>
        <Calendar size={20} className="text-gray-400" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-100">
            <tr>
              <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Tracking #</th>
              <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Customer</th>
              <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Vehicle</th>
              <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Date</th>
              <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.slice(0, 5).map((appt) => (
              <tr key={appt.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                <td className="py-3 px-2 text-sm font-medium text-primary">{appt.tracking_number}</td>
                <td className="py-3 px-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-gray-400" />
                    {appt.customer_name}
                  </div>
                </td>
                <td className="py-3 px-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Car size={14} className="text-gray-400" />
                    {appt.make} {appt.model}
                  </div>
                </td>
                <td className="py-3 px-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    {new Date(appt.preferred_date).toLocaleDateString()}
                  </div>
                </td>
                <td className="py-3 px-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${APPOINTMENT_STATUS_COLORS[appt.status] || 'bg-gray-100 text-gray-800'}`}>
                    {appt.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
