import React, { useState } from 'react';
import { useReports } from '../hooks/useReports';
//import { ReportFormat } from '../types';
import { ReportFormat } from '../types/reports';
import { reportsService } from '../services/reports';
import BackButton from '../components/BackButton';
import { CurrencyDisplay } from '../components/CurrencyDisplay';
import DailyScansChart from '../components/charts/DailyScansChart';
import UserActivityChart from '../components/charts/UserActivityChart';
import { useBusinessStore } from '../hooks/useBusiness'; // ADD THIS IMPORT
import { useCurrency } from '../hooks/useCurrency';

interface LowStockAlert {
  product_name: string;
  current_stock: number;
  min_stock_level: number;
}

interface StockMovement {
  product_name: string;
  movement_type: 'restock' | 'sale';
  quantity: number;
  value: number;
  date: string;
}

const Reports: React.FC = () => {
  const {
    salesReport,
    inventoryReport,
    financialReport,
    loading,
    error,
    loadSalesReport,
    loadInventoryReport,
    loadFinancialReport
  } = useReports();

  const [activeTab, setActiveTab] = useState<'sales' | 'inventory' | 'financial' | 'analytics'>('sales');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [exportFormat, setExportFormat] = useState<ReportFormat>('json');
  const [exportLoading, setExportLoading] = useState(false);

  const [analyticsData, setAnalyticsData] = useState<{
    dailyScans: Array<{ date: string; scan_count: number }>;
    userActivity: Array<{ user_id: number; username: string; scan_count: number }>;
  }>({
    dailyScans: [],
    userActivity: []
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const [dailyScansResponse, userActivityResponse] = await Promise.all([
        reportsService.getDailyScanStats(),
        reportsService.getUserActivityStats()
      ]);
      setAnalyticsData({
        dailyScans: dailyScansResponse.data,
        userActivity: userActivityResponse.data
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadReport = () => {
    switch (activeTab) {
      case 'sales':
        loadSalesReport(dateRange.startDate, dateRange.endDate);
        break;
      case 'inventory':
        loadInventoryReport();
        break;
      case 'financial':
        loadFinancialReport(dateRange.startDate, dateRange.endDate);
        break;
      case 'analytics':
        loadAnalytics();
        break;
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      let blob: Blob;
      let filename: string;

      switch (activeTab) {
        case 'sales':
          if (exportFormat === 'excel') {
            blob = await reportsService.exportSalesToExcel(dateRange.startDate, dateRange.endDate);
            filename = `sales_report_${dateRange.startDate}_to_${dateRange.endDate}.xlsx`;
          } else if (exportFormat === 'csv') {
            blob = await reportsService.exportSalesToCSV(dateRange.startDate, dateRange.endDate);
            filename = `sales_report_${dateRange.startDate}_to_${dateRange.endDate}.csv`;
          } else {
            const data = JSON.stringify(salesReport, null, 2);
            blob = new Blob([data], { type: 'application/json' });
            filename = `sales_report_${new Date().toISOString().split('T')[0]}.json`;
          }
          break;
        case 'inventory':
          if (exportFormat === 'excel') {
            blob = await reportsService.exportInventoryToExcel();
            filename = `inventory_report_${new Date().toISOString().split('T')[0]}.xlsx`;
          } else {
            const data = exportFormat === 'csv' ? convertToCSV(inventoryReport) : JSON.stringify(inventoryReport, null, 2);
            const fileType = exportFormat === 'csv' ? 'text/csv' : 'application/json';
            const extension = exportFormat === 'csv' ? 'csv' : 'json';
            blob = new Blob([data], { type: fileType });
            filename = `inventory_report_${new Date().toISOString().split('T')[0]}.${extension}`;
          }
          break;
        case 'financial':
          const data = exportFormat === 'csv' ? convertToCSV(financialReport) : JSON.stringify(financialReport, null, 2);
          const fileType = exportFormat === 'csv' ? 'text/csv' : 'application/json';
          const extension = exportFormat === 'csv' ? 'csv' : 'json';
          blob = new Blob([data], { type: fileType });
          filename = `financial_report_${dateRange.startDate}_to_${dateRange.endDate}.${extension}`;
          break;
        case 'analytics':
          alert('Export for analytics is not yet implemented');
          setExportLoading(false);
          return;
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const convertToCSV = (obj: any): string => {
    if (!obj) return '';
    const flattenObject = (ob: any): any => {
      const toReturn: any = {};
      for (const i in ob) {
        if (!ob.hasOwnProperty(i)) continue;
        if (typeof ob[i] === 'object' && ob[i] !== null) {
          const flatObject = flattenObject(ob[i]);
          for (const x in flatObject) {
            if (!flatObject.hasOwnProperty(x)) continue;
            toReturn[i + '.' + x] = flatObject[x];
          }
        } else {
          toReturn[i] = ob[i];
        }
      }
      return toReturn;
    };
    const flattened = flattenObject(obj);
    const headers = Object.keys(flattened).join(',');
    const values = Object.values(flattened).join(',');
    return `${headers}\n${values}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <p className="ml-4 text-gray-700 font-medium">Loading report data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg max-w-2xl w-full">
          {`Error loading reports: ${error}`}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Back Button */}
      <div className="mb-4">
        <BackButton />
      </div>

      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Reports</h1>
          <p className="text-gray-600">Comprehensive analytics and insights for your business</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        {/* Wrap controls in a flex container with flex-wrap to allow buttons to wrap */}
        <div className="flex flex-wrap gap-4 items-start lg:items-center">
          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg flex-shrink-0">
            {(['sales', 'inventory', 'financial', 'analytics'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                  activeTab === tab
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} {tab === 'analytics' ? '' : 'Reports'}
              </button>
            ))}
          </div>

          {/* Date Range (for sales & financial) */}
          {(activeTab === 'sales' || activeTab === 'financial') && (
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center flex-shrink-0">
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm w-full sm:w-auto"
                />
                <span className="text-gray-600 text-sm hidden sm:inline-block">to</span>
              </div>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm w-full sm:w-auto"
              />
            </div>
          )}

          {/* Action Buttons - group and allow wrapping */}
          <div className="flex flex-wrap gap-2 items-start flex-shrink-0">
            <button
              onClick={loadReport}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 transition text-sm whitespace-nowrap"
            >
              {activeTab === 'analytics' ? 'Load Analytics' : 'Generate Report'}
            </button>
            {activeTab !== 'analytics' && (
              <div className="flex flex-wrap gap-2 items-center">
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as ReportFormat)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full sm:w-auto"
                >
                  <option value="json">JSON</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                </select>
                <button
                  onClick={handleExport}
                  disabled={exportLoading}
                  className="bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition disabled:opacity-50 text-sm whitespace-nowrap flex-shrink-0"
                >
                  {exportLoading ? 'Exporting...' : 'Export'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-xl shadow p-6">
        {activeTab === 'sales' && salesReport && <SalesReportView report={salesReport} />}
        {activeTab === 'inventory' && inventoryReport && <InventoryReportView report={inventoryReport} />}
        {activeTab === 'financial' && financialReport && <FinancialReportView report={financialReport} />}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DailyScansChart data={analyticsData.dailyScans} />
              <UserActivityChart data={analyticsData.userActivity} />
            </div>
            {analyticsLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading analytics data...</p>
              </div>
            )}
            {!analyticsLoading && analyticsData.dailyScans.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No analytics data available yet. Start scanning barcodes to see data here.
              </div>
            )}
          </div>
        )}

        {!salesReport && !inventoryReport && !financialReport && activeTab !== 'analytics' && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">No Report Generated</h3>
            <p>Select a report type and click "Generate Report" to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

// SALES REPORT VIEW COMPONENT
const SalesReportView: React.FC<{ report: any }> = ({ report }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-xl font-semibold text-gray-900">Sales Report</h3>
      <span className="text-sm text-gray-600">
        {report.date_range?.start_date} to {report.date_range?.end_date}
      </span>
    </div>

    {/* Sales Summary Cards */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-600 mb-2">Total Sales</p>
        <p className="text-2xl font-bold text-blue-900">
          <CurrencyDisplay
            amount={report.summary?.total_sales || 0}
            originalAmount={report.summary?.total_sales_original || report.summary?.total_sales || 0}
            originalCurrencyCode={report.summary?.primary_currency}
            exchangeRateAtCreation={
              report.summary?.total_sales && report.summary?.total_sales_original
                ? report.summary.total_sales / report.summary.total_sales_original
                : 1
            }
            preserveOriginal={true}
          />
        </p>
      </div>
      <div className="bg-green-50 p-4 rounded-lg">
        <p className="text-sm text-green-600 mb-2">Total Tax</p>
        <p className="text-2xl font-bold text-green-900">
          <CurrencyDisplay
            amount={report.summary?.total_tax || 0}
            originalAmount={report.summary?.total_tax_original || report.summary?.total_tax || 0}
            originalCurrencyCode={report.summary?.primary_currency}
            exchangeRateAtCreation={
              report.summary?.total_sales && report.summary?.total_sales_original
                ? report.summary.total_sales / report.summary.total_sales_original
                : 1
            }
            preserveOriginal={true}
          />
        </p>
      </div>
      <div className="bg-purple-50 p-4 rounded-lg">
        <p className="text-sm text-purple-600 mb-2">Transactions</p>
        <p className="text-2xl font-bold text-purple-900">{report.summary?.total_transactions || 0}</p>
      </div>
      <div className="bg-orange-50 p-4 rounded-lg">
        <p className="text-sm text-orange-600 mb-2">Avg. Order Value</p>
        <p className="text-2xl font-bold text-orange-900">
          <CurrencyDisplay
            amount={report.summary?.average_transaction_value || 0}
            originalAmount={
              report.summary?.total_sales_original && report.summary?.total_transactions
                ? report.summary.total_sales_original / report.summary.total_transactions
                : 0
            }
            originalCurrencyCode={report.summary?.primary_currency}
            exchangeRateAtCreation={
              report.summary?.total_sales && report.summary?.total_sales_original
                ? report.summary.total_sales / report.summary.total_sales_original
                : 1
            }
            preserveOriginal={true}
          />
        </p>
      </div>
    </div>

    {/* Payment Methods */}
    {report.summary?.payment_methods && Object.keys(report.summary.payment_methods).length > 0 && (
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(report.summary.payment_methods).map(([method, amount]: [string, any]) => (
            <div key={method} className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2 capitalize">{method.replace('_', ' ')}</p>
              <p className="text-xl font-bold text-gray-900">
                <CurrencyDisplay
                  amount={amount}
                  originalAmount={amount}
                  originalCurrencyCode={report.summary?.primary_currency}
                  exchangeRateAtCreation={1}
                  preserveOriginal={true}
                />
              </p>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Top Products */}
    {report.top_products && report.top_products.length > 0 && (
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Top Selling Products</h4>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity Sold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profit Margin</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {report.top_products.map((product: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.product_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.quantity_sold}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <CurrencyDisplay
                      amount={product.total_revenue || 0}
                      originalAmount={product.total_revenue_original || product.total_revenue || 0}
                      originalCurrencyCode={report.summary?.primary_currency}
                      exchangeRateAtCreation={
                        product.total_revenue && product.total_revenue_original
                          ? product.total_revenue / product.total_revenue_original
                          : 1
                      }
                      preserveOriginal={true}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.profit_margin?.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}

    {/* Sales Trends */}
    {report.sales_trends && report.sales_trends.length > 0 && (
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Sales Trends</h4>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transactions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg. Order Value</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {report.sales_trends.map((trend: any, index: number) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{trend.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <CurrencyDisplay
                      amount={trend.daily_sales || 0}
                      originalAmount={trend.daily_sales_original || trend.daily_sales || 0}
                      originalCurrencyCode={report.summary?.primary_currency}
                      exchangeRateAtCreation={
                        trend.daily_sales && trend.daily_sales_original
                          ? trend.daily_sales / trend.daily_sales_original
                          : 1
                      }
                      preserveOriginal={true}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trend.transactions}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <CurrencyDisplay
                      amount={trend.average_order_value || 0}
                      originalAmount={
                        trend.daily_sales_original && trend.transactions
                          ? trend.daily_sales_original / trend.transactions
                          : 0
                      }
                      originalCurrencyCode={report.summary?.primary_currency}
                      exchangeRateAtCreation={
                        trend.daily_sales && trend.daily_sales_original
                          ? trend.daily_sales / trend.daily_sales_original
                          : 1
                      }
                      preserveOriginal={true}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
);

// InventoryReportView Component - PROPER FIX WITH DUAL CURRENCY
const InventoryReportView: React.FC<{ report: any }> = ({ report }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Inventory Report</h3>
        <span className="text-sm text-gray-600">As of {new Date().toLocaleDateString()}</span>
      </div>

      {/* Inventory Summary Cards - FIXED WITH DUAL CURRENCY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600 mb-2">Total Products</p>
          <p className="text-2xl font-bold text-blue-900">{report.summary?.total_products || 0}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600 mb-2">Stock Value</p>
          <p className="text-2xl font-bold text-green-900">
            {/* FIXED: Use exact same pattern as Sales Report */}
            <CurrencyDisplay
              amount={report.summary?.total_stock_value || 0}
              originalAmount={report.summary?.total_stock_value_original || report.summary?.total_stock_value || 0}
              originalCurrencyCode={report.summary?.primary_currency}
              exchangeRateAtCreation={
                report.summary?.total_stock_value && report.summary?.total_stock_value_original
                  ? report.summary.total_stock_value / report.summary.total_stock_value_original
                  : 1
              }
              preserveOriginal={true}
            />
          </p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <p className="text-sm text-orange-600 mb-2">Low Stock Items</p>
          <p className="text-2xl font-bold text-orange-900">{report.summary?.low_stock_items || 0}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-red-600 mb-2">Out of Stock</p>
          <p className="text-2xl font-bold text-red-900">{report.summary?.out_of_stock_items || 0}</p>
        </div>
      </div>

      {/* Stock Movements - FIXED WITH DUAL CURRENCY */}
      {report.stock_movements && report.stock_movements.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Recent Stock Movements</h4>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Movement Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {report.stock_movements.map((movement: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{movement.product_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{movement.movement_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{movement.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {/* FIXED: Use exact same pattern as Sales Report */}
                      <CurrencyDisplay
                        amount={movement.value}
                        originalAmount={movement.value_original || movement.value}
                        originalCurrencyCode={movement.original_currency_code}
                        exchangeRateAtCreation={movement.exchange_rate_at_creation}
                        preserveOriginal={true}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(movement.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// FinancialReportView Component - CORRECTED FIELD NAMES
const FinancialReportView: React.FC<{ report: any }> = ({ report }) => {
  // Get primary currency from the financial report itself
  const primaryCurrency = report.summary?.primary_currency || 'UGX';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Financial Report</h3>
        <span className="text-sm text-gray-600">
          {report.date_range?.start_date} to {report.date_range?.end_date}
        </span>
      </div>

      {/* Financial Summary Cards - CORRECTED */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600 mb-2">Total Revenue</p>
          <p className="text-2xl font-bold text-blue-900">
            <CurrencyDisplay
              amount={report.summary?.total_revenue || 0}
              originalAmount={report.summary?.total_revenue_original || 0}
              originalCurrencyCode={primaryCurrency}
              exchangeRateAtCreation={report.summary?.exchange_rate || 1}
              preserveOriginal={true}
            />
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600 mb-2">Gross Profit</p>
          <p className="text-2xl font-bold text-green-900">
            <CurrencyDisplay
              amount={report.summary?.gross_profit || 0}
              originalAmount={report.summary?.gross_profit_original || 0}
              originalCurrencyCode={primaryCurrency}
              exchangeRateAtCreation={report.summary?.exchange_rate || 1}
              preserveOriginal={true}
            />
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm text-purple-600 mb-2">Net Profit</p>
          <p className="text-2xl font-bold text-purple-900">
            <CurrencyDisplay
              amount={report.summary?.net_profit || 0}
              originalAmount={report.summary?.net_profit_original || 0}
              originalCurrencyCode={primaryCurrency}
              exchangeRateAtCreation={report.summary?.exchange_rate || 1}
              preserveOriginal={true}
            />
          </p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <p className="text-sm text-orange-600 mb-2">Gross Margin</p>
          <p className="text-2xl font-bold text-orange-900">
            {report.summary?.gross_margin?.toFixed(1) || 0}%
          </p>
        </div>
      </div>

      {/* Profitability Analysis - CORRECTED */}
      {report.profitability && report.profitability.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Profitability by Product</h4>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margin</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {report.profitability.map((item: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.product_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <CurrencyDisplay
                        amount={item.revenue || 0}
                        originalAmount={item.revenue_original || 0}
                        originalCurrencyCode={primaryCurrency}
                        exchangeRateAtCreation={item.exchange_rate_revenue || 1}
                        preserveOriginal={true}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <CurrencyDisplay
                        amount={item.cost || 0}
                        originalAmount={item.cost_original || 0}
                        originalCurrencyCode={primaryCurrency}
                        exchangeRateAtCreation={item.exchange_rate_cost || 1}
                        preserveOriginal={true}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <CurrencyDisplay
                        amount={item.profit || 0}
                        originalAmount={item.profit_original || 0}
                        originalCurrencyCode={primaryCurrency}
                        exchangeRateAtCreation={item.exchange_rate_profit || 1}
                        preserveOriginal={true}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.margin?.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cash Flow Summary - CORRECTED */}
      {report.cash_flow && (
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Cash Flow Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 mb-2">Cash In</p>
              <p className="text-2xl font-bold text-green-900">
                <CurrencyDisplay
                  amount={report.cash_flow.cash_in || 0}
                  originalAmount={report.cash_flow.cash_in_original || 0}
                  originalCurrencyCode={primaryCurrency}
                  exchangeRateAtCreation={report.cash_flow.cash_in_exchange_rate || 1}
                  preserveOriginal={true}
                />
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-600 mb-2">Cash Out</p>
              <p className="text-2xl font-bold text-red-900">
                <CurrencyDisplay
                  amount={report.cash_flow.cash_out || 0}
                  originalAmount={report.cash_flow.cash_out_original || 0}
                  originalCurrencyCode={primaryCurrency}
                  exchangeRateAtCreation={report.cash_flow.cash_out_exchange_rate || 1}
                  preserveOriginal={true}
                />
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 mb-2">Net Cash Flow</p>
              <p className="text-2xl font-bold text-blue-900">
                <CurrencyDisplay
                  amount={report.cash_flow.net_cash_flow || 0}
                  originalAmount={report.cash_flow.net_cash_flow_original || 0}
                  originalCurrencyCode={primaryCurrency}
                  exchangeRateAtCreation={report.cash_flow.net_cash_flow_exchange_rate || 1}
                  preserveOriginal={true}
                />
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expense Breakdown - CORRECTED FIELD NAMES */}
      {report.expense_breakdown && report.expense_breakdown.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Expense Breakdown</h4>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {report.expense_breakdown.map((expense: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{expense.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <CurrencyDisplay
                        amount={expense.amount || 0}
                        originalAmount={expense.amount_original || 0}
                        originalCurrencyCode={primaryCurrency}
                        exchangeRateAtCreation={expense.exchange_rate || 1}
                        preserveOriginal={true}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.percentage?.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
