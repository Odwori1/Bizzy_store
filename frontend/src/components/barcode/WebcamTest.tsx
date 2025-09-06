import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';

const WebcamTest: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkCamera = async () => {
      try {
        // Check if browser supports getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError('Browser does not support camera access');
          return;
        }

        // Try to get camera access
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        
        setHasPermission(true);
        // Clean up stream when component unmounts
        return () => {
          stream.getTracks().forEach(track => track.stop());
        };
      } catch (err: any) {
        console.error('Camera error:', err);
        setError(`Camera access denied: ${err.message}`);
        setHasPermission(false);
      }
    };

    checkCamera();
  }, []);

  const takePhoto = () => {
    if (webcamRef.current) {
      const screenshot = webcamRef.current.getScreenshot();
      if (screenshot) {
        console.log('Photo taken successfully');
        // You can display this in an <img> tag to verify image quality
        const img = document.createElement('img');
        img.src = screenshot;
        img.style.width = '200px';
        document.body.appendChild(img);
      }
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Webcam Diagnostic Test</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {hasPermission === null && <p>Checking camera permissions...</p>}
      {hasPermission === false && <p>Camera access denied. Please check browser permissions.</p>}
      
      {hasPermission && (
        <div>
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode: 'environment' }}
            className="w-full max-w-md rounded border-2 border-green-500"
          />
          <button
            onClick={takePhoto}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Take Test Photo
          </button>
          <p className="mt-2 text-sm text-gray-600">
            Click the button to test if the camera can capture images properly.
            Check the console for results.
          </p>
        </div>
      )}
    </div>
  );
};

export default WebcamTest;
