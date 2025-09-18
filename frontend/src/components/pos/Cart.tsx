import React from 'react';
import { CartItem } from '../../types';
import { CurrencyDisplay } from '../CurrencyDisplay';

interface CartProps {
  items: CartItem[];
  total: number;
  tax: number;
  grandTotal: number;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemoveItem: (productId: number) => void;
  onCheckout: () => void;
  onClearCart: () => void;
}

const Cart: React.FC<CartProps> = ({
  items,
  total,
  tax,
  grandTotal,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onClearCart
}) => {
  // Get currency context from the first item
  const currencyContext = items[0]?.original_currency_code ? {
    originalAmount: items[0].original_unit_price,
    originalCurrencyCode: items[0].original_currency_code,
    exchangeRateAtCreation: items[0].product.exchange_rate_at_creation
  } : undefined;

  // DEBUG: Check what values are being passed to CurrencyDisplay
  console.log('CART TOTALS DEBUG:', {
    subtotal: total,
    tax,
    grandTotal,
    currencyContext
  });

  // DEBUG: Check individual items
  console.log('CART ITEMS DEBUG:', {
    items: items.map(item => ({
      name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      original_unit_price: item.original_unit_price,
      currency: item.original_currency_code,
      exchange_rate: item.product.exchange_rate_at_creation
    }))
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {/* Cart Items */}
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.product.id} className="flex justify-between items-center border-b pb-2">
            <div className="flex-1">
              <div className="font-medium">{item.product.name}</div>
              <div className="text-sm text-gray-500">
                <CurrencyDisplay
                  amount={item.unit_price}
                  originalAmount={item.original_unit_price}
                  originalCurrencyCode={item.original_currency_code}
                  exchangeRateAtCreation={item.product.exchange_rate_at_creation}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                className="px-2 py-1 bg-gray-200 rounded"
                disabled={item.quantity <= 1}
              >
                -
              </button>
              <span className="w-8 text-center">{item.quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                className="px-2 py-1 bg-gray-200 rounded"
              >
                +
              </button>
              <span className="w-16 text-right">
                <CurrencyDisplay
                  amount={item.subtotal}
                  originalAmount={item.original_unit_price ? item.original_unit_price * item.quantity : undefined}
                  originalCurrencyCode={item.original_currency_code}
                  exchangeRateAtCreation={item.product.exchange_rate_at_creation}
                />
              </span>
              <button
                onClick={() => onRemoveItem(item.product.id)}
                className="px-2 py-1 bg-red-500 text-white rounded"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="mt-4 space-y-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>
            <CurrencyDisplay
              amount={total}
              originalAmount={total}
              originalCurrencyCode={currencyContext?.originalCurrencyCode}
              exchangeRateAtCreation={currencyContext?.exchangeRateAtCreation}
            />
          </span>
        </div>
        <div className="flex justify-between">
          <span>Tax:</span>
          <span>
            <CurrencyDisplay
              amount={tax}
              originalAmount={tax}
              originalCurrencyCode={currencyContext?.originalCurrencyCode}
              exchangeRateAtCreation={currencyContext?.exchangeRateAtCreation}
            />
          </span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t pt-2">
          <span>Total:</span>
          <span>
            <CurrencyDisplay
              amount={grandTotal}
              originalAmount={grandTotal}
              originalCurrencyCode={currencyContext?.originalCurrencyCode}
              exchangeRateAtCreation={currencyContext?.exchangeRateAtCreation}
            />
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      {items.length > 0 && (
        <div className="mt-4 space-y-2">
          <button
            onClick={onCheckout}
            className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
          >
            Process Sale
          </button>
          <button
            onClick={onClearCart}
            className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
          >
            Clear Cart
          </button>
        </div>
      )}
    </div>
  );
};

export default Cart;
