import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'
import ScrollToTop from './components/ScrollToTop'

// Public pages
import HomePage from './pages/HomePage'
import ServicesPage from './pages/ServicesPage'
import ProductsPage from './pages/ProductsPage'
import BookingPage from './pages/BookingPage'
import TrackingPage from './pages/TrackingPage'
import LoginPage from './pages/LoginPage'
import InspectionPage from './pages/InspectionPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

import AuthCallback from './pages/AuthCallback'
import CustomerDashboard from './pages/customer/CustomerDashboard'
import TechnicianDashboard from './pages/technician/TechnicianDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import StockKeeperDashboard from './pages/stockkeeper/StockKeeperDashboard'

// Protected route
const Protected = ({ children, roles }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  )

  // Not logged in — send to login, preserve intended destination
  if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />

  // Wrong role — show a friendly message instead of silent bounce
  if (roles && !roles.includes(user.role)) {
    const dashMap = { admin: '/admin', technician: '/technician', stockkeeper: '/stockkeeper', customer: '/dashboard' }
    return <Navigate to={dashMap[user.role] || '/'} replace />
  }

  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/track" element={<TrackingPage />} />
          <Route path="/track/:ref" element={<TrackingPage />} />

          <Route path="/auth/callback" element={<AuthCallback />} />
          {/* Protected - Customer */}
          <Route path="/booking" element={<Protected roles={['customer']}><BookingPage /></Protected>} />
          <Route path="/dashboard" element={<Protected roles={['customer']}><CustomerDashboard /></Protected>} />
          <Route path="/inspection/:id" element={<Protected roles={['customer']}><InspectionPage /></Protected>} />

          {/* Protected - Technician */}
          <Route path="/technician" element={<Protected roles={['technician']}><TechnicianDashboard /></Protected>} />

          {/* Protected - Stock Keeper */}
          <Route path="/stockkeeper/*" element={<Protected roles={['stockkeeper']}><StockKeeperDashboard /></Protected>} />

          {/* Protected - Admin */}
          <Route path="/admin/*" element={<Protected roles={['admin']}><AdminDashboard /></Protected>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
