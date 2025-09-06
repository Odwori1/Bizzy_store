import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface ModernBarcodeScannerProps {
  onScan: (barcode: string) => void;
  onCancel: () => void;
}

const ModernBarcodeScanner: React.FC<ModernBarcodeScannerProps> = ({ onScan, onCancel }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeScanner = () => {
      try {
        scannerRef.current = new Html5QrcodeScanner(
          "barcode-scanner-container",
          {
            fps: 10,
            qrbox: { width: 300, height: 200 }, // Larger box for barcodes
            // Focus on barcode formats commonly found on products
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.CODE_93,
              Html5QrcodeSupportedFormats.QR_CODE // Keep QR as fallback
            ]
          },
          false
        );

        scannerRef.current.render(
          (decodedText) => {
            // Successfully scanned a barcode
            console.log('Barcode scanned:', decodedText);
            onScan(decodedText);
          },
          (errorMessage) => {
            // These are normal scanning errors - ignore them
            if (!errorMessage.includes('No MultiFormat Readers configured') &&
                !errorMessage.includes('NotFoundException')) {
              console.log('Scan error (normal):', errorMessage);
            }
          }
        );
      } catch (err: any) {
        setError(`Barcode scanner initialization failed: ${err.message}`);
        console.error('Scanner error:', err);
      }
    };

    initializeScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear scanner", error);
        });
        scannerRef.current = null;
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg max-w-md w-full">
        <h2 className="text-lg font-bold mb-4">Scan Product Barcode</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div id="barcode-scanner-container" className="w-full"></div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onCancel}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 rounded text-sm">
          <strong>Barcode Scanning Tips:</strong>
          <ul className="list-disc list-inside mt-1">
            <li>Point at the barcode on your product</li>
            <li>Ensure good lighting on the barcode</li>
            <li>Hold steady about 20-30cm from the camera</li>
            <li>Common barcode types: EAN-13, UPC-A, Code 128</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ModernBarcodeScanner;
