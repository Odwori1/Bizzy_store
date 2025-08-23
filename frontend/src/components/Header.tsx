import React, { useEffect } from 'react'
import { useBusinessStore } from '../hooks/useBusiness'
import { useAuthStore } from '../hooks/useAuth' // ADD IMPORT

export default function Header() {
  const { business, loadBusiness } = useBusinessStore()
  const { logout } = useAuthStore() // ADD LOGOUT FUNCTION

  useEffect(() => {
    loadBusiness()
  }, [loadBusiness])

  const handleLogout = () => {
    logout()
    window.location.href = '/login' // Redirect to login page
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="flex justify-between items-center px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          {business?.name || 'Bizzy POS'}
        </h1>
        <div className="flex items-center space-x-4">
          {/* ADD LOGOUT BUTTON */}
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
