import React, { useEffect, useState } from 'react';
import { Product, ProductCreate } from '../types';
import { productService } from '../services/products';
import ProductForm from '../components/ProductForm';
import { useAuthStore } from '../hooks/useAuth';
import BackButton from '../components/BackButton';
import { CurrencyDisplay } from '../components/CurrencyDisplay';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const productsData = await productService.getProducts();
      setProducts(productsData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProduct = async (productData: ProductCreate) => {
    try {
      await productService.createProduct(productData);
      setIsCreateModalOpen(false);
      fetchProducts(); // Refresh the list
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || 'Failed to create product');
    }
  };

  const handleUpdateProduct = async (productData: ProductCreate) => {
    if (!editingProduct) return;

    try {
      await productService.updateProduct(editingProduct.id, productData);
      setIsEditModalOpen(false);
      setEditingProduct(null);
      fetchProducts(); // Refresh the list
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || 'Failed to update product');
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      await productService.deleteProduct(productId);
      fetchProducts(); // Refresh the list
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete product');
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode.includes(searchTerm) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <BackButton />
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600">Manage your product inventory</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 mt-4 sm:mt-0"
        >
          Add New Product
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search products by name, barcode, or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Products Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Barcode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        #{product.business_product_number || product.id} - {product.name} {/* 🎯 USE VIRTUAL NUMBER */}
                      </div>
                      {product.description && (
                        <div className="text-sm text-gray-500">{product.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.barcode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {/* UPDATED: Show historical price when available */}
                    <CurrencyDisplay
                      amount={product.price}
                      originalAmount={product.original_price}
                      originalCurrencyCode={product.original_currency_code}
                      exchangeRateAtCreation={product.exchange_rate_at_creation || 1}
                      preserveOriginal={true}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {/* UPDATED: Show historical cost price when available */}
                    <CurrencyDisplay
                      amount={product.cost_price || 0}
                      originalAmount={product.original_cost_price || product.cost_price || 0}
                      originalCurrencyCode={product.original_currency_code || 'UGX'}
                      exchangeRateAtCreation={product.exchange_rate_at_creation || 1}
                      preserveOriginal={true}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.stock_quantity}
                    {product.min_stock_level > 0 && (
                      <span className="text-gray-500"> / min {product.min_stock_level}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.stock_quantity <= product.min_stock_level
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {product.stock_quantity <= product.min_stock_level ? 'Low Stock' : 'In Stock'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditClick(product)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {searchTerm ? 'No products found matching your search.' : 'No products found.'}
            </p>
          </div>
        )}
      </div>

      {/* Create Product Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <ProductForm
              onSubmit={handleCreateProduct}
              onCancel={() => setIsCreateModalOpen(false)}
              isLoading={false}
              title="Add New Product"
            />
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <ProductForm
              initialData={editingProduct}
              onSubmit={handleUpdateProduct}
              onCancel={() => {
                setIsEditModalOpen(false);
                setEditingProduct(null);
              }}
              isLoading={false}
              title="Edit Product"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
