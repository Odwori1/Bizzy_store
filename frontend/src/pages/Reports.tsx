import React, { useState } from 'react';
import { useReports } from '../hooks/useReports';
import { ReportFormat } from '../types';
import { reportsService } from '../services/reports'; // ADD THIS IMPORT

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

  const [activeTab, setActiveTab] = useState<'sales' | 'inventory' | 'financial'>('sales');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [exportFormat, setExportFormat] = useState<ReportFormat>('json');
  const [exportLoading, setExportLoading] = useState(false);

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
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
      }

      // Trigger download
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
      <div className="p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="text-center mt-4">Loading report data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error loading reports: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Reports</h1>
          <p className="text-gray-600">Comprehensive analytics and insights for your business</p>
        </div>
      </div>

      {/* Report Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {(['sales', 'inventory', 'financial'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)} Reports
              </button>
            ))}
          </div>

          {/* Date Range Filter */}
          {(activeTab === 'sales' || activeTab === 'financial') && (
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <span className="text-gray-600">to</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={loadReport}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
            >
              Generate Report
            </button>

            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as ReportFormat)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="json">JSON</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>

            <button
              onClick={handleExport}
              disabled={exportLoading}
              className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {exportLoading ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="mt-6">
          {activeTab === 'sales' && salesReport && (
            <SalesReportView report={salesReport} />
          )}

          {activeTab === 'inventory' && inventoryReport && (
            <InventoryReportView report={inventoryReport} />
          )}

          {activeTab === 'financial' && financialReport && (
            <FinancialReportView report={financialReport} />
          )}

          {!salesReport && !inventoryReport && !financialReport && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Generated</h3>
              <p className="text-gray-600">Select a report type and click "Generate Report" to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Enhanced Sales Report Component
const SalesReportView: React.FC<{ report: any }> = ({ report }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h3 className="text-xl font-semibold text-gray-900">Sales Report</h3>
      <span className="text-sm text-gray-600">
        {report.date_range.start_date} to {report.date_range.end_date}
      </span>
    </div>

    {/* Summary Cards */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-600">Total Sales</p>
        <p className="text-2xl font-bold text-blue-900">${report.summary.total_sales.toFixed(2)}</p>
      </div>
      <div className="bg-green-50 p-4 rounded-lg">
        <p className="text-sm text-green-600">Transactions</p>
        <p className="text-2xl font-bold text-green-900">{report.summary.total_transactions}</p>
      </div>
      <div className="bg-purple-50 p-4 rounded-lg">
        <p className="text-sm text-purple-600">Average Order</p>
        <p className="text-2xl font-bold text-purple-900">${report.summary.average_transaction_value.toFixed(2)}</p>
      </div>
      <div className="bg-orange-50 p-4 rounded-lg">
        <p className="text-sm text-orange-600">Tax Collected</p>
        <p className="text-2xl font-bold text-orange-900">${report.summary.total_tax.toFixed(2)}</p>
      </div>
    </div>

    {/* Top Products */}
    <div>
      <h4 className="text-lg font-medium text-gray-900 mb-4">Top Selling Products</h4>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity Sold</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margin</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {report.top_products.map((product: any, index: number) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {product.product_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.quantity_sold}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${product.total_revenue.toFixed(2)}
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

    {/* Sales Trends */}
    <div>
      <h4 className="text-lg font-medium text-gray-900 mb-4">Sales Trends</h4>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Daily Sales</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transactions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg. Order Value</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {report.sales_trends.map((trend: any, index: number) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trend.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${trend.daily_sales.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trend.transactions}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${trend.average_order_value.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// Enhanced Inventory Report Component
const InventoryReportView: React.FC<{ report: any }> = ({ report }) => (
  <div className="space-y-6">
    <h3 className="text-xl font-semibold text-gray-900">Inventory Report</h3>

    {/* Summary Cards */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-600">Total Products</p>
        <p className="text-2xl font-bold text-blue-900">{report.summary.total_products}</p>
      </div>
      <div className="bg-green-50 p-4 rounded-lg">
        <p className="text-sm text-green-600">Stock Value</p>
        <p className="text-2xl font-bold text-green-900">${report.summary.total_stock_value.toFixed(2)}</p>
      </div>
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-sm text-red-600">Low Stock Items</p>
        <p className="text-2xl font-bold text-red-900">{report.summary.low_stock_items}</p>
      </div>
      <div className="bg-orange-50 p-4 rounded-lg">
        <p className="text-sm text-orange-600">Out of Stock</p>
        <p className="text-2xl font-bold text-orange-900">{report.summary.out_of_stock_items}</p>
      </div>
    </div>

    {/* Low Stock Alerts */}
    {report.low_stock_alerts.length > 0 && (
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Low Stock Alerts</h4>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-red-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase">Minimum Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {report.low_stock_alerts.map((alert: any, index: number) => (
                <tr key={index} className="hover:bg-red-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{alert.product_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-bold">{alert.current_stock}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{alert.min_stock_level}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-bold bg-red-100 text-red-800 rounded-full">Needs Restock</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}

    {/* Stock Movements */}
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
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                    movement.movement_type === 'restock'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {movement.movement_type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${movement.value.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{movement.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// Enhanced Financial Report Component
const FinancialReportView: React.FC<{ report: any }> = ({ report }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h3 className="text-xl font-semibold text-gray-900">Financial Report</h3>
      <span className="text-sm text-gray-600">
        {report.date_range.start_date} to {report.date_range.end_date}
      </span>
    </div>

    {/* Financial Summary */}
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-600">Total Revenue</p>
        <p className="text-2xl font-bold text-blue-900">${report.summary.total_revenue.toFixed(2)}</p>
      </div>
      <div className="bg-green-50 p-4 rounded-lg">
        <p className="text-sm text-green-600">Gross Profit</p>
        <p className="text-2xl font-bold text-green-900">${report.summary.gross_profit.toFixed(2)}</p>
      </div>
      <div className="bg-purple-50 p-4 rounded-lg">
        <p className="text-sm text-purple-600">Gross Margin</p>
        <p className="text-2xl font-bold text-purple-900">{report.summary.gross_margin.toFixed(1)}%</p>
      </div>
      <div className="bg-orange-50 p-4 rounded-lg">
        <p className="text-sm text-orange-600">COGS</p>
        <p className="text-2xl font-bold text-orange-900">${report.summary.cogs.toFixed(2)}</p>
      </div>
      <div className="bg-red-50 p-4 rounded-lg">
        <p className="text-sm text-red-600">Tax Collected</p>
        <p className="text-2xl font-bold text-red-900">${report.summary.tax_collected.toFixed(2)}</p>
      </div>
      <div className="bg-indigo-50 p-4 rounded-lg">
        <p className="text-sm text-indigo-600">Net Profit</p>
        <p className="text-2xl font-bold text-indigo-900">${report.summary.net_profit.toFixed(2)}</p>
      </div>
    </div>

    {/* Profitability Analysis */}
    <div>
      <h4 className="text-lg font-medium text-gray-900 mb-4">Product Profitability</h4>
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
            {report.profitability.map((product: any, index: number) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.product_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.revenue.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.cost.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.profit.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.margin.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Cash Flow */}
    <div>
      <h4 className="text-lg font-medium text-gray-900 mb-4">Cash Flow Summary</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-green-600">Cash In</p>
          <p className="text-2xl font-bold text-green-900">${report.cash_flow.cash_in.toFixed(2)}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-red-600">Cash Out</p>
          <p className="text-2xl font-bold text-red-900">${report.cash_flow.cash_out.toFixed(2)}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-600">Net Cash Flow</p>
          <p className="text-2xl font-bold text-blue-900">${report.cash_flow.net_cash_flow.toFixed(2)}</p>
        </div>
      </div>
    </div>
  </div>
);

export default Reports;
