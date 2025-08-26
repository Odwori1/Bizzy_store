import React from 'react';
import { Product } from '../../types';

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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {filteredProducts.map((product) => (
        <div
          key={product.id}
          onClick={() => onAddToCart(product)}
          className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-indigo-300"
        >
          <div className="text-center mb-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl">📦</span>
            </div>
            <h3 className="font-semibold text-sm truncate">{product.name}</h3>
            <p className="text-xs text-gray-600 truncate">{product.barcode}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-green-600">${product.price.toFixed(2)}</p>
            <p className="text-xs text-gray-500">
              Stock: {product.stock_quantity}
              {product.min_stock_level > 0 && ` (min: ${product.min_stock_level})`}
            </p>
          </div>
        </div>
      ))}
      
      {filteredProducts.length === 0 && (
        <div className="col-span-full text-center py-8">
          <p className="text-gray-500">No products found</p>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
