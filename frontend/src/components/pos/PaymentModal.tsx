import React, { useState, useMemo } from 'react';
import { CartItem, PaymentCreate, SaleItemCreate, Sale } from '../../types';
import { salesService } from '../../services/sales';
import { useAuthStore } from '../../hooks/useAuth';
import { useBusinessStore } from '../../hooks/useBusiness';
import Receipt from './Receipt';
import { useInventory } from '../../hooks/useInventory';
import { CurrencyDisplay } from '../CurrencyDisplay';
import { SaleCreate } from '../../types'; // Add this import

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearCart: () => void;
  cart: CartItem[];
  total: number; // This is already in local currency from POS.tsx
  totalDisplay: number; // This should also be in local currency
  onPaymentSuccess: () => void;
}

export default function PaymentModal({ isOpen, onClose, onClearCart, cart, total, totalDisplay, onPaymentSuccess }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const { user } = useAuthStore();
  const { business } = useBusinessStore();
  const { loadStockLevels, loadLowStockAlerts } = useInventory();

  const handleReceiptClose = () => {
    setShowReceipt(false);
    setCompletedSale(null);
    onPaymentSuccess();
    onClose();
  };

  // Determine currency context from the cart with exchange rate
  const currencyContext = cart[0]?.original_currency_code
    ? {
        originalAmount: totalDisplay,
        originalCurrencyCode: cart[0].original_currency_code,
        exchangeRateAtCreation: cart[0].product.exchange_rate_at_creation
      }
    : undefined;

  // Calculate change with memoization
  const change = useMemo(() => {
    if (paymentMethod !== 'cash' || !amountReceived) return 0;

    const received = parseFloat(amountReceived);
    if (isNaN(received)) return 0;

    // Amounts are in local currency; no conversion needed
    return received - totalDisplay;
  }, [amountReceived, paymentMethod, totalDisplay]);

  const isValidPayment = paymentMethod === 'cash' ? change >= 0 : true;

  if (showReceipt && completedSale) {
    return (
      <Receipt
        sale={completedSale}
        business={business}
        payments={completedSale.payments}
        onClose={handleReceiptClose}
        amountReceived={paymentMethod === 'cash' ? parseFloat(amountReceived) : totalDisplay}
      />
    );
  }

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('User not authenticated. Please log in again.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Prepare sale items - send original local prices
      const saleItems: SaleItemCreate[] = cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.original_unit_price || item.unit_price // Send local price
      }));

      // Prepare payment
      const payments: PaymentCreate[] = [{
        amount: total, // local currency amount
        payment_method: paymentMethod as 'cash' | 'card' | 'mobile_money',
        transaction_id: paymentMethod === 'cash' ? undefined : `txn_${Date.now()}`
      }];

      // Prepare sale data
      const saleData: SaleCreate = {
        user_id: user.id,
        sale_items: saleItems,
        payments: payments,
        tax_rate: 0 // Temporary - no tax for now
      };

      const createdSale = await salesService.createSale(saleData);

      // Refresh inventory
      await loadStockLevels();
      await loadLowStockAlerts();

      setCompletedSale(createdSale);
      setShowReceipt(true);
    } catch (err: any) {
      console.error('Payment failed:', err);
      setError(err.response?.data?.detail || 'Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Process Payment</h2>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Clear cart and cancel payment?')) {
                onClearCart();
              }
            }}
            className="text-red-600 hover:text-red-800 text-sm"
            title="Clear cart and cancel"
          >
            Clear Cart
          </button>
        </div>

        {/* Total */}
        <div className="mb-4">
          <p className="text-lg font-semibold">
            Total: <CurrencyDisplay
                     amount={totalDisplay}
                     originalAmount={totalDisplay}
                     originalCurrencyCode={currencyContext?.originalCurrencyCode}
                     exchangeRateAtCreation={currencyContext?.exchangeRateAtCreation}
                   />
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Payment Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="cash">Cash</option>
              <option value="card">Credit/Debit Card</option>
              <option value="mobile_money">Mobile Money</option>
            </select>
          </div>

          {paymentMethod === 'cash' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Amount Received</label>
              <input
                type="number"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
              {amountReceived && (
                <p className="text-sm mt-1">
                  Change: <CurrencyDisplay
                           amount={change}
                           originalAmount={change}
                           originalCurrencyCode={currencyContext?.originalCurrencyCode}
                           exchangeRateAtCreation={currencyContext?.exchangeRateAtCreation}
                         />
                  {change < 0 && <span className="text-red-600 ml-2">Insufficient amount!</span>}
                </p>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              disabled={isProcessing || !isValidPayment}
            >
              {isProcessing ? 'Processing...' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
