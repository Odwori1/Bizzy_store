import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
  // NEW: Optional permission required to access this route
  requiredPermission?: string
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredPermission }) => {
  const { isAuthenticated, isLoading, initializeAuth, user, hasPermission } = useAuthStore()
  const location = useLocation();

  // Initialize auth when component mounts
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // 1. Check if user is not authenticated at all
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 2. NEW: Check if a specific permission is required and the user doesn't have it
  if (requiredPermission && !hasPermission(requiredPermission)) {
    // Redirect to a safe page (e.g., dashboard) instead of login
    // You could also show a notification here: "You don't have permission to access this page"
    return <Navigate to="/dashboard" replace />;
  }

  // 3. User is authenticated AND has the required permission (if any)
  return <>{children}</>;
}

export default ProtectedRoute
