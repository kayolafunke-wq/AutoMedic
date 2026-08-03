import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#B8860B', '#25D366', '#1565C0', '#E65100']

export default function AppointmentsChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-4">Appointments by Status</h3>
        <div className="h-64 flex items-center justify-center text-gray-400">
          No appointment data available
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold mb-4">Appointments by Status</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill={COLORS[0]} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
