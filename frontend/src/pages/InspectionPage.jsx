// Full inspection sign-off page for customers
// Links from customer dashboard inspection section
import { Link } from 'react-router-dom'
export default function InspectionPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center"><h1 className="font-display text-3xl text-dark mb-4">Inspection Sign-Off</h1>
        <p className="text-gray-500 mb-6">Full inspection sign-off module</p>
        <Link to="/dashboard" className="px-6 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary-dark transition-colors">Back to Dashboard</Link>
      </div>
    </div>
  )
}
