import React from 'react';
import { PurchaseOrder } from '../../types';
import { useSuppliers } from '../../hooks/useSuppliers';
import { CurrencyDisplay } from '../CurrencyDisplay';
import { useBusinessStore } from '../../hooks/useBusiness'; // ADD IMPORT

interface PurchaseOrderListProps {
  purchaseOrders: PurchaseOrder[];
  onViewDetail: (po: PurchaseOrder) => void;
}

const PurchaseOrderList: React.FC<PurchaseOrderListProps> = ({ purchaseOrders, onViewDetail }) => {
  const { updatePoStatus } = useSuppliers();
  const { business } = useBusinessStore(); // ADD BUSINESS STORE

  // Get currency context from business store
  const currencyContext = business?.currency_code ? {
    originalAmount: 0,
    originalCurrencyCode: business.currency_code,
    exchangeRateAtCreation: 1
  } : {
    originalAmount: 0,
    originalCurrencyCode: 'UGX', // Fallback currency
    exchangeRateAtCreation: 1
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'ordered': return 'bg-blue-100 text-blue-800';
      case 'received': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = async (poId: number, currentStatus: string) => {
    let newStatus;
    switch (currentStatus) {
      case 'draft': newStatus = 'ordered'; break;
      case 'ordered': newStatus = 'received'; break;
      case 'received': newStatus = 'cancelled'; break;
      default: return;
    }

    try {
      await updatePoStatus(poId, newStatus);
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const getNextAction = (status: string) => {
    switch (status) {
      case 'draft': return 'Mark as Ordered';
      case 'ordered': return 'Mark as Received';
      case 'received': return 'Cancel Order';
      default: return null;
    }
  };

  if (purchaseOrders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">No purchase orders found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              PO Number
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Supplier
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Order Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Items
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {purchaseOrders.map((po) => (
            <tr key={po.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{po.po_number}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{po.supplier_name || `Supplier #${po.supplier_id}`}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(po.status)}`}>
                  {po.status.toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  <CurrencyDisplay
                    amount={po.total_amount}
                    originalAmount={po.total_amount}
                    originalCurrencyCode={currencyContext.originalCurrencyCode}
                    exchangeRateAtCreation={currencyContext.exchangeRateAtCreation}
                  />
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {new Date(po.order_date).toLocaleDateString()}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                  {po.items.length} item(s)
                  <ul className="text-xs text-gray-600 mt-1">
                    {po.items.slice(0, 2).map((item, index) => (
                      <li key={index}>
                        {item.product_name || `Product #${item.product_id}`} × {item.quantity}
                      </li>
                    ))}
                    {po.items.length > 2 && <li>...and {po.items.length - 2} more</li>}
                  </ul>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button
                  onClick={() => onViewDetail(po)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  View
                </button>
                {getNextAction(po.status) && (
                  <button
                    onClick={() => handleStatusChange(po.id, po.status)}
                    className="text-green-600 hover:text-green-900"
                  >
                    {getNextAction(po.status)}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PurchaseOrderList;
