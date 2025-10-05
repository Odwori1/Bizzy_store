import React, { useState } from 'react';
import BrowserTest from '../components/barcode/BrowserTest';
import JsQrScanner from '../components/barcode/JsQrScanner';
import SmartBarcodeScanner from '../components/barcode/SmartBarcodeScanner'; // Add this import
import BatchProcessor from '../components/barcode/BatchProcessor';

const ScannerDiagnostics: React.FC = () => {
  const [currentTest, setCurrentTest] = useState<string>('browser');
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [showSmartScanner, setShowSmartScanner] = useState(false);

  const handleScan = (barcode: string) => {
    console.log('Scanned barcode:', barcode);
    setShowQrScanner(false);
    setShowSmartScanner(false);
    alert(`Scanned: ${barcode}`);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Barcode Scanner Diagnostics</h1>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setCurrentTest('browser')}
          className={`px-4 py-2 rounded ${
            currentTest === 'browser' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Browser Test
        </button>
        <button
          onClick={() => setShowQrScanner(true)}
          className="px-4 py-2 rounded bg-green-500 text-white"
        >
          Test QR Scanner
        </button>
        <button
          onClick={() => setShowSmartScanner(true)}
          className="px-4 py-2 rounded bg-purple-500 text-white"
        >
          Test Smart Scanner
        </button>
      </div>

      {currentTest === 'browser' && <BrowserTest />}
      
      {/* Scanner modals */}
      {showQrScanner && (
        <JsQrScanner
          onScan={handleScan}
          onCancel={() => setShowQrScanner(false)}
        />
      )}
      
      {showSmartScanner && (
        <SmartBarcodeScanner
          onScan={handleScan}
          onCancel={() => setShowSmartScanner(false)}
        />
      )}

      <div className="mt-8 p-4 bg-yellow-50 rounded">
        <h3 className="font-bold mb-2">Scanner Guide:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Browser Test</strong>: Check basic camera compatibility</li>
          <li><strong>QR Scanner</strong>: Test QR code scanning functionality</li>
          <li><strong>Smart Scanner</strong>: Test the main scanning interface</li>
        </ul>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded">
        <h3 className="font-bold mb-2">Current Implementation:</h3>
        <p>
          We're using a hybrid approach: QR code scanning with jsQR + manual entry for product barcodes.
          This provides 100% reliability without compatibility issues.
        </p>
      </div>

      {/* ADD BATCH PROCESSOR HERE */}
      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4">Batch Processing</h2>
        <BatchProcessor />
      </div>

      <div className="mt-4 p-4 bg-green-50 rounded">
        <h3 className="font-bold mb-2">✅ Working Features:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>QR code scanning</li>
          <li>Manual barcode entry</li>
          <li>Camera access and permissions</li>
          <li>Clean user interface</li>
        </ul>
      </div>
    </div>
  );
};

export default ScannerDiagnostics;
