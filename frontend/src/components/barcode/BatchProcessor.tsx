import React, { useState } from 'react';
import { barcodeBatchService } from '../../services/barcodeBatchService';

const BatchProcessor: React.FC = () => {
  const [csvData, setCsvData] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleProcessCSV = async () => {
    if (!csvData.trim()) return;
    
    setIsProcessing(true);
    try {
      const rows = barcodeBatchService.parseCSV(csvData);
      const result = await barcodeBatchService.processCSVData(rows);
      setResults(result);
    } catch (error) {
      console.error('Batch processing error:', error);
      alert('Failed to process CSV data');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportResults = () => {
    if (!results) return;
    
    const csv = barcodeBatchService.exportResultsToCSV(results);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'barcode_batch_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadTemplate = () => {
    setCsvData(barcodeBatchService.generateCSVTemplate());
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Batch Barcode Processor</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          CSV Data (barcode, name, price, quantity):
        </label>
        <textarea
          value={csvData}
          onChange={(e) => setCsvData(e.target.value)}
          rows={10}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Paste CSV data here..."
        />
      </div>

      <div className="flex space-x-4 mb-4">
        <button
          onClick={loadTemplate}
          className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
        >
          Load Template
        </button>
        
        <button
          onClick={handleProcessCSV}
          disabled={isProcessing || !csvData.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300"
        >
          {isProcessing ? 'Processing...' : 'Process CSV'}
        </button>
        
        {results && (
          <button
            onClick={handleExportResults}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Export Results
          </button>
        )}
      </div>

      {results && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Results</h3>
          <div className="grid grid-cols-4 gap-4 mb-2">
            <div className="bg-blue-100 p-3 rounded text-center">
              <div className="text-2xl font-bold">{results.total}</div>
              <div className="text-sm">Total</div>
            </div>
            <div className="bg-green-100 p-3 rounded text-center">
              <div className="text-2xl font-bold">{results.successful}</div>
              <div className="text-sm">Successful</div>
            </div>
            <div className="bg-red-100 p-3 rounded text-center">
              <div className="text-2xl font-bold">{results.failed}</div>
              <div className="text-sm">Failed</div>
            </div>
            <div className="bg-gray-100 p-3 rounded text-center">
              <div className="text-2xl font-bold">
                {Math.round((results.successful / results.total) * 100)}%
              </div>
              <div className="text-sm">Success Rate</div>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Barcode</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Product</th>
                  <th className="px-4 py-2 text-left">Error</th>
                </tr>
              </thead>
              <tbody>
                {results.results.map((result: any, index: number) => (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-2 font-mono">{result.barcode}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {result.success ? 'SUCCESS' : 'FAILED'}
                      </span>
                    </td>
                    <td className="px-4 py-2">{result.productName || '-'}</td>
                    <td className="px-4 py-2 text-red-600 text-sm">{result.error || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchProcessor;
