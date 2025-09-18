import React, { useState, useEffect } from 'react';
import { Refund } from '../types';
import { refundsService } from '../services/refunds';
import { salesService } from '../services/sales';
import { format } from 'date-fns';
import BackButton from '../components/BackButton';
import { CurrencyDisplay } from '../components/CurrencyDisplay'; // <--- CHANGED: Use CurrencyDisplay instead of useCurrency

export default function Refunds() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRefunds();
  }, []);

  const loadRefunds = async () => {
    try {
      setLoading(true);
      setError(null);

      const allRefunds: Refund[] = [];

      try {
        // Get all sales using the sales service
        const sales = await salesService.getSales();

        // Get refunds for each sale
        for (const sale of sales) {
          try {
            const saleRefunds = await refundsService.getRefundsBySale(sale.id);
            allRefunds.push(...saleRefunds);
          } catch (err) {
            console.error(`Failed to get refunds for sale ${sale.id}:`, err);
          }
        }

        setRefunds(allRefunds.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
      } catch (err: any) {
        setError('Failed to load sales data: ' + (err.message || 'Unknown error'));
        console.error('Error loading sales:', err);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load refunds');
      console.error('Error loading refunds:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mb-4">
        <BackButton />
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Refunds Management</h1>
          <p className="text-gray-600">View and manage all refund transactions</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">All Refunds</h2>

          {refunds.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No refunds found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-left">Refund ID</th>
                    <th className="p-3 text-left">Sale ID</th>
                    <th className="p-3 text-left">Amount</th>
                    <th className="p-3 text-left">Reason</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.map((refund) => (
                    <tr key={refund.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">#{refund.id}</td>
                      <td className="p-3">Sale #{refund.sale_id}</td>
                      <td className="p-3">
                        {/* CHANGED: Use CurrencyDisplay with historical context */}
                        <CurrencyDisplay 
                          amount={refund.total_amount} 
                          originalAmount={refund.original_amount}
                          originalCurrencyCode={refund.original_currency}
                        />
                      </td>
                      <td className="p-3">{refund.reason || 'N/A'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          refund.status === 'processed' ? 'bg-green-100 text-green-800' :
                          refund.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {refund.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {format(new Date(refund.created_at), 'MMM dd, yyyy HH:mm')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
