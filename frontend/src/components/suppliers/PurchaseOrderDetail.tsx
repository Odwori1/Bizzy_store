import React, { useState, useEffect } from 'react'; // <-- Added useEffect
import { PurchaseOrder } from '../../types';
import { useSuppliers } from '../../hooks/useSuppliers';
import { productService } from '../../services/products'; // <-- Import the existing service
import { CurrencyDisplay } from '../CurrencyDisplay';

interface PurchaseOrderDetailProps {
  purchaseOrder: PurchaseOrder;
  onClose: () => void;
}

const PurchaseOrderDetail: React.FC<PurchaseOrderDetailProps> = ({ purchaseOrder, onClose }) => {
  const { receivePoItems, updatePoStatus } = useSuppliers();
  const [receivedQuantities, setReceivedQuantities] = useState<Record<number, number>>({});
  const [productNames, setProductNames] = useState<Record<number, string>>({}); // <-- Added state for product names

  useEffect(() => {
    const fetchProductNames = async () => {
      const names: Record<number, string> = {};
      // Create an array of unique product IDs from the purchase order items
      const productIds = [...new Set(purchaseOrder.items.map(item => item.product_id))];

      // Fetch each product's name using the EXISTING service
      for (const productId of productIds) {
        try {
          const product = await productService.getProduct(productId); // <-- Use the existing service
          names[productId] = product.name; // Store the name using the product ID as the key
        } catch (error) {
          console.error(`Failed to fetch product ${productId}:`, error);
          names[productId] = `Product #${productId}`; // Fallback name
        }
      }
      setProductNames(names);
    };

    fetchProductNames();
  }, [purchaseOrder.items]); // This effect runs when the purchaseOrder.items array changes

  const handleReceiveItems = async () => {
    const itemsToReceive = Object.entries(receivedQuantities)
      .filter(([_, quantity]) => quantity > 0)
      .map(([itemId, quantity]) => ({
        item_id: parseInt(itemId),
        quantity
      }));

    if (itemsToReceive.length === 0) {
      alert('Please enter quantities received');
      return;
    }

    try {
      await receivePoItems(purchaseOrder.id, itemsToReceive);
      onClose();
    } catch (error) {
      alert('Failed to receive items');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updatePoStatus(purchaseOrder.id, newStatus);
      onClose();
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const handleQuantityChange = (itemId: number, quantity: number) => {
    setReceivedQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, quantity)
    }));
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

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Purchase Order: {purchaseOrder.po_number}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Supplier Information</h4>
              <p className="text-sm text-gray-900">{purchaseOrder.supplier_name || `Supplier #${purchaseOrder.supplier_id}`}</p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(purchaseOrder.status)}`}>
                {purchaseOrder.status.toUpperCase()}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Order Date</h4>
              <p className="text-sm text-gray-900">
                {new Date(purchaseOrder.order_date).toLocaleDateString()}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Expected Delivery</h4>
              <p className="text-sm text-gray-900">
                {purchaseOrder.expected_delivery
                  ? new Date(purchaseOrder.expected_delivery).toLocaleDateString()
                  : 'Not specified'
                }
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Total Amount</h4>
              <p className="text-sm text-gray-900 font-semibold">
                <CurrencyDisplay amount={purchaseOrder.total_amount} />
              </p>
            </div>

            {purchaseOrder.received_date && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Received Date</h4>
                <p className="text-sm text-gray-900">
                  {new Date(purchaseOrder.received_date).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {purchaseOrder.notes && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{purchaseOrder.notes}</p>
            </div>
          )}

          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Items</h4>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ordered</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Received</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  {purchaseOrder.status === 'ordered' && (
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Receive Qty</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchaseOrder.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {productNames[item.product_id] || `Loading...`} {/* <-- Updated this line */}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.received_quantity}</td>
                    <td className="px-4 py-2 text-sm text-gray-900"><CurrencyDisplay amount={item.unit_cost} /></td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                       <CurrencyDisplay amount={item.quantity * item.unit_cost} />
                    </td>
                    {purchaseOrder.status === 'ordered' && (
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          max={item.quantity - item.received_quantity}
                          value={receivedQuantities[item.id] || 0}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                          className="w-20 px-2 py-1 border rounded text-sm"
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            {purchaseOrder.status === 'ordered' && (
              <button
                onClick={handleReceiveItems}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Receive Items
              </button>
            )}

            {purchaseOrder.status === 'draft' && (
              <button
                onClick={() => handleStatusChange('ordered')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Mark as Ordered
              </button>
            )}

            {purchaseOrder.status !== 'cancelled' && purchaseOrder.status !== 'received' && (
              <button
                onClick={() => handleStatusChange('cancelled')}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Cancel Order
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderDetail;
