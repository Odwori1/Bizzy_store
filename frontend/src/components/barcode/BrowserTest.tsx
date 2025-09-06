import React, { useEffect, useState } from 'react';

const BrowserTest: React.FC = () => {
  const [compatibility, setCompatibility] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    const testCompatibility = () => {
      const results: {[key: string]: boolean} = {};

      // Basic WebRTC support
      results.getUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      
      // Canvas support
      results.canvas = !!document.createElement('canvas').getContext;
      
      // Web Workers support
      results.webWorkers = typeof Worker !== 'undefined';
      
      // BarcodeDetector API support
      results.barcodeDetector = !!(window as any).BarcodeDetector;
      
      // Check if Quagga is loaded
      results.quaggaLoaded = typeof (window as any).Quagga !== 'undefined';
      
      // Check specific Quagga functions
      if (results.quaggaLoaded) {
        const Quagga = (window as any).Quagga;
        results.quaggaInit = typeof Quagga.init === 'function';
        results.quaggaStart = typeof Quagga.start === 'function';
        results.quaggaStop = typeof Quagga.stop === 'function';
      }

      setCompatibility(results);
    };

    testCompatibility();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Browser Compatibility Test</h2>
      
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(compatibility).map(([feature, supported]) => (
          <div
            key={feature}
            className={`p-3 rounded ${
              supported ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            <strong>{feature}:</strong> {supported ? '✅' : '❌'}
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded">
        <strong>User Agent:</strong> {navigator.userAgent}
      </div>
    </div>
  );
};

export default BrowserTest;
