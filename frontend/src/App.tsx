// File: frontend/src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import POS from './pages/POS'
import Sales from './pages/Sales'
import Products from './pages/Products'
import Inventory from './pages/Inventory'
import Reports from './pages/Reports'
import BusinessSettings from './pages/BusinessSettings'
import UserManagement from './pages/UserManagement'
import ProtectedRoute from './components/ProtectedRoute'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Register from './pages/Register'
import ProfileSettings from './pages/ProfileSettings'
import Customers from './pages/Customers'
import Refunds from './pages/Refunds'
import Suppliers from './pages/Suppliers'
import Expenses from './pages/Expenses'
import ScannerDiagnostics from './pages/ScannerDiagnostics'
import TermsAndConditions from './components/TermsAndConditions'

function App() {
  const [termsAccepted, setTermsAccepted] = useState<boolean | null>(null)

  // Check if terms were already accepted
  useEffect(() => {
    const accepted = localStorage.getItem('termsAccepted') === 'true'
    setTermsAccepted(accepted)
  }, [])

  const handleAcceptTerms = () => {
    localStorage.setItem('termsAccepted', 'true')
    setTermsAccepted(true)
  }

  // Show terms if not accepted yet
  if (termsAccepted === false) {
    return <TermsAndConditions onAccept={handleAcceptTerms} />
  }

  // Show loading while checking terms
  if (termsAccepted === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Bizzy POS...</p>
        </div>
      </div>
    )
  }

  // Main app router
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />

          {/* Protected routes with layout */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="pos" element={<POS />} />
            <Route path="sales" element={<Sales />} />
            <Route path="products" element={<Products />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="reports" element={<Reports />} />
            <Route path="customers" element={<Customers />} />
            <Route path="settings/business" element={<BusinessSettings />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="refunds" element={<Refunds />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="/scanner-diagnostics" element={<ScannerDiagnostics />} />
          </Route>
        </Routes>
      </div>
    </Router>
  )
}

export default App
