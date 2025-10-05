import React, { useState, useEffect } from 'react';
import { SaleSummary, Sale } from '../types';
import { salesService } from '../services/sales';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import BackButton from '../components/BackButton';
import RefundModal from '../components/RefundModal';
import { CurrencyDisplay } from '../components/CurrencyDisplay';
// Import the business store hook
import { useBusinessStore } from '../hooks/useBusiness';

export default function Sales() {
  const [sales, setSales] = useState<SaleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('all');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedSaleForRefund, setSelectedSaleForRefund] = useState<Sale | null>(null);
  const navigate = useNavigate();

  // Load business data
  const { business } = useBusinessStore();

  // Load sales data on component mount
  useEffect(() => {
    loadSales();
  }, []);

  // Load business data
  useEffect(() => {
    useBusinessStore.getState().loadBusiness();
  }, []);

  const loadSales = async () => {
    try {
      setLoading(true);
      const salesData = await salesService.getSales();
      setSales(salesData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load sales');
      console.error('Error loading sales:', err);
    } finally {
      setLoading(false);
    }
  };

  // 🆕 FIXED: loadSaleDetails function - properly combine user name
  const loadSaleDetails = async (saleId: number) => {
    try {
      // Get the sale from the current list to get user_name
      const saleFromList = sales.find(s => s.id === saleId);
      const saleDetails = await salesService.getSale(saleId);
      
      // 🆕 CRITICAL FIX: Properly combine data from both sources
      const saleWithUser = {
        ...saleDetails,
        user_name: saleFromList?.user_name || 'Unknown', // Get from sales list
        business_sale_number: saleFromList?.business_sale_number // Preserve virtual numbering
      };
      
      setSelectedSale(saleWithUser);
      setShowDetailsModal(true);
    } catch (err: any) {
      console.error('Error loading sale details:', err);
      alert('Failed to load sale details');
    }
  };

  // Filter sales
  const filteredSales = sales.filter(sale => {
    const matchesSearch =
      searchTerm === '' ||
      sale.id.toString().includes(searchTerm) ||
      sale.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.total_amount.toString().includes(searchTerm);

    const saleDate = new Date(sale.created_at);
    const matchesStartDate = !startDate || saleDate >= new Date(startDate);
    const matchesEndDate = !endDate || saleDate <= new Date(endDate + 'T23:59:59');

    const matchesPaymentStatus =
      paymentStatus === 'all' || sale.payment_status === paymentStatus;

    return matchesSearch && matchesStartDate && matchesEndDate && matchesPaymentStatus;
  });

  // Calculate totals
  const calculateTotals = () => {
    let totalLocalRevenue = 0;
    let primaryCurrency = 'UGX';

    filteredSales.forEach(sale => {
      if (sale.original_amount && sale.original_currency) {
        totalLocalRevenue += sale.original_amount;
        primaryCurrency = sale.original_currency;
      } else {
        totalLocalRevenue += sale.total_amount;
      }
    });

    const totalTransactions = filteredSales.length;
    const averageLocalSale =
      totalTransactions > 0 ? totalLocalRevenue / totalTransactions : 0;

    return {
      totalLocalRevenue,
      primaryCurrency,
      totalTransactions,
      averageLocalSale,
    };
  };

  const {
    totalLocalRevenue,
    primaryCurrency,
    totalTransactions,
    averageLocalSale,
  } = calculateTotals();

  const exportToCSV = () => {
    const headers = ['Sale ID', 'Date', 'User', 'Total Amount', 'Tax', 'Payment Status', 'Currency'];
    const csvData = filteredSales.map(sale => [
      sale.id,
      format(new Date(sale.created_at), 'yyyy-MM-dd HH:mm'),
      sale.user_name || 'Unknown',
      (sale.original_amount || sale.total_amount).toFixed(2),
      (sale.tax_amount / (sale.exchange_rate_at_sale || 1)).toFixed(2),
      sale.payment_status,
      sale.original_currency || business?.currency_code || 'UGX',
    ]);
    const csvContent = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    const worksheetData = [
      ['Sale ID', 'Date', 'User', 'Total Amount', 'Tax', 'Payment Status', 'Currency'],
      ...filteredSales.map(sale => [
        sale.id,
        format(new Date(sale.created_at), 'yyyy-MM-dd HH:mm'),
        sale.user_name || 'Unknown',
        sale.original_amount || sale.total_amount,
        sale.tax_amount / (sale.exchange_rate_at_sale || 1),
        sale.payment_status,
        sale.original_currency || business?.currency_code || 'UGX',
      ]),
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Report');
    XLSX.writeFile(workbook, `sales-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Updated handleRefundClick function
  const handleRefundClick = async (saleId: number) => {
    try {
      // Use the sale object directly from the loaded list to preserve virtual numbering
      const saleFromList = sales.find(s => s.id === saleId);
      if (!saleFromList) {
        throw new Error('Sale not found in current list');
      }

      // Get minimal sale details needed for refund
      const saleDetails = await salesService.getSale(saleId);

      // Combine virtual numbering with full details
      const saleForRefund = {
        ...saleDetails,
        business_sale_number: saleFromList.business_sale_number,
        // Ensure all required fields are present
        sale_items: saleDetails.sale_items || [],
        payments: saleDetails.payments || [],
        original_currency: saleDetails.original_currency || saleFromList.original_currency,
        exchange_rate_at_sale: saleDetails.exchange_rate_at_sale || saleFromList.exchange_rate_at_sale
      };

      setSelectedSaleForRefund(saleForRefund);
      setRefundModalOpen(true);
    } catch (err: any) {
      console.error('Error loading sale for refund:', err);
      alert('Failed to load sale for refund');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 space-y-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg w-full max-w-md text-center">
          {error}
        </div>
        <button
          onClick={loadSales}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {/* Header */}
      <div className="mb-4">
        <BackButton />
      </div>
      {/* Title and back button */}
      <div className="max-w-6xl mx-auto mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales History</h1>
          <p className="text-gray-600">View and manage all sales transactions</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
        >
          ← Back
        </button>
      </div>

      {/* Export buttons */}
      <div className="max-w-6xl mx-auto mb-6 flex justify-end gap-3">
        <button
          onClick={exportToCSV}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 flex items-center gap-2"
        >
          Export CSV
        </button>
        <button
          onClick={exportToExcel}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
        >
          Export Excel
        </button>
      </div>

      {/* Stats cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Revenue */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Revenue</h3>
          <p className="text-2xl font-bold">
            <CurrencyDisplay
              amount={filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0)}
              originalAmount={filteredSales.reduce((sum, sale) => sum + (sale.original_amount || sale.total_amount), 0)}
              originalCurrencyCode={filteredSales[0]?.original_currency || business?.currency_code}
              exchangeRateAtCreation={filteredSales[0]?.exchange_rate_at_sale}
            />
          </p>
        </div>
        {/* Total Transactions */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Transactions</h3>
          <p className="text-2xl font-bold">{filteredSales.length}</p>
        </div>
        {/* Average Sale */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Average Sale</h3>
          <p className="text-2xl font-bold">
            <CurrencyDisplay
              amount={
                filteredSales.length > 0
                  ? filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0) / filteredSales.length
                  : 0
              }
              originalAmount={
                filteredSales.length > 0
                  ? filteredSales.reduce((sum, sale) => sum + (sale.original_amount || sale.total_amount), 0) / filteredSales.length
                  : 0
              }
              originalCurrencyCode={filteredSales[0]?.original_currency || business?.currency_code}
              exchangeRateAtCreation={filteredSales[0]?.exchange_rate_at_sale}
            />
          </p>
        </div>
      </div>

      {/* Sales table */}
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow overflow-x-auto mb-8">
        <h3 className="text-lg font-bold mb-4">Sales Transactions</h3>
        <p className="text-gray-600 mb-4">{filteredSales.length} sales found</p>
        <table className="min-w-full border-collapse border border-gray-200">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-2 text-left">Sale ID</th>
              <th className="p-2 text-left">Date & Time</th>
              <th className="p-2 text-left">User</th>
              <th className="p-2 text-left">Amount</th>
              <th className="p-2 text-left">Tax</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  No sales found matching your criteria
                </td>
              </tr>
            ) : (
              filteredSales.map((sale) => (
                <tr key={sale.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium">
                    Sale #{sale.business_sale_number}  {/* 🎯 USE VIRTUAL NUMBER */}
                  </td>
                  <td className="p-2">{format(new Date(sale.created_at), 'MMM dd, yyyy HH:mm')}</td>
                  <td className="p-2">{sale.user_name || 'Unknown'}</td>
                  <td className="p-2">
                    <CurrencyDisplay
                      amount={sale.total_amount}
                      originalAmount={sale.original_amount || sale.total_amount}
                      originalCurrencyCode={sale.original_currency || business?.currency_code}
                      exchangeRateAtCreation={sale.exchange_rate_at_sale}
                    />
                  </td>
                  <td className="p-2">
                    <CurrencyDisplay
                      amount={sale.tax_amount}
                      originalAmount={sale.tax_amount / (sale.exchange_rate_at_sale || 1)}
                      originalCurrencyCode={sale.original_currency || business?.currency_code}
                      exchangeRateAtCreation={sale.exchange_rate_at_sale}
                    />
                  </td>
                  <td className={`p-2`}>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(sale.payment_status)}`}
                    >
                      {sale.payment_status}
                    </span>
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => loadSaleDetails(sale.id)}
                      className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 mr-2"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleRefundClick(sale.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                      disabled={sale.payment_status === 'refunded'}
                    >
                      Refund
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Sale Details Modal */}
      {showDetailsModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {/* 🎯 USE VIRTUAL NUMBER */}
                Sale Details #{selectedSale.business_sale_number}
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Sale Info & Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold mb-2">Sale Information</h3>
                <p>
                  <strong>Date:</strong>{' '}
                  {format(new Date(selectedSale.created_at), 'PPP pp')}
                </p>
                <p>
                  <strong>User:</strong> {selectedSale.user_name || 'Unknown'} {/* 🆕 FIXED: Now shows correct user */}
                </p>
                <p>
                  <strong>Status:</strong>{' '}
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedSale.payment_status)}`}
                  >
                    {selectedSale.payment_status}
                  </span>
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Financial Summary</h3>
                {/* Subtotal */}
                <p>
                  <strong>Subtotal:</strong>{' '}
                  <CurrencyDisplay
                    amount={selectedSale.total_amount - selectedSale.tax_amount}
                    originalAmount={
                      selectedSale.original_amount
                        ? selectedSale.original_amount - (selectedSale.tax_amount / selectedSale.exchange_rate_at_sale)
                        : selectedSale.total_amount - selectedSale.tax_amount
                    }
                    originalCurrencyCode={selectedSale.original_currency || business?.currency_code}
                    exchangeRateAtCreation={selectedSale.exchange_rate_at_sale}
                  />
                </p>
                {/* Tax */}
                <p>
                  <strong>Tax:</strong>{' '}
                  <CurrencyDisplay
                    amount={selectedSale.tax_amount}
                    originalAmount={selectedSale.tax_amount / (selectedSale.exchange_rate_at_sale || 1)}
                    originalCurrencyCode={selectedSale.original_currency || business?.currency_code}
                    exchangeRateAtCreation={selectedSale.exchange_rate_at_sale}
                  />
                </p>
                {/* Total */}
                <p>
                  <strong>Total:</strong>{' '}
                  <CurrencyDisplay
                    amount={selectedSale.total_amount}
                    originalAmount={selectedSale.original_amount || selectedSale.total_amount}
                    originalCurrencyCode={selectedSale.original_currency || business?.currency_code}
                    exchangeRateAtCreation={selectedSale.exchange_rate_at_sale}
                  />
                </p>
              </div>
            </div>

            {/* Items Sold */}
            <h3 className="font-semibold mb-3">Items Sold</h3>
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="p-2 text-left">Product</th>
                    <th className="p-2 text-left">Quantity</th>
                    <th className="p-2 text-left">Unit Price</th>
                    <th className="p-2 text-left">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSale.sale_items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{item.product_name}</td>
                      <td className="p-2">{item.quantity}</td>
                      <td className="p-2">
                        <CurrencyDisplay
                          amount={item.unit_price}
                          originalAmount={item.original_unit_price}
                          originalCurrencyCode={selectedSale.original_currency || business?.currency_code}
                          exchangeRateAtCreation={item.exchange_rate_at_creation || selectedSale.exchange_rate_at_sale}
                        />
                      </td>
                      <td className="p-2">
                        <CurrencyDisplay
                          amount={item.subtotal}
                          originalAmount={item.original_subtotal}
                          originalCurrencyCode={selectedSale.original_currency || business?.currency_code}
                          exchangeRateAtCreation={item.exchange_rate_at_creation || selectedSale.exchange_rate_at_sale}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Payments */}
            <h3 className="font-semibold mb-3">Payments</h3>
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="p-2 text-left">Method</th>
                    <th className="p-2 text-left">Amount</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Transaction ID</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSale.payments.map((payment, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 capitalize">{payment.payment_method}</td>
                      <td className="p-2">
                        <CurrencyDisplay
                          amount={payment.amount}
                          originalAmount={payment.original_amount}
                          originalCurrencyCode={payment.original_currency}
                          exchangeRateAtCreation={payment.exchange_rate_at_payment}
                          preserveOriginal={true}
                        />
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="p-2">{payment.transaction_id || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Close Button */}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {selectedSaleForRefund && (
        <RefundModal
          sale={selectedSaleForRefund}
          isOpen={refundModalOpen}
          onClose={() => {
            setRefundModalOpen(false);
            setSelectedSaleForRefund(null);
          }}
          onRefundProcessed={() => {
            loadSales();
            setRefundModalOpen(false);
            setSelectedSaleForRefund(null);
          }}
        />
      )}
    </div>
  );
}
