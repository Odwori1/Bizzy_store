import React, { useState, useEffect } from 'react';
import { Product, ProductCreate } from '../types';
import { useCurrency } from '../hooks/useCurrency';
import SmartBarcodeScanner from './barcode/SmartBarcodeScanner';
import { barcodeScannerService } from '../services/barcodeScannerService'; // Add this import

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
    barcode: '',
    stock_quantity: 0,
    min_stock_level: 5
  });
  const [isScanning, setIsScanning] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false); // Add this state
  const [lookupMessage, setLookupMessage] = useState(''); // Add this state
  const { convertToUSD, convertAmount } = useCurrency();

  useEffect(() => {
    if (initialData) {
      // Convert the stored USD price to local currency for display when editing
      const displayPrice = initialData.price ? convertAmount(initialData.price) : 0;
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        price: displayPrice,
        barcode: initialData.barcode || '',
        stock_quantity: initialData.stock_quantity || 0,
        min_stock_level: initialData.min_stock_level || 5
      });
    }
  }, [initialData, convertAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Convert the local currency price BACK to USD before submitting
    const usdPrice = convertToUSD(formData.price);
    const dataToSubmit = { ...formData, price: usdPrice };

    await onSubmit(dataToSubmit);
  };

  // ENHANCED: Handle barcode scan with intelligence
  const handleBarcodeScan = async (scannedBarcode: string) => {
    console.log("Scanned barcode:", scannedBarcode);
    
    // First, populate the barcode field immediately
    setFormData(prev => ({ ...prev, barcode: scannedBarcode }));
    setIsScanning(false);
    
    // Then try to lookup product information (if it looks like a product barcode)
    if (scannedBarcode.length >= 6 && scannedBarcode.length <= 13 && /^\d+$/.test(scannedBarcode)) {
      setIsLookingUp(true);
      setLookupMessage('Looking up product information...');
      
      try {
        const result = await barcodeScannerService.lookupBarcode(scannedBarcode);
        
        if (result.success && result.product) {
          // Product found in database! Auto-fill the form
          setFormData(prev => ({
            ...prev,
            name: result.product!.name,
            price: convertAmount(result.product!.price), // Convert to local currency for display
            stock_quantity: result.product!.stock_quantity
          }));
          setLookupMessage(`✅ Found: ${result.product.name}`);
        } else {
          // Product not found, but barcode is populated
          setLookupMessage('ℹ️ New product - please enter details');
        }
      } catch (error) {
        // Lookup failed, but barcode is still populated
        console.error('Barcode lookup failed:', error);
        setLookupMessage('⚠️ Lookup failed - enter details manually');
      } finally {
        setIsLookingUp(false);
        // Clear the message after 3 seconds
        setTimeout(() => setLookupMessage(''), 3000);
      }
    } else if (scannedBarcode.startsWith('http')) {
      // It's a URL from QR code - show appropriate message
      setLookupMessage('🌐 URL detected - enter product details');
      setTimeout(() => setLookupMessage(''), 3000);
    }
  };

  return (
    <>
      {/* Scanner Modal */}
      {isScanning && (
        <SmartBarcodeScanner
          onScan={handleBarcodeScan}
          onCancel={() => setIsScanning(false)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">{title}</h3>

        {/* Lookup Status Message */}
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

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Price *
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
