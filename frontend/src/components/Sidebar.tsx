import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const Sidebar: React.FC = () => {
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'POS', href: '/pos', icon: '🛒' },
    { name: 'Sales', href: '/sales', icon: '📋' },
    { name: 'Products', href: '/products', icon: '📦' },
    { name: 'Inventory', href: '/inventory', icon: '📊' },
    { name: 'Reports', href: '/reports', icon: '📈' },
    { name: 'Business Settings', href: '/settings/business', icon: '⚙️' }, // ADD THIS LINE
  ]

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
