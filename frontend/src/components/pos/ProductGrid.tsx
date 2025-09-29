import React from 'react';
import { Product } from '../../types';
import { CurrencyDisplay } from '../CurrencyDisplay';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  searchTerm: string;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, onAddToCart, searchTerm }) => {
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full overflow-y-auto p-4">
      {/* Professional grid layout with better spacing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-full"
          >
            {/* Product Image/Icon Area */}
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-center">
              <div className="text-3xl">📦</div>
            </div>

            {/* Product Info - Better spacing and typography */}
            <div className="p-4 flex-1 flex flex-col">
              {/* Product Name - Clear hierarchy */}
              <h3
                className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 leading-tight"
                title={product.name}
              >
                {product.name}
              </h3>

              {/* Barcode - Subtle but clear */}
              <p className="text-xs text-gray-500 mb-3 font-mono">
                {product.barcode}
              </p>

              {/* Price - Prominent but well-spaced */}
              <div className="mb-3">
                <div className="text-lg font-bold text-gray-900 leading-tight">
                  <CurrencyDisplay
                    amount={product.price}
                    originalAmount={product.original_price}
                    originalCurrencyCode={product.original_currency_code}
                    exchangeRateAtCreation={product.exchange_rate_at_creation}
                  />
                </div>
              </div>

              {/* Stock Information - Clean and informative */}
              <div className="mt-auto space-y-2">
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span>Stock:</span>
                  <span className={`font-medium ${
                    product.stock_quantity <= product.min_stock_level
                      ? 'text-orange-600'
                      : 'text-green-600'
                  }`}>
                    {product.stock_quantity}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Min:</span>
                  <span>{product.min_stock_level}</span>
                </div>
              </div>

              {/* Add to Cart Button - Clear call to action */}
              <button
                onClick={() => onAddToCart(product)}
                disabled={product.stock_quantity === 0}
                className="w-full mt-3 bg-blue-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-500 text-lg">No products found</p>
          <p className="text-gray-400 text-sm mt-1">
            {searchTerm ? `No results for "${searchTerm}"` : 'No products available'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
