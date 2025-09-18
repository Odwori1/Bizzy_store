import React, { useState, useEffect } from 'react';
import { Product, CartItem } from '../types';
import { productService } from '../services/products';
import ProductGrid from '../components/pos/ProductGrid';
import Cart from '../components/pos/Cart';
import PaymentModal from '../components/pos/PaymentModal';

const POS: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const productsData = await productService.getProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const addToCart = (product: Product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.product_id === product.id);

      // Always use original price if available, otherwise use USD price
      const unitPrice = product.original_price || product.price;
      const originalUnitPrice = product.original_price;
      const originalCurrencyCode = product.original_currency_code;

      if (existingItem) {
        return prevItems.map(item =>
          item.product_id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * (item.original_unit_price || item.unit_price)
              }
            : item
        );
      }

      return [
        ...prevItems,
        {
          product_id: product.id,
          product_name: product.name,
          product: product,
          quantity: 1,
          unit_price: unitPrice, // Use consistent price calculation
          original_unit_price: originalUnitPrice,
          original_currency_code: originalCurrencyCode,
          subtotal: unitPrice // Use the same price for subtotal
        }
      ];
    });
  };

  // FIX: Corrected updateQuantity to use original_unit_price if available
  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.product_id === productId
          ? {
              ...item,
              quantity,
              // Use original_unit_price if available for subtotal calculation
              subtotal: quantity * (item.original_unit_price || item.unit_price)
            }
          : item
      )
    );
  };

  const removeFromCart = (productId: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.product_id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Calculate totals in local currency (NO conversion needed - amounts are already local)
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.original_unit_price || item.unit_price) * item.quantity,
    0
  );
  const grandTotal = subtotal;

  // DEBUG: Log cart items and totals calculation
  console.log('CART DEBUG:', {
    cartItems: cartItems.map(item => ({
      name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      original_unit_price: item.original_unit_price,
      currency: item.original_currency_code,
      subtotal: item.subtotal,
      calculated_subtotal: item.quantity * (item.original_unit_price || item.unit_price)
    })),
    calculatedSubtotal: subtotal,
    calculatedGrandTotal: grandTotal
  });

  // Handle checkout
  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    setIsPaymentModalOpen(true);
  };

  // Handle payment success
  const handlePaymentComplete = () => {
    clearCart();
    setIsPaymentModalOpen(false);
  };

  // Handle clearing cart from modal
  const handleClearCartFromModal = () => {
    clearCart();
    setIsPaymentModalOpen(false);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Point of Sale</h1>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={clearCart}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Clear Cart
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 bg-gray-100">
        {/* Product Grid - 2/3 width */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <ProductGrid
            products={products}
            onAddToCart={addToCart}
            searchTerm={searchTerm}
          />
        </div>

        {/* Cart - 1/3 width */}
        <div className="lg:col-span-1">
          <Cart
            items={cartItems}
            total={subtotal}
            tax={0}
            grandTotal={grandTotal}
            onRemoveItem={removeFromCart}
            onUpdateQuantity={updateQuantity}
            onClearCart={clearCart}
            onCheckout={() => setIsPaymentModalOpen(true)}
          />
        </div>
      </div>

      {/* Payment Modal with onClearCart prop */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onClearCart={handleClearCartFromModal}
        cart={cartItems}
        total={grandTotal} // Local currency total for backend processing
        totalDisplay={grandTotal} // Local currency total for display (FIXED: same as total)
        onPaymentSuccess={handlePaymentComplete}
      />
    </div>
  );
};

export default POS;
