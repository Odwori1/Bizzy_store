import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../hooks/useAuth';
import { useReports } from '../hooks/useReports';
import SalesTrendChart from '../components/charts/SalesTrendChart';
import TopProductsChart from '../components/charts/TopProductsChart';
import SalesMetricsCards from '../components/SalesMetricsCards';
import { CurrencyDisplay } from '../components/CurrencyDisplay'; // ADD THIS IMPORT

const Dashboard: React.FC = () => {
  const { user, hasPermission } = useAuthStore(); // CHANGED: Added hasPermission
  const {
    dashboardMetrics,
    salesTrends,
    topProducts,
    loadDashboardMetrics,
    loadSalesTrends,
    loadTopProducts,
    loading,
    error
  } = useReports();

  const [currentTime, setCurrentTime] = useState(new Date());

  // Load real data on component mount
  useEffect(() => {
    loadDashboardMetrics();
    loadSalesTrends();
    loadTopProducts();

    // Update time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [loadDashboardMetrics, loadSalesTrends, loadTopProducts]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="text-center mt-4">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error loading dashboard: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {user?.username}! • {currentTime.toLocaleTimeString()}
          </p>
        </div>
        <Link
          to="/reports"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
        >
          View Detailed Reports
        </Link>
      </div>

      {/* Sales Metrics Cards */}
      {dashboardMetrics?.sales_today && (
        <SalesMetricsCards
          metrics={{
            ...dashboardMetrics.sales_today,
            daily_sales: dashboardMetrics.sales_today.total_sales,
            weekly_sales: dashboardMetrics.weekly_financial?.total_revenue
          }}
        />
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map salesTrends to the required chart data format */}
        <SalesTrendChart
          data={salesTrends.map((trend) => ({
            date: trend.date,
            sales: trend.daily_sales,
            transactions: trend.transactions
          }))}
        />
        <TopProductsChart data={topProducts} />
      </div>

      {/* Quick Stats Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Sales Today Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-2xl">💰</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Sales Today</h3>
              <p className="text-2xl font-bold text-gray-900">
                <CurrencyDisplay amount={dashboardMetrics?.sales_today?.total_sales || 0} /> {/* CHANGED */}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Transactions: </span>
              <span className="font-semibold">
                {dashboardMetrics?.sales_today?.total_transactions || 0}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Average: </span>
              <span className="font-semibold">
                <CurrencyDisplay amount={dashboardMetrics?.sales_today?.average_transaction_value || 0} /> {/* CHANGED */}
              </span>
            </div>
          </div>
        </div>

        {/* Inventory Alerts Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Inventory Alerts</h3>
              <p className="text-2xl font-bold text-yellow-600">
                {dashboardMetrics?.inventory_alerts || 0}
              </p>
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

        {/* Weekly Revenue Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-2xl">📈</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Weekly Revenue</h3>
              <p className="text-2xl font-bold text-gray-900">
                <CurrencyDisplay amount={dashboardMetrics?.weekly_financial?.total_revenue || 0} /> {/* CHANGED */}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600">Last 7 days</span>
          </div>
        </div>

        {/* Gross Margin Card */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Gross Margin</h3>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardMetrics?.weekly_financial?.gross_margin?.toFixed(1) || '0.0'}%
              </p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600">Weekly average</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/pos"
            className="bg-indigo-600 text-white p-4 rounded-md text-center hover:bg-indigo-700 transition-colors"
          >
            <div className="text-2xl mb-2">🛒</div>
            <p className="text-sm font-medium">Point of Sale</p>
          </Link>
          <Link
            to="/inventory"
            className="bg-green-600 text-white p-4 rounded-md text-center hover:bg-green-700 transition-colors"
          >
            <div className="text-2xl mb-2">📦</div>
            <p className="text-sm font-medium">Inventory</p>
          </Link>
          <Link
            to="/products"
            className="bg-blue-600 text-white p-4 rounded-md text-center hover:bg-blue-700 transition-colors"
          >
            <div className="text-2xl mb-2">🏷️</div>
            <p className="text-sm font-medium">Products</p>
          </Link>
          <Link
            to="/reports"
            className="bg-purple-600 text-white p-4 rounded-md text-center hover:bg-purple-700 transition-colors"
          >
            <div className="text-2xl mb-2">📋</div>
            <p className="text-sm font-medium">Reports</p>
          </Link>
        </div>
      </div>

      {/* Role-based section now uses permission check */}
      {(hasPermission('user:read') || hasPermission('report:view')) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {hasPermission('user:read') && (
              <Link
                to="/users"
                className="p-4 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
              >
                <h4 className="font-medium text-blue-900">User Management</h4>
                <p className="text-sm text-blue-600">Manage staff accounts</p>
              </Link>
            )}
            {hasPermission('report:view') && (
              <Link
                to="/reports"
                className="p-4 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
              >
                <h4 className="font-medium text-green-900">Reports</h4>
                <p className="text-sm text-green-600">View business analytics</p>
              </Link>
            )}
            {hasPermission('business:update') && (
              <Link
                to="/settings/business"
                className="p-4 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors"
              >
                <h4 className="font-medium text-purple-900">Business Settings</h4>
                <p className="text-sm text-purple-600">Configure your store</p>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Recent Activity Placeholder */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <p className="text-gray-500">Recent sales and inventory changes will appear here once we implement the activity feed.</p>
      </div>
    </div>
  );
};

export default Dashboard;
