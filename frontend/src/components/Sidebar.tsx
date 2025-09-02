import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../hooks/useAuth'
// Import the new permission utility function
import { hasPermission } from '../lib/permissions';

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  // CHANGED: Replace 'adminOnly' with a specific permission string
  requiredPermission?: string;
}

const Sidebar: React.FC = () => {
  const location = useLocation()
  const { user, isLoading } = useAuthStore()
  const [navigation, setNavigation] = useState<NavigationItem[]>([])

  // UPDATED: Navigation items now specify a required permission instead of a role
  const baseNavigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'POS', href: '/pos', icon: '🛒' },
    { name: 'Sales', href: '/sales', icon: '📋' },
    { name: 'Products', href: '/products', icon: '📦' },
    { name: 'Inventory', href: '/inventory', icon: '📊' },
    { name: 'Reports', href: '/reports', icon: '📈', requiredPermission: 'report:view' },
    { name: 'Customers', href: '/customers', icon: "👥" },
    { name: 'Expenses', href: '/expenses', icon: '💰' }, // ADD THIS LINE
    { name: 'Business Settings', href: '/settings/business', icon: '⚙️', requiredPermission: 'business:update' },
    { name: 'My Profile', href: '/profile', icon: '👤' },
    { name: 'Refunds', href: '/refunds', icon: '💸', requiredPermission: 'sale:refund' },
    { name: 'Suppliers', href: '/suppliers', icon: '🏭', requiredPermission: 'supplier:read' },
    // CHANGED: User Management now requires a specific permission
    { name: 'User Management', href: '/users', icon: '👥', requiredPermission: 'user:read' },
  ]

  // Update navigation when user state changes
  useEffect(() => {
    if (!isLoading && user) {
      // Filter the navigation: show item if no permission is required OR if the user has the required permission
      const filteredNavigation = baseNavigation.filter(item =>
        !item.requiredPermission || hasPermission(item.requiredPermission, user.permissions)
      );
      setNavigation(filteredNavigation);
    }
  }, [user, isLoading]) // Re-run when user or loading state changes

  if (isLoading) {
    return (
      // FIX: Added flex and overflow-hidden to loading state container
      <div className="w-64 bg-gray-800 text-white flex flex-col overflow-hidden">
        <div className="p-4 text-xl font-semibold border-b border-gray-700 flex-shrink-0">Bizzy POS</div>
        <nav className="mt-6 flex-1 overflow-hidden">
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
    // FIX: Main container is now a flex column that takes full height and hides overflow
    <div className="w-64 bg-gray-800 text-white flex flex-col h-full overflow-hidden">
      {/* FIX: Logo/header section is fixed and does not scroll */}
      <div className="p-4 text-xl font-semibold border-b border-gray-700 flex-shrink-0">Bizzy POS</div>

      {/* FIX: Navigation section is flexible and will scroll if content overflows */}
      <nav className="flex-1 overflow-y-auto">
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
