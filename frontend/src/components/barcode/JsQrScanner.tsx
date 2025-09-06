import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';

interface JsQrScannerProps {
  onScan: (barcode: string) => void;
  onCancel: () => void;
}

const JsQrScanner: React.FC<JsQrScannerProps> = ({ onScan, onCancel }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [isScanning, setIsScanning] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Starting camera...');
  const lastDetectionTime = useRef<number>(0);

  // Function to process each video frame for barcodes
  const captureAndScan = useCallback(() => {
    if (!webcamRef.current || !canvasRef.current || !isScanning) {
      return;
    }

    // Throttle scanning to improve performance (scan every 300ms)
    const now = Date.now();
    if (now - lastDetectionTime.current < 300) {
      animationFrameRef.current = requestAnimationFrame(captureAndScan);
      return;
    }

    lastDetectionTime.current = now;

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true }); // FIXED: Added performance optimization

    if (video && video.readyState === video.HAVE_ENOUGH_DATA && context) {
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data from canvas - only scan center portion for better performance
      const scanWidth = Math.min(400, canvas.width);
      const scanHeight = Math.min(300, canvas.height);
      const scanX = (canvas.width - scanWidth) / 2;
      const scanY = (canvas.height - scanHeight) / 2;

      const imageData = context.getImageData(scanX, scanY, scanWidth, scanHeight);

      // Try to find a QR/barcode in the image
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      // If found, return the result
      if (code) {
        if (code.data && code.data.trim().length > 0) {
          console.log('Valid barcode found:', code.data);
          setStatus(`✅ Found: ${code.data}`);
          setIsScanning(false);
          onScan(code.data);
          return;
        } else {
          console.log('Empty barcode detected - ignoring');
          setStatus('⚠️ Detected but empty - continue scanning...');
        }
      }
    }

    // Continue scanning
    animationFrameRef.current = requestAnimationFrame(captureAndScan);
  }, [isScanning, onScan]);

  // Start/stop scanning based on state
  useEffect(() => {
    if (isScanning) {
      animationFrameRef.current = requestAnimationFrame(captureAndScan);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isScanning, captureAndScan]);

  const handleUserMedia = () => {
    setError(null);
    setStatus('Camera ready - point at a barcode');
  };

  const handleUserMediaError = (err: string | MediaStreamError) => {
    setError(`Camera error: ${typeof err === 'string' ? err : err.message}`);
    setStatus('❌ Camera error');
  };

  // Test with a manual entry option for debugging
  const handleManualEntry = () => {
    const manualBarcode = prompt('Enter barcode manually (for testing):');
    if (manualBarcode && manualBarcode.trim().length > 0) {
      onScan(manualBarcode.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg max-w-md w-full">
        <h2 className="text-lg font-bold mb-4">Scan Barcode</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Status display */}
        <div className="mb-4 p-2 bg-gray-100 rounded text-center">
          <strong>Status:</strong> {status}
        </div>

        <div className="relative">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              width: { ideal: 640 }, // Lower resolution for better performance
              height: { ideal: 480 },
              facingMode: "environment"
            }}
            className="w-full rounded border-2 border-blue-500"
            onUserMedia={handleUserMedia}
            onUserMediaError={handleUserMediaError}
          />
          {/* Scanning overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="border-2 border-white border-dashed w-48 h-24 rounded-lg"></div>
          </div>
        </div>

        {/* Hidden canvas for processing */}
        <canvas 
          ref={canvasRef} 
          style={{ display: 'none' }}
        />

        <div className="mt-4 flex gap-2 flex-wrap">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={() => setIsScanning(!isScanning)}
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded"
          >
            {isScanning ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={handleManualEntry}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded"
          >
            Manual Entry
          </button>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 rounded text-sm">
          <strong>Scanning Tips:</strong>
          <ul className="list-disc list-inside mt-1 ml-4">
            <li>Ensure good lighting on the barcode</li>
            <li>Hold steady about 15-20cm from the barcode</li>
            <li>Try different angles if detection fails</li>
            <li>Works best with QR codes</li>
            <li>Use "Manual Entry" if scanning fails</li>
          </ul>
        </div>

        <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
          <strong>Debug:</strong> The scanner is optimized for QR codes. If 1D barcodes (like product codes) 
          don't work well, we may need to try a different library specifically for 1D barcodes.
        </div>
      </div>
    </div>
  );
};

export default JsQrScanner;
