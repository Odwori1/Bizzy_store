// File: frontend/src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
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
// ADD THESE TWO IMPORT STATEMENTS:
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Register from './pages/Register';
import ProfileSettings from './pages/ProfileSettings';

function App() {
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
            <Route path="settings/business" element={<BusinessSettings />} />
            <Route path="users" element={<UserManagement />} />
          </Route>
        </Routes>
      </div>
    </Router>
  )
}

export default App
