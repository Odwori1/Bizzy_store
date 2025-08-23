import { useState, useEffect } from 'react';
import PaymentModal from '../components/pos/PaymentModal';
import { productService } from '../services/sales';
import { Product, CartItem } from '../types';

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch products from backend on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const productsData = await productService.getProducts();
        setProducts(productsData);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Get unique categories for filter
  const categories = ['All', ...new Set(products.map(p => p.category || 'Uncategorized'))];

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || (product.category || 'Uncategorized') === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleProcessPayment = async (paymentData: any) => {
  // This function is now called AFTER the sale is successfully created
  console.log('Sale completed successfully. Data:', paymentData);
  
  // Show success message
  alert(`Sale completed successfully! Transaction ID: ${paymentData.saleId}`);
  
  // Clear the cart
  clearCart();
};

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-xl">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Product Grid (70% width) */}
      <div className="w-3/4 p-4 bg-gray-100 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Products ({products.length})</h2>

          {/* Search and Filter */}
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow border border-gray-200"
              onClick={() => addToCart(product)}
            >
              <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
              <p className="text-gray-600 text-sm mb-1">${product.price.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mb-1">Stock: {product.stock_quantity}</p>
              <p className="text-xs text-gray-500 mb-1">SKU: {product.barcode}</p>
              {product.description && (
                <p className="text-xs text-gray-400 mt-2">{product.description}</p>
              )}
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No products found</p>
          </div>
        )}
      </div>

      {/* Shopping Cart (30% width) */}
      <div className="w-1/4 bg-white border-l p-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Shopping Cart</h2>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Cart is empty</p>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="flex justify-between items-center mb-3 p-3 border-b border-gray-200">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{item.product.name}</h4>
                  <p className="text-xs text-gray-600">${item.product.price.toFixed(2)} each</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateQuantity(item.product.id, item.quantity - 1);
                    }}
                    className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center text-xs"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateQuantity(item.product.id, item.quantity + 1);
                    }}
                    className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center text-xs"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromCart(item.product.id);
                  }}
                  className="ml-2 text-red-600 hover:text-red-800 text-sm"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex justify-between text-lg font-bold mb-4">
              <span>Total:</span>
              <span>${getCartTotal().toFixed(2)}</span>
            </div>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 font-semibold"
            >
              Process Payment
            </button>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        cart={cart}
        total={getCartTotal()}
        onProcessPayment={handleProcessPayment}
      />
    </div>
  );
}
