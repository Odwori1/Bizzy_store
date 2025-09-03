import React, { useState, useEffect, useCallback, useRef } from 'react';
import Webcam from 'react-webcam';

// Declare the BarcodeDetector type for TypeScript (it's a new API)
declare global {
  interface Window {
    BarcodeDetector?: any;
  }
}

interface WebBarcodeScannerProps {
  onScan: (barcode: string) => void;
  onCancel: () => void;
}

const WebBarcodeScanner: React.FC<WebBarcodeScannerProps> = ({ onScan, onCancel }) => {
  const webcamRef = useRef<Webcam>(null);
  const [hasNativeSupport, setHasNativeSupport] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check if the browser supports the native BarcodeDetector API
  useEffect(() => {
    if (typeof window !== 'undefined' && window.BarcodeDetector) {
      setHasNativeSupport(true);
    } else {
      setHasNativeSupport(false);
      setError("Native barcode scanning not supported. Using fallback.");
      // We would initialize Quagga2 here in a more complete implementation
    }
  }, []);

  // Function to capture an image and try to scan it using the native API
  const captureAndScan = useCallback(async () => {
    if (!webcamRef.current || !isScanning) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    try {
      // Create an image element to draw to a canvas
      const img = new Image();
      img.src = imageSrc;
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, img.width, img.height);

        // Use the native BarcodeDetector API
        const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'] });
        const barcodes = await detector.detect(canvas);

        if (barcodes && barcodes.length > 0) {
          // Found a barcode! Stop scanning and return the result.
          setIsScanning(false);
          onScan(barcodes[0].rawValue);
        }
      };
    } catch (err) {
      console.error('Barcode detection error:', err);
      setError('Failed to scan barcode.');
    }
  }, [isScanning, onScan]);

  // Set up an interval to continuously capture and scan images
  useEffect(() => {
    if (!hasNativeSupport || !isScanning) return;

    const interval = setInterval(captureAndScan, 1000); // Scan every second
    return () => clearInterval(interval);
  }, [hasNativeSupport, isScanning, captureAndScan]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg max-w-md w-full">
        <h2 className="text-lg font-bold mb-4">Scan Barcode</h2>
        
        {error && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="relative">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: 'environment' }} // Use the rear camera on mobile
            className="w-full rounded"
          />
          {/* Visual guide for scanning */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="border-2 border-white border-dashed w-48 h-24 rounded-lg"></div>
          </div>
        </div>

        <div className="mt-4 flex justify-between">
          <button
            onClick={onCancel}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={() => isScanning ? setIsScanning(false) : setIsScanning(true)}
            className={isScanning ? 'bg-red-500 text-white px-4 py-2 rounded' : 'bg-green-500 text-white px-4 py-2 rounded'}
          >
            {isScanning ? 'Stop Scanning' : 'Start Scanning'}
          </button>
        </div>

        {!hasNativeSupport && (
          <div className="mt-4 text-sm text-gray-600">
            <p>Native barcode scanning not available in your browser.</p>
            <p>Fallback mode would be implemented here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebBarcodeScanner;
