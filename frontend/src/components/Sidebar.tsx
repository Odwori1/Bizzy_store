import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../hooks/useAuth'

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  adminOnly?: boolean;
}

const Sidebar: React.FC = () => {
  const location = useLocation()
  const { user, isLoading } = useAuthStore()
  const [navigation, setNavigation] = useState<NavigationItem[]>([])

  // Base navigation items
  const baseNavigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'POS', href: '/pos', icon: '🛒' },
    { name: 'Sales', href: '/sales', icon: '📋' },
    { name: 'Products', href: '/products', icon: '📦' },
    { name: 'Inventory', href: '/inventory', icon: '📊' },
    { name: 'Reports', href: '/reports', icon: '📈' },
    { name: 'Business Settings', href: '/settings/business', icon: '⚙️' },
    { name: 'My Profile', href: '/profile', icon: '👤' },
  ]

  // Admin-only navigation items
  const adminNavigation: NavigationItem[] = [
    { name: 'User Management', href: '/users', icon: '👥', adminOnly: true }
  ]

  // Update navigation when user state changes
  useEffect(() => {
    if (!isLoading) {
      let finalNavigation = [...baseNavigation]
      
      // Add admin items if user is admin
      if (user?.role && ['admin', 'manager'].includes(user.role)) {
        finalNavigation = [...finalNavigation, ...adminNavigation]
      }
      
      setNavigation(finalNavigation)
    }
  }, [user, isLoading])

  if (isLoading) {
    return (
      <div className="w-64 bg-gray-800 text-white">
        <div className="p-4 text-xl font-semibold">Bizzy POS</div>
        <nav className="mt-6">
          <ul>
            {baseNavigation.map((item) => (
              <li key={item.name} className="px-4 py-2">
                <div className="flex items-center space-x-2 p-2 rounded-md text-gray-300">
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </div>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    )
  }

  return (
    <div className="w-64 bg-gray-800 text-white">
      <div className="p-4 text-xl font-semibold">Bizzy POS</div>
      <nav className="mt-6">
        <ul>
          {navigation.map((item) => (
            <li key={item.name} className="px-4 py-2">
              <Link
                to={item.href}
                className={`flex items-center space-x-2 p-2 rounded-md ${
                  location.pathname === item.href
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

export default Sidebar
