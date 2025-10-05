import React, { useEffect } from 'react'
import { useBusinessStore } from '../hooks/useBusiness'
import { useAuthStore } from '../hooks/useAuth'
import BizzyLogo from './Logo'

export default function Header() {
  const { business, loadBusiness } = useBusinessStore()
  const { logout, user } = useAuthStore()

  useEffect(() => {
    loadBusiness()
  }, [loadBusiness])

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex justify-between items-center px-6 py-4">
        <div className="flex items-center space-x-4">
          {/* Professional Shield Eye Logo */}
          <BizzyLogo 
            size={45} 
            variant="shield-eye" 
            showText={true}
            className="hover:scale-105"
          />
        </div>
        
        <div className="flex items-center space-x-6">
          {/* User & Business Info */}
          <div className="text-right">
            <h1 className="text-sm font-medium text-gray-900 capitalize">
              {user?.username || 'User'}
            </h1>
            <p className="text-xs text-gray-600">
              {business?.name || 'Business'} • POS System
            </p>
          </div>
          
          {/* Professional Logout */}
          <button
            onClick={handleLogout}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 text-sm font-medium transition-colors shadow-sm"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  )
}
