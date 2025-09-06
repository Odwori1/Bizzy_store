import React, { useEffect, useRef, useState } from 'react';
import Quagga from 'quagga';

const QuaggaMinimalTest: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<string>('Initializing...');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const testQuagga = async () => {
      try {
        setStatus('Step 1: Checking camera access...');

        // First, test basic camera access without Quagga
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStatus('Camera access successful - testing Quagga...');
        }

        // Wait a moment for video to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));

        // ADD READINESS CHECK
        if (!videoRef.current || videoRef.current.videoWidth === 0) {
          setError('Video element failed to become ready. Please refresh and try again.');
          setStatus('FAILED - Video not ready');
          return;
        }

        setStatus('Step 2: Initializing Quagga with minimal config...');

        // Minimal Quagga configuration
        Quagga.init({
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: videoRef.current,
            constraints: {
              width: 640,
              height: 480,
              facingMode: "environment"
            },
          },
          decoder: {
            readers: ["ean_reader"]
          },
          locate: false, // Disable advanced locating first
          numOfWorkers: 1,
        }, (err: any) => {
          if (err) {
            setError(`Quagga Init Error: ${err.message}`);
            setStatus('FAILED');
            console.error('Full error object:', err);
            return;
          }

          setStatus('Quagga initialized successfully - starting...');
          Quagga.start();
          setStatus('Quagga started - testing detection...');

          Quagga.onDetected((result: any) => {
            console.log('Detection result:', result);
            setStatus(`DETECTED: ${result.codeResult?.code}`);
          });

          Quagga.onProcessed((result: any) => {
            console.log('Processed result:', result);
          });
        });

      } catch (err: any) {
        setError(`Camera Error: ${err.message}`);
        setStatus('FAILED');
      }
    };

    testQuagga();

    return () => {
      if (Quagga && typeof Quagga.stop === 'function') {
        Quagga.stop();
      }
    };
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Quagga Minimal Test</h2>

      <div className="mb-4 p-3 bg-gray-100 rounded">
        <strong>Status:</strong> {status}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full max-w-md border-2 border-blue-500 rounded"
        style={{ transform: 'scaleX(-1)' }} // Mirror for rear camera
      />

      <div className="mt-4 p-3 bg-yellow-50 rounded">
        <strong>Test Steps:</strong>
        <ol className="list-decimal list-inside mt-2">
          <li>Check camera permissions</li>
          <li>Test basic camera access</li>
          <li>Initialize Quagga with minimal config</li>
          <li>Check for initialization errors</li>
          <li>Test basic scanning</li>
        </ol>
      </div>
    </div>
  );
};

export default QuaggaMinimalTest;
