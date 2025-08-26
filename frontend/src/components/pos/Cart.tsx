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
}

const Cart: React.FC<CartProps> = ({
  items,
  total,
  tax,
  grandTotal,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-full">
      <h2 className="text-xl font-bold mb-4">Shopping Cart</h2>
      
      {items.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Cart is empty</p>
          <p className="text-sm text-gray-400">Add products to begin</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {items.map((item) => (
              <div key={item.product_id} className="flex justify-between items-center p-2 border-b">
                <div className="flex-1">
                  <h4 className="font-medium truncate">{item.product_name}</h4>
                  <p className="text-sm text-gray-600">${item.unit_price.toFixed(2)} each</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
                    className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
                    className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center"
                  >
                    +
                  </button>
                  <button
                    onClick={() => onRemoveItem(item.product_id)}
                    className="ml-2 text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </div>
                <div className="text-right w-16">
                  <p className="font-semibold">${item.subtotal.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2 border-t pt-4">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
  	      <span>$0.00</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={onCheckout}
            className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 mt-4 font-semibold"
          >
            Process Payment
          </button>
        </>
      )}
    </div>
  );
};

export default Cart;
