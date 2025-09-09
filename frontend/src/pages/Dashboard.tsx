import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../hooks/useAuth';
import { useReports } from '../hooks/useReports';
import { useActivity } from '../hooks/useActivity'; // Added import
import SalesTrendChart from '../components/charts/SalesTrendChart';
import TopProductsChart from '../components/charts/TopProductsChart';
import SalesMetricsCards from '../components/SalesMetricsCards';
import { CurrencyDisplay } from '../components/CurrencyDisplay';
import './Dashboard.css'; // Ensure this file exists for custom styles if needed

const Dashboard: React.FC = () => {
  const { user, hasPermission } = useAuthStore();
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

  // Step 1: Add activity hook
  const { activities, loading: activitiesLoading, loadActivities } = useActivity();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Remove the isRefreshing state since it's no longer used
  // const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
  // Initial load
    loadDashboardMetrics();
    loadSalesTrends();
    loadTopProducts();
    loadActivities(); // Call it once on mount
    setLastUpdated(new Date());

    // Set up real-time updates every 30 seconds
    const dataInterval = setInterval(() => {
      loadDashboardMetrics();
      loadSalesTrends();
      loadTopProducts();
      loadActivities(); // Call it on each interval
      setLastUpdated(new Date());
    }, 30000);

    // Update time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);

    // Cleanup function
    return () => {
      clearInterval(dataInterval);
      clearInterval(timer);
    };
    // REMOVE loadActivities from the dependencies below.
    // Only include the functions from useReports that are stable.
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
      {/* Header with refresh status */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center gap-2">
            <p className="text-gray-600">
              Welcome back, {user?.username}! • {currentTime.toLocaleTimeString()}
            </p>
            {lastUpdated && (
              <span className="text-sm text-gray-400">
                • Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            {/* Remove the refresh indicator block */}
            {/* {isRefreshing && (
              <span className="text-sm text-blue-500 flex items-center gap-1">
                <span className="animate-spin">⟳</span>
                Updating...
              </span>
            )} */}
          </div>
        </div>
        <Link
          to="/reports"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
        >
          View Detailed Reports
        </Link>
      </div>

      {/* Sales Metrics Cards with custom className */}
      {dashboardMetrics?.sales_today && (
        <SalesMetricsCards
          metrics={{
            ...dashboardMetrics.sales_today,
            daily_sales: dashboardMetrics.sales_today.total_sales,
            weekly_sales: dashboardMetrics.weekly_financial?.total_revenue
          }}
          className="bg-white p-4 rounded-lg shadow dashboard-card"
        />
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesTrendChart
          data={salesTrends.map((trend) => ({
            date: trend.date,
            sales: trend.daily_sales,
            transactions: trend.transactions
          }))}
        />
        <TopProductsChart data={topProducts} />
      </div>

      {/* Quick Stats Grid with custom className */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Sales Today Card */}
        <div className="bg-white p-4 rounded-lg shadow dashboard-card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-2xl">💰</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Sales Today</h3>
              <p className="text-2xl font-bold text-gray-900">
                <CurrencyDisplay amount={dashboardMetrics?.sales_today?.total_sales || 0} />
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
                <CurrencyDisplay amount={dashboardMetrics?.sales_today?.average_transaction_value || 0} />
              </span>
            </div>
          </div>
        </div>

        {/* Inventory Alerts Card */}
        <div className="bg-white p-4 rounded-lg shadow dashboard-card">
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
        <div className="bg-white p-4 rounded-lg shadow dashboard-card">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-2xl">📈</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Weekly Revenue</h3>
              <p className="text-2xl font-bold text-gray-900">
                <CurrencyDisplay amount={dashboardMetrics?.weekly_financial?.total_revenue || 0} />
              </p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-600">Last 7 days</span>
          </div>
        </div>

        {/* Gross Margin Card */}
        <div className="bg-white p-4 rounded-lg shadow dashboard-card">
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

      {/* Quick Actions */}
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

      {/* Role-based section with permissions */}
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

      {/* Recent Activity Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          <button
            onClick={() => loadActivities()}
            className="text-sm text-indigo-600 hover:text-indigo-500"
            disabled={activitiesLoading}
          >
            {activitiesLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {activitiesLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Loading activities...</p>
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={`${activity.type}-${activity.id}`} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                  ${activity.type === 'sale' ? 'bg-green-100 text-green-600' : ''}
                  ${activity.type === 'inventory' ? 'bg-blue-100 text-blue-600' : ''}
                  ${activity.type === 'expense' ? 'bg-orange-100 text-orange-600' : ''}
                `}>
                  {activity.type === 'sale' && '💰'}
                  {activity.type === 'inventory' && '📦'}
                  {activity.type === 'expense' && '🧾'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No recent activity</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
