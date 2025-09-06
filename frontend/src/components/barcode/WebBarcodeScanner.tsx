import React, { useState, useEffect, useCallback, useRef } from 'react';
import Webcam from 'react-webcam';
import Quagga from 'quagga';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasNativeSupport, setHasNativeSupport] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [isQuaggaInitialized, setIsQuaggaInitialized] = useState<boolean>(false);
  const [lastProcessedResult, setLastProcessedResult] = useState<any>(null);
  const [testImages, setTestImages] = useState<string[]>([]);

  const addDebugLog = (message: string) => {
    console.log(message);
    setDebugLog(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const isVideoReady = (video: HTMLVideoElement | null): boolean => {
    return !!video && video.videoWidth > 0 && video.videoHeight > 0;
  };

  useEffect(() => {
    addDebugLog('Scanner component mounted');

    const checkNativeSupport = async () => {
      addDebugLog('Checking for native BarcodeDetector support...');
      if (typeof window !== 'undefined' && window.BarcodeDetector) {
        try {
          const detector = new window.BarcodeDetector();
          const supported = await detector.getSupportedFormats();
          addDebugLog(`Native supported formats: ${supported.join(', ')}`);
          if (supported.length > 0) {
            setHasNativeSupport(true);
            addDebugLog('Using native BarcodeDetector API');
            return;
          }
        } catch (e) {
          addDebugLog(`Native API error: ${e}`);
        }
      }
      setHasNativeSupport(false);
      addDebugLog('Native API not available, using Quagga2 fallback');
    };

    checkNativeSupport();

    return () => {
      if (Quagga && typeof Quagga.stop === 'function') {
        Quagga.stop();
        addDebugLog('Quagga stopped on unmount');
      }
    };
  }, []);

  // Effect to mirror the webcam stream to a raw video element for Quagga
  useEffect(() => {
    if (webcamRef.current?.video && videoRef.current) {
      const stream = webcamRef.current.video.srcObject;
      if (stream && videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
    }
  });

  // Draw debugging information on canvas
  const drawDebugInfo = useCallback((result: any) => {
    if (!canvasRef.current || !result) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw a placeholder if no boxes
    if (!result.boxes || result.boxes.length === 0) {
      ctx.fillStyle = 'gray';
      ctx.font = '14px Arial';
      ctx.fillText('Waiting for detection...', 10, 30);
      return;
    }

    if (result.boxes) {
      // Draw detection boxes
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;

      result.boxes.forEach((box: number[], index: number) => {
        if (box.length === 8) { // [x1, y1, x2, y2, x3, y3, x4, y4]
          ctx.beginPath();
          ctx.moveTo(box[0], box[1]);
          ctx.lineTo(box[2], box[3]);
          ctx.lineTo(box[4], box[5]);
          ctx.lineTo(box[6], box[7]);
          ctx.closePath();
          ctx.stroke();

          // Label the box
          ctx.fillStyle = 'red';
          ctx.font = '12px Arial';
          ctx.fillText(`Region ${index}`, box[0], box[1] - 5);
        }
      });
    }

    if (result.codeResult && result.codeResult.code) {
      // Draw successful detection
      ctx.fillStyle = 'green';
      ctx.font = '16px Arial';
      ctx.fillText(`✅ FOUND: ${result.codeResult.code}`, 10, 30);
    }
  }, []);

  const initializeQuagga = useCallback(() => {
    addDebugLog('Initializing Quagga2...');

    // SAFETY CHECK - Add this at the very start of the function
    if (!isVideoReady(videoRef.current)) {
      addDebugLog('Quagga init aborted: Video element is not ready.');
      setError('Camera feed is not ready yet. Please try again.');
      return;
    }

    if (!webcamRef.current?.video) {
      addDebugLog('Webcam video element not ready');
      return;
    }

    // Set canvas size to match video
    if (canvasRef.current && webcamRef.current.video) {
      canvasRef.current.width = webcamRef.current.video.videoWidth || 640;
      canvasRef.current.height = webcamRef.current.video.videoHeight || 480;
    }

    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: videoRef.current,
        constraints: {
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          facingMode: "environment"
        },
      },
      decoder: {
        readers: ["ean_reader", "upc_reader", "code_128_reader", "code_39_reader"]
      },
      locator: {
        patchSize: "large",
        halfSample: true
      },
      locate: true,
      numOfWorkers: 4,
      frequency: 10,
    }, (err: any) => {
      if (err) {
        addDebugLog(`Quagga init error: ${err.message}`);
        setError(`Scanner initialization failed: ${err.message}`);
        return;
      }
      addDebugLog('Quagga initialized successfully');
      setIsQuaggaInitialized(true);
      Quagga.start();
      addDebugLog('Quagga scanning started');
    });

    Quagga.onProcessed((result: any) => {
      if (result) {
        setLastProcessedResult(result);
        drawDebugInfo(result);

        if (result.boxes) {
          addDebugLog(`Processing frame - found ${result.boxes.length} detection regions`);
        }
      }
    });

    Quagga.onDetected((result: any) => {
      if (result && result.codeResult && result.codeResult.code) {
        addDebugLog(`✅ Barcode detected: ${result.codeResult.code} (${result.codeResult.format})`);
        setIsScanning(false);
        Quagga.stop();
        onScan(result.codeResult.code);
      }
    });

  }, [onScan, drawDebugInfo]);

  const captureTestImage = () => {
    if (webcamRef.current) {
      const screenshot = webcamRef.current.getScreenshot();
      if (screenshot) {
        addDebugLog('Test image captured successfully');
        setTestImages(prev => [...prev, screenshot]);

        // Create and display test image
        const testImageDiv = document.getElementById('test-images-container');
        if (testImageDiv) {
          const img = document.createElement('img');
          img.src = screenshot;
          img.style.width = '200px';
          img.style.height = '150px';
          img.style.border = '2px solid blue';
          img.style.margin = '5px';
          img.style.objectFit = 'cover';
          testImageDiv.appendChild(img);
        }
      } else {
        addDebugLog('Failed to capture test image - screenshot is null');
      }
    } else {
      addDebugLog('Webcam ref is not available');
    }
  };

  const restartScanner = () => {
    addDebugLog('Restarting scanner...');
    if (Quagga && typeof Quagga.stop === 'function') {
      Quagga.stop();
    }
    setIsScanning(false);
    setTimeout(() => {
      initializeQuagga();
      setIsScanning(true);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      {/* Add this hidden video element for Quagga */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: 'none' }} // <--- Hides it from the user
      />
      <div className="bg-white p-4 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <h2 className="text-lg font-bold mb-4">Barcode Scanner - DEBUG MODE</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Webcam Feed */}
          <div className="relative">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: "environment"
              }}
              className="w-full rounded border-2 border-blue-500"
              onUserMedia={() => {
                addDebugLog('Webcam access granted - feed active');

                // Use an interval to check for video readiness continuously
                const readyCheckInterval = setInterval(() => {
                  if (isVideoReady(videoRef.current)) {
                    clearInterval(readyCheckInterval); // Stop checking once ready
                    addDebugLog(`Video is ready. Dimensions: ${videoRef.current!.videoWidth}x${videoRef.current!.videoHeight}`);
                    if (!hasNativeSupport) {
                      addDebugLog('Initializing Quagga...');
                      initializeQuagga();
                    }
                  } else {
                    // Keep checking until the video has valid dimensions
                    addDebugLog('Waiting for video dimensions to be available...');
                  }
                }, 100); // Check every 100ms
              }}
              onUserMediaError={(err) => addDebugLog(`Webcam error: ${err}`)}
              screenshotQuality={1} // Highest quality
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-white border-dashed w-48 h-24 rounded-lg"></div>
            </div>
          </div>

          {/* Debug Canvas Overlay */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="w-full rounded border-2 border-green-500"
              width={640}
              height={480}
              style={{ backgroundColor: '#f0f0f0' }}
            />
            <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs p-1 rounded">
              Quagga Debug View
            </div>
          </div>
        </div>

        {/* Test Images Container - FIXED */}
        <div id="test-images-container" className="mb-4 p-2 bg-gray-100 rounded">
          <h3 className="text-sm font-semibold mb-2">Test Images:</h3>
          <div className="flex flex-wrap gap-2">
            {testImages.map((imgSrc, index) => (
              <img
                key={index}
                src={imgSrc}
                alt={`Test ${index + 1}`}
                className="w-32 h-24 object-cover border-2 border-blue-400 rounded"
              />
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={onCancel}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
          <button
            onClick={() => setIsScanning(!isScanning)}
            className={isScanning ? 'bg-red-500 text-white px-4 py-2 rounded' : 'bg-green-500 text-white px-4 py-2 rounded'}
          >
            {isScanning ? 'Stop Scanning' : 'Start Scanning'}
          </button>
          <button
            onClick={captureTestImage}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Test Image Quality
          </button>
          <button
            onClick={restartScanner}
            className="bg-purple-500 text-white px-4 py-2 rounded"
          >
            Restart Scanner
          </button>
        </div>

        {/* Debug Info */}
        <div className="bg-gray-100 p-3 rounded text-xs mb-4">
          <strong>Scanner Status:</strong>
          <div>Engine: {hasNativeSupport ? 'Native API' : 'Quagga2'}</div>
          <div>State: {isScanning ? '🟢 Scanning...' : '⏸️ Paused'}</div>
          <div>Initialized: {isQuaggaInitialized ? '✅ Yes' : '❌ No'}</div>
          {lastProcessedResult && (
            <div>Last Frame: {lastProcessedResult.boxes?.length || 0} detection regions</div>
          )}
        </div>

        {/* Debug Log */}
        <div className="bg-black text-green-400 p-3 rounded text-xs font-mono max-h-32 overflow-y-auto mb-4">
          <strong>Debug Log:</strong>
          {debugLog.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>

        {/* Tips */}
        <div className="mt-4 p-3 bg-yellow-50 rounded text-sm">
          <strong>Scanning Tips:</strong>
          <ul className="list-disc list-inside mt-1">
            <li>Ensure good lighting - avoid shadows on the barcode</li>
            <li>Hold steady about 20-30cm from the barcode</li>
            <li>Try different angles if detection fails</li>
            <li>Click "Test Image Quality" to check camera clarity</li>
            <li>Use "Restart Scanner" if detection gets stuck</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WebBarcodeScanner;
