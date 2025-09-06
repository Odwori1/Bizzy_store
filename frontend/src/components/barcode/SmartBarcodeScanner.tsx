import React, { useState } from 'react';
import JsQrScanner from './JsQrScanner';

interface SmartBarcodeScannerProps {
  onScan: (barcode: string) => void;
  onCancel: () => void;
}

const SmartBarcodeScanner: React.FC<SmartBarcodeScannerProps> = ({ onScan, onCancel }) => {
  const [activeMode, setActiveMode] = useState<'qr' | 'manual' | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');

  const handleQrScan = (barcode: string) => {
    onScan(barcode);
    setActiveMode(null);
  };

  const handleManualSubmit = () => {
    if (manualBarcode.trim().length > 3) { // Basic validation
      onScan(manualBarcode.trim());
      setActiveMode(null);
      setManualBarcode('');
    }
  };

  if (activeMode === 'qr') {
    return <JsQrScanner onScan={handleQrScan} onCancel={() => setActiveMode(null)} />;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4 text-center">Scan or Enter Barcode</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setActiveMode('qr')}
            className="bg-green-500 text-white py-3 px-4 rounded-lg text-center hover:bg-green-600 transition-colors"
          >
            <div className="font-semibold">Scan QR Code</div>
            <div className="text-xs opacity-90">For QR codes only</div>
          </button>
          
          <button
            onClick={() => setActiveMode('manual')}
            className="bg-blue-500 text-white py-3 px-4 rounded-lg text-center hover:bg-blue-600 transition-colors"
          >
            <div className="font-semibold">Enter Barcode</div>
            <div className="text-xs opacity-90">For product barcodes</div>
          </button>
        </div>

        {activeMode === 'manual' && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Product Barcode:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value.replace(/\D/g, ''))} // Numbers only
                placeholder="e.g., 6291016005361"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={handleManualSubmit}
                disabled={manualBarcode.length < 6}
                className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Submit
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Enter the numbers from the product barcode
            </p>
          </div>
        )}

        <div className="bg-yellow-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Why two options?</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• <strong>QR Scanner</strong>: Best for QR codes and website links</li>
            <li>• <strong>Manual Entry</strong>: Best for product barcodes (UPC/EAN)</li>
            <li>• Both options will automatically lookup product information</li>
          </ul>
        </div>

        <button
          onClick={onCancel}
          className="w-full bg-gray-500 text-white py-2 rounded-md hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default SmartBarcodeScanner;
