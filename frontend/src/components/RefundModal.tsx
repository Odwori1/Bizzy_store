import React, { useState, useEffect } from 'react';
import { Sale, SaleItem, RefundItemCreate } from '../types';
import { useRefunds } from '../hooks/useRefunds';
import { CurrencyDisplay } from './CurrencyDisplay';

interface RefundModalProps {
  sale: Sale;
  isOpen: boolean;
  onClose: () => void;
  onRefundProcessed: () => void;
}

export default function RefundModal({ sale, isOpen, onClose, onRefundProcessed }: RefundModalProps) {
  const { createRefund, loading, error } = useRefunds();
  const [refundItems, setRefundItems] = useState<RefundItemCreate[]>([]);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen && sale && sale.sale_items) {
      // Initialize with empty refund items
      setRefundItems(sale.sale_items.map(item => ({
        sale_item_id: item.id,
        quantity: 0
      })));
      setReason('');
    }
  }, [isOpen, sale]);

  const handleQuantityChange = (saleItemId: number, quantity: number) => {
    setRefundItems(prev => prev.map(item =>
      item.sale_item_id === saleItemId ? { ...item, quantity } : item
    ));
  };

  const getMaxRefundable = (saleItem: SaleItem) => {
    return saleItem.quantity - (saleItem.refunded_quantity || 0);
  };

  const calculateTotalRefund = () => {
    if (!sale?.sale_items) return 0;

    return refundItems.reduce((total, refundItem) => {
      const saleItem = sale.sale_items.find(item => item.id === refundItem.sale_item_id);
      // FIXED: Use original_unit_price instead of unit_price for local currency amount
      return total + (saleItem ? refundItem.quantity * (saleItem.original_unit_price || saleItem.unit_price) : 0);
    }, 0);
  };

  const hasRefundableItems = () => {
    return refundItems.some(item => item.quantity > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out items with quantity 0
    const validRefundItems = refundItems.filter(item => item.quantity > 0);

    if (validRefundItems.length === 0) {
      alert('Please select at least one item to refund');
      return;
    }

    // Add comprehensive debug logs
    console.log('=== REFUND DEBUG START ===');
    console.log('Sale:', sale);
    console.log('Refund items to process:', validRefundItems);
    console.log('Reason:', reason);

    const refundData = {
      sale_id: sale.id,
      reason: reason || undefined,
      refund_items: validRefundItems
    };

    console.log('Refund data being sent:', refundData);

    try {
      console.log('Calling createRefund...');
      const result = await createRefund(refundData);
      console.log('createRefund result:', result);

      if (result) {
        console.log('Refund successful!');
        onRefundProcessed();
        onClose();
      } else {
        console.log('createRefund returned null - check error state');
      }
    } catch (err: any) {
      console.error('Refund error:', err);
      console.error('Error response:', err.response);
      console.error('Error message:', err.message);

      if (err.response?.status === 401) {
        console.log('Authentication failed, redirecting to login');
        window.location.href = '/login';
      }
    }
    console.log('=== REFUND DEBUG END ===');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Process Refund for Sale #{sale.id}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            disabled={loading}
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Reason for Refund (Optional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="Enter reason for refund..."
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Items to Refund</h3>
            <div className="space-y-3">
              {sale?.sale_items?.map((saleItem) => {
                const maxRefundable = getMaxRefundable(saleItem);
                const refundItem = refundItems.find(item => item.sale_item_id === saleItem.id);
                const quantity = refundItem?.quantity || 0;

                return (
                  <div key={saleItem.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <p className="font-medium">Product: {saleItem.product_name || saleItem.product_id}</p>
                      <p className="text-sm text-gray-600">
                        Purchased: {saleItem.quantity} | Already refunded: {saleItem.refunded_quantity || 0} |
                        Available to refund: {maxRefundable}
                      </p>
                      <p className="text-sm">
                        Unit price:{" "}
                        <CurrencyDisplay
                          amount={saleItem.unit_price} // USD amount
                          originalAmount={saleItem.original_unit_price || saleItem.unit_price} // Local amount
                          originalCurrencyCode={sale.original_currency}
                          exchangeRateAtCreation={saleItem.exchange_rate_at_creation}
                          preserveOriginal={true}
                        />
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max={maxRefundable}
                        value={quantity}
                        onChange={(e) => handleQuantityChange(saleItem.id, parseInt(e.target.value) || 0)}
                        className="w-20 p-1 border border-gray-300 rounded text-center"
                        disabled={maxRefundable === 0 || loading}
                      />
                      <span className="text-sm text-gray-600">of {maxRefundable}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded">
            <p className="text-lg font-semibold">
              Total Refund Amount:{" "}
              <CurrencyDisplay
                amount={calculateTotalRefund() * (sale.exchange_rate_at_sale || 1)} // USD amount
                originalAmount={calculateTotalRefund()} // Local amount
                originalCurrencyCode={sale.original_currency}
                exchangeRateAtCreation={sale.exchange_rate_at_sale}
                preserveOriginal={true}
              />
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-red-400"
              disabled={loading || !hasRefundableItems()}
            >
              {loading ? 'Processing...' : `Process Refund (`}
              <CurrencyDisplay
                amount={calculateTotalRefund() * (sale.exchange_rate_at_sale || 1)} // USD amount
                originalAmount={calculateTotalRefund()} // Local amount
                originalCurrencyCode={sale.original_currency}
                exchangeRateAtCreation={sale.exchange_rate_at_sale}
                preserveOriginal={true}
              />
              {`)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
