
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../hooks/useAuth';

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();

  // Mock data - will be replaced with real API calls
  const dashboardData = {
    salesToday: {
      total: 1250.75,
      transactions: 18,
      average: 69.48
    },
    inventoryAlerts: 3,
    lowStockItems: [
      { id: 1, name: 'Coca-Cola 330ml', current: 5, min: 10 },
      { id: 2, name: 'Lays Classic Chips', current: 3, min: 5 },
      { id: 3, name: 'Red Bull 250ml', current: 2, min: 6 }
    ],
    recentSales: [
      { id: 1001, amount: 45.50, time: '2:30 PM', items: 3 },
      { id: 1002, amount: 120.25, time: '2:15 PM', items: 5 },
      { id: 1003, amount: 28.99, time: '1:45 PM', items: 2 }
    ]
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.username}! Here's your business overview.</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sales Today Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Sales Today</h3>
              <p className="text-2xl font-bold text-gray-900">${dashboardData.salesToday.total.toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Transactions: </span>
              <span className="font-semibold">{dashboardData.salesToday.transactions}</span>
            </div>
            <div>
              <span className="text-gray-600">Average: </span>
              <span className="font-semibold">${dashboardData.salesToday.average.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Inventory Alerts Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Inventory Alerts</h3>
              <p className="text-2xl font-bold text-yellow-600">{dashboardData.inventoryAlerts}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link 
              to="/inventory" 
              className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
            >
              View low stock items →
            </Link>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link
              to="/pos"
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 block text-center"
            >
              New Sale
            </Link>
            <Link
              to="/products"
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 block text-center"
            >
              Add Product
            </Link>
            <Link
              to="/inventory"
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 block text-center"
            >
              Check Inventory
            </Link>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Items */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Low Stock Items</h3>
          <div className="space-y-3">
            {dashboardData.lowStockItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-red-50 rounded-md">
                <div>
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-600">
                    Stock: {item.current} / Min: {item.min}
                  </p>
                </div>
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                  Restock Needed
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link 
              to="/inventory" 
              className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Manage all inventory →
            </Link>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Sales</h3>
          <div className="space-y-3">
            {dashboardData.recentSales.map((sale) => (
              <div key={sale.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                <div>
                  <h4 className="font-medium text-gray-900">Sale #{sale.id}</h4>
                  <p className="text-sm text-gray-600">{sale.time} • {sale.items} items</p>
                </div>
                <span className="text-lg font-bold text-green-600">
                  ${sale.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link 
              to="/sales" 
              className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
            >
              View all sales →
            </Link>
          </div>
        </div>
      </div>

      {/* Role-based Admin Section */}
      {user?.role && ['admin', 'manager'].includes(user.role) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/users"
              className="p-4 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
            >
              <h4 className="font-medium text-blue-900">User Management</h4>
              <p className="text-sm text-blue-600">Manage staff accounts</p>
            </Link>
            <Link
              to="/reports"
              className="p-4 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
            >
              <h4 className="font-medium text-green-900">Reports</h4>
              <p className="text-sm text-green-600">View business analytics</p>
            </Link>
            <Link
              to="/settings/business"
              className="p-4 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors"
            >
              <h4 className="font-medium text-purple-900">Business Settings</h4>
              <p className="text-sm text-purple-600">Configure your store</p>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
