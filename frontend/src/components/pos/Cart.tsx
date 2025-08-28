import React from 'react';
import { CartItem } from '../../types';

interface CartProps {
  items: CartItem[];
  total: number;
  tax: number;
  grandTotal: number;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemoveItem: (productId: number) => void;
  onCheckout: () => void;
  onClearCart: () => void;  // Add this line
}

const Cart: React.FC<CartProps> = ({
  items,
  total,
  tax,
  grandTotal,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onClearCart  // Add this line
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {/* Cart Items */}
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.product_id} className="flex justify-between items-center border-b pb-2">
            <div className="flex-1">
              <div className="font-medium">{item.product_name}</div>
              <div className="text-sm text-gray-500">${item.unit_price.toFixed(2)} each</div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
                className="px-2 py-1 bg-gray-200 rounded"
                disabled={item.quantity <= 1}
              >
                -
              </button>
              <span className="w-8 text-center">{item.quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
                className="px-2 py-1 bg-gray-200 rounded"
              >
                +
              </button>
              <span className="w-16 text-right">${item.subtotal.toFixed(2)}</span>
              <button
                onClick={() => onRemoveItem(item.product_id)}
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
          <span>${total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax:</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t pt-2">
          <span>Total:</span>
          <span>${grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      {items.length > 0 && (
        <div className="mt-4 space-y-2">
          <button
            onClick={onCheckout}  // RESTORE the original function call
            className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
          >
            Process Sale
          </button>
          <button
            onClick={() => {}}  // This will be handled by PaymentModal's clear cart button
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
