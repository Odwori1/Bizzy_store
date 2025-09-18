import React, { useState, useEffect } from 'react';
import { Product, ProductCreate } from '../types';
import { useCurrency } from '../hooks/useCurrency';
import SmartBarcodeScanner from './barcode/SmartBarcodeScanner';
import { barcodeScannerService } from '../services/barcodeScannerService';

interface ProductFormProps {
  initialData?: Partial<Product>;
  onSubmit: (data: ProductCreate) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  title: string;
}

const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  title
}) => {
  const [formData, setFormData] = useState<ProductCreate>({
    name: '',
    description: '',
    price: 0,
    cost_price: undefined,
    barcode: '',
    stock_quantity: 0,
    min_stock_level: 5
  });
  const [isScanning, setIsScanning] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupMessage, setLookupMessage] = useState('');
  const { convertToLocal } = useCurrency();

  useEffect(() => {
    if (initialData) {
      // For editing existing products, convert USD amounts back to local for display
      const displayPrice = initialData.original_price !== undefined ? initialData.original_price : (initialData.price ? convertToLocal(initialData.price) : 0);
      const displayCostPrice = initialData.original_cost_price !== undefined ? initialData.original_cost_price : (initialData.cost_price ? convertToLocal(initialData.cost_price) : undefined);
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        price: displayPrice,
        cost_price: displayCostPrice,
        barcode: initialData.barcode || '',
        stock_quantity: initialData.stock_quantity || 0,
        min_stock_level: initialData.min_stock_level || 5
      });
    }
  }, [initialData, convertToLocal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Send the raw user input (local currency amounts) to backend
    // Backend will handle conversion and preservation of historical context
    await onSubmit(formData);
  };

  const handleBarcodeScan = async (scannedBarcode: string) => {
    console.log("Scanned barcode:", scannedBarcode);

    setFormData(prev => ({ ...prev, barcode: scannedBarcode }));
    setIsScanning(false);

    if (scannedBarcode.length >= 6 && scannedBarcode.length <= 13 && /^\d+$/.test(scannedBarcode)) {
      setIsLookingUp(true);
      setLookupMessage('Looking up product information...');

      try {
        const result = await barcodeScannerService.lookupBarcode(scannedBarcode);

        if (result.success && result.product) {
          setFormData(prev => ({
            ...prev,
            name: result.product!.name,
            price: result.product!.price, // Use raw price from lookup
            stock_quantity: result.product!.stock_quantity
          }));
          // Enhanced message for external products
          const message = result.product.id
            ? `✅ Found: ${result.product.name}`
            : `✅ Found externally: ${result.product.name} (enter price & stock)`;
          setLookupMessage(message);
        } else {
          setLookupMessage('ℹ️ New product - please enter details');
        }
      } catch (error) {
        console.error('Barcode lookup failed:', error);
        setLookupMessage('⚠️ Lookup failed - enter details manually');
      } finally {
        setIsLookingUp(false);
        setTimeout(() => setLookupMessage(''), 3000);
      }
    } else if (scannedBarcode.startsWith('http')) {
      setLookupMessage('🌐 URL detected - enter product details');
      setTimeout(() => setLookupMessage(''), 3000);
    }
  };

  return (
    <>
      {isScanning && (
        <SmartBarcodeScanner
          onScan={handleBarcodeScan}
          onCancel={() => setIsScanning(false)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">{title}</h3>

        {lookupMessage && (
          <div className={`p-3 rounded-md ${
            lookupMessage.includes('✅') ? 'bg-green-100 text-green-800' :
            lookupMessage.includes('⚠️') ? 'bg-yellow-100 text-yellow-800' :
            lookupMessage.includes('ℹ️') ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {isLookingUp ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                {lookupMessage}
              </div>
            ) : (
              lookupMessage
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Product Name *
            </label>
            <input
              type="text"
              id="name"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Barcode */}
          <div>
            <label htmlFor="barcode" className="block text-sm font-medium text-gray-700">
              Barcode *
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <button
                type="button"
                onClick={() => setIsScanning(true)}
                className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                title="Scan or enter barcode"
              >
                Scan/Enter
              </button>
              <input
                type="text"
                id="barcode"
                required
                className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="Enter barcode or scan"
              />
            </div>
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Selling Price (Local Currency) *
            </label>
            <input
              type="number"
              id="price"
              step="0.01"
              min="0"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
            />
          </div>

          {/* Cost Price */}
          <div>
            <label htmlFor="cost_price" className="block text-sm font-medium text-gray-700">
              Cost Price (Local Currency)
            </label>
            <input
              type="number"
              id="cost_price"
              step="0.01"
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.cost_price || ''}
              onChange={(e) => setFormData({
                ...formData,
                cost_price: e.target.value ? parseFloat(e.target.value) : undefined
              })}
              placeholder="Optional - for profit calculation"
            />
          </div>

          {/* Stock Quantity */}
          <div>
            <label htmlFor="stock_quantity" className="block text-sm font-medium text-gray-700">
              Stock Quantity *
            </label>
            <input
              type="number"
              id="stock_quantity"
              min="0"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.stock_quantity}
              onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
            />
          </div>

          {/* Min Stock Level */}
          <div>
            <label htmlFor="min_stock_level" className="block text-sm font-medium text-gray-700">
              Minimum Stock Level *
            </label>
            <input
              type="number"
              id="min_stock_level"
              min="0"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              value={formData.min_stock_level}
              onChange={(e) => setFormData({ ...formData, min_stock_level: parseInt(e.target.value) || 5 })}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md border border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>
    </>
  );
};

export default ProductForm;
