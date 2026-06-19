import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'

// Public pages
import HomePage from './pages/HomePage'
import ServicesPage from './pages/ServicesPage'
import ProductsPage from './pages/ProductsPage'
import BookingPage from './pages/BookingPage'
import TrackingPage from './pages/TrackingPage'
import LoginPage from './pages/LoginPage'
import InspectionPage from './pages/InspectionPage'

import AuthCallback from './pages/AuthCallback'
import CustomerDashboard from './pages/customer/CustomerDashboard'
import TechnicianDashboard from './pages/technician/TechnicianDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'

// Protected route
const Protected = ({ children, roles }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/track" element={<TrackingPage />} />
          <Route path="/track/:ref" element={<TrackingPage />} />

          <Route path="/auth/callback" element={<AuthCallback />} />
          {/* Protected - Customer */}
          <Route path="/booking" element={<Protected roles={['customer']}><BookingPage /></Protected>} />
          <Route path="/dashboard" element={<Protected roles={['customer']}><CustomerDashboard /></Protected>} />
          <Route path="/inspection/:id" element={<Protected roles={['customer']}><InspectionPage /></Protected>} />

          {/* Protected - Technician */}
          <Route path="/technician" element={<Protected roles={['technician']}><TechnicianDashboard /></Protected>} />

          {/* Protected - Admin */}
          <Route path="/admin/*" element={<Protected roles={['admin']}><AdminDashboard /></Protected>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
