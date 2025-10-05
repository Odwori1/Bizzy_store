import React, { useState } from 'react';
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
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);
  
  // Get currency context from the first item
  const currencyContext = items[0]?.original_currency_code ? {
    originalAmount: items[0].original_unit_price,
    originalCurrencyCode: items[0].original_currency_code,
    exchangeRateAtCreation: items[0].product?.exchange_rate_at_creation
  } : undefined;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 max-h-[80vh] overflow-y-auto">
      {/* Cart Items with professional layout */}
      <div className="space-y-3 max-w-full">
        {items.map((item) => {
          const productName = item.product?.name || item.product_name || 'Unknown Product';
          const isHovered = hoveredProduct === item.product_id;
          
          return (
            <div 
              key={item.product.id} 
              className="flex justify-between items-start gap-2 border-b pb-3 min-w-0"
              onMouseEnter={() => setHoveredProduct(item.product_id)}
              onMouseLeave={() => setHoveredProduct(null)}
            >
              {/* Product Info - Professional truncation with tooltip */}
              <div className="flex-1 min-w-0 max-w-[140px]">
                <div className="relative group">
                  {/* Truncated product name */}
                  <div 
                    className="font-medium text-sm truncate text-gray-900"
                  >
                    {productName}
                  </div>
                  
                  {/* Tooltip on hover */}
                  {isHovered && (
                    <div className="absolute z-10 left-0 top-full mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg whitespace-nowrap">
                      {productName}
                    </div>
                  )}
                </div>
                
                {/* Unit price - always visible */}
                <div className="text-xs text-gray-500 truncate mt-1">
                  <CurrencyDisplay
                    amount={item.unit_price}
                    originalAmount={item.original_unit_price}
                    originalCurrencyCode={item.original_currency_code}
                    exchangeRateAtCreation={item.product?.exchange_rate_at_creation}
                  />
                </div>
              </div>

              {/* Quantity Controls and Price - Optimized spacing */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Quantity Controls */}
                <div className="flex items-center gap-1 mr-2">
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                    className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded text-xs hover:bg-gray-300 disabled:opacity-50"
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded text-xs hover:bg-gray-300"
                  >
                    +
                  </button>
                </div>

                {/* Price - Ensure it doesn't overflow */}
                <span className="text-sm font-medium min-w-[85px] text-right whitespace-nowrap">
                  <CurrencyDisplay
                    amount={item.subtotal}
                    originalAmount={item.original_unit_price ? item.original_unit_price * item.quantity : undefined}
                    originalCurrencyCode={item.original_currency_code}
                    exchangeRateAtCreation={item.product?.exchange_rate_at_creation}
                  />
                </span>

                {/* Remove Button */}
                <button
                  onClick={() => onRemoveItem(item.product.id)}
                  className="w-6 h-6 flex items-center justify-center bg-red-100 text-red-600 rounded text-sm hover:bg-red-200 ml-1"
                  title="Remove item"
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals Section - unchanged */}
      {items.length > 0 && (
        <>
          <div className="mt-4 space-y-2 pt-2 border-t">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span className="font-medium whitespace-nowrap min-w-[100px] text-right">
                <CurrencyDisplay
                  amount={total}
                  originalAmount={total}
                  originalCurrencyCode={currencyContext?.originalCurrencyCode}
                  exchangeRateAtCreation={currencyContext?.exchangeRateAtCreation}
                />
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax:</span>
              <span className="font-medium whitespace-nowrap min-w-[100px] text-right">
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
              <span className="whitespace-nowrap min-w-[100px] text-right">
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
          <div className="mt-4 space-y-2">
            <button
              onClick={onCheckout}
              className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 text-sm font-medium"
            >
              Process Sale
            </button>
            <button
              onClick={onClearCart}
              className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 text-sm font-medium"
            >
              Clear Cart
            </button>
          </div>
        </>
      )}

      {/* Empty State */}
      {items.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🛒</div>
          <p className="text-sm">Your cart is empty</p>
        </div>
      )}
    </div>
  );
};

export default Cart;
