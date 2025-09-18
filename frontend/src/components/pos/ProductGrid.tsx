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
    product.barcode.includes(searchTerm)
  );

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onAddToCart(product)}
          >
            <div className="text-center mb-3">
              <span className="text-3xl">📦</span>
            </div>

            <div className="text-center mb-2">
              <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 h-10 overflow-hidden">
                {product.name}
              </h3>
              <p className="text-xs text-gray-500 font-mono">{product.barcode}</p>
            </div>

            <div className="text-center mb-3">
              {/* UPDATED: Use historical currency context when available */}
              <p className="text-lg font-bold text-green-700">
                <CurrencyDisplay
                  amount={product.price}
                  originalAmount={product.original_price}
                  originalCurrencyCode={product.original_currency_code}
                  exchangeRateAtCreation={product.exchange_rate_at_creation}
                />
              </p>
            </div>

            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                product.stock_quantity === 0
                  ? 'bg-red-100 text-red-800'
                  : product.stock_quantity <= product.min_stock_level
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                Stock: {product.stock_quantity} (min: {product.min_stock_level})
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products found</p>
          <p className="text-gray-400 text-sm">Try a different search term</p>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
