import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../hooks/useAuth';
import { useReports } from '../hooks/useReports';
import SalesTrendChart from '../components/charts/SalesTrendChart';
import TopProductsChart from '../components/charts/TopProductsChart';
import { standaloneActivityService } from '../utils/activityService';
import { CurrencyDisplay } from '../components/CurrencyDisplay';
import { Activity } from '../types';

const Dashboard: React.FC = () => {
  const { user, hasPermission } = useAuthStore();
  const {
    dashboardMetrics,
    salesTrends,
    topProducts,
    loading,
    error,
    loadDashboardMetrics,
    loadSalesTrends,
    loadTopProducts,
  } = useReports();

  // ADD DEBUG LOGGING
  useEffect(() => {
    if (dashboardMetrics) {
      console.log('DASHBOARD DEBUG - dashboardMetrics:', dashboardMetrics);
      console.log('DASHBOARD DEBUG - Weekly Financial:', dashboardMetrics.weekly_financial);
      console.log('DASHBOARD DEBUG - Sales Today:', dashboardMetrics.sales_today);
    }
  }, [dashboardMetrics]);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  const loadActivities = async () => {
    setActivitiesLoading(true);
    setActivitiesError(null);
    try {
      const response = await standaloneActivityService.getRecentActivities(24, 10);
      setActivities(response.activities || []);
    } catch (error: any) {
      console.error('Failed to load activities:', error);
      setActivitiesError('Failed to load recent activities');
      setActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    loadDashboardMetrics();
    loadSalesTrends();
    loadTopProducts();
    loadActivities();
    setLastUpdated(new Date());

    // Set up real-time updates every 30 seconds
    const dataInterval = setInterval(() => {
      loadDashboardMetrics();
      loadSalesTrends();
      loadTopProducts();
      loadActivities();
      setLastUpdated(new Date());
    }, 30000);

    // Update time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);

    return () => {
      clearInterval(dataInterval);
      clearInterval(timer);
    };
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
          <div className="flex items-center gap-2">
            <p className="text-gray-600">
              Welcome back, {user?.username}! • {currentTime.toLocaleTimeString()}
            </p>
            {lastUpdated && (
              <span className="text-sm text-gray-400">
                • Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        <Link
          to="/reports"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
        >
          View Detailed Reports
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Today's Sales Card */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Sales</p>
              <p className="text-2xl font-bold text-gray-900">
                <CurrencyDisplay
                  amount={dashboardMetrics?.sales_today?.total_sales || 0}
                  originalAmount={dashboardMetrics?.sales_today?.total_sales_original || 0}
                  originalCurrencyCode={dashboardMetrics?.sales_today?.primary_currency}
                  preserveOriginal={true}
                />
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        {/* Weekly Revenue Card */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Weekly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                <CurrencyDisplay
                  amount={dashboardMetrics?.weekly_financial?.total_revenue || 0}
                  originalAmount={dashboardMetrics?.weekly_financial?.total_revenue_original || 0}
                  originalCurrencyCode={dashboardMetrics?.weekly_financial?.total_revenue_original > 1000 ? "UGX" : "USD"}
                  exchangeRateAtCreation={dashboardMetrics?.weekly_financial?.exchange_rate || 1}
                  preserveOriginal={true}
                />
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
              <span className="text-2xl">📈</span>
            </div>
          </div>
        </div>

        {/* Average Transaction Card */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Transaction</p>
              <p className="text-2xl font-bold text-gray-900">
                <CurrencyDisplay
                  amount={dashboardMetrics?.sales_today?.average_transaction_value || 0}
                  originalAmount={
                    dashboardMetrics?.sales_today?.total_sales_original &&
                    dashboardMetrics?.sales_today?.total_transactions
                      ? dashboardMetrics.sales_today.total_sales_original /
                        dashboardMetrics.sales_today.total_transactions
                      : 0
                  }
                  originalCurrencyCode={dashboardMetrics?.sales_today?.primary_currency}
                  preserveOriginal={true}
                />
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

        {/* Total Transactions Card */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardMetrics?.sales_today?.total_transactions || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
              <span className="text-2xl">🛒</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesTrendChart
          data={salesTrends.map((trend) => ({
            date: trend.date,
            sales: trend.sales,
            transactions: trend.transactions,
          }))}
        />
        <TopProductsChart data={topProducts} />
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

      {/* Role-based Admin Overview */}
      {(hasPermission('user:read') || hasPermission('report:view') || hasPermission('business:update')) && (
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

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          <button
            onClick={loadActivities}
            className="text-sm text-indigo-600 hover:text-indigo-500"
            disabled={activitiesLoading}
          >
            {activitiesLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {activitiesError && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
            {activitiesError}
          </div>
        )}

        {activitiesLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Loading activities...</p>
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                    ${activity.type === 'sale' ? 'bg-green-100 text-green-600' : ''}
                    ${activity.type === 'inventory' ? 'bg-blue-100 text-blue-600' : ''}
                    ${activity.type === 'expense' ? 'bg-orange-100 text-orange-600' : ''}
                    ${activity.type === 'user' ? 'bg-purple-100 text-purple-600' : ''}
                    ${activity.type === 'system' ? 'bg-gray-100 text-gray-600' : ''}
                  `}
                >
                  {activity.type === 'sale' && '💰'}
                  {activity.type === 'inventory' && '📦'}
                  {activity.type === 'expense' && '🧾'}
                  {activity.type === 'user' && '👤'}
                  {activity.type === 'system' && '⚙️'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">
                    {activity.amount !== undefined && activity.amount !== null && (
                      <CurrencyDisplay
                        amount={activity.usd_amount || 0}
                        originalAmount={activity.amount}
                        originalCurrencyCode={activity.currency_code}
                        exchangeRateAtCreation={activity.exchange_rate || 1}
                        preserveOriginal={true}
                      />
                    )}
                    {activity.username && ` • by ${activity.username}`}
                    <span className="ml-2 text-xs text-gray-400">
                      {new Date(activity.timestamp || activity.created_at).toLocaleTimeString()}
                    </span>
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
