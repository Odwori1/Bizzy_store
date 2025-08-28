import React, { useState, useEffect } from 'react';
import { useInventory } from '../hooks/useInventory';
import { InventoryAdjustment } from '../types';

export default function Inventory() {
  const {
    stockLevels,
    lowStockAlerts,
    inventoryHistory,
    loading,
    error,
    loadStockLevels,
    loadLowStockAlerts,
    loadInventoryHistory,
    adjustInventory,
    clearError
  } = useInventory();

  const [adjustmentForm, setAdjustmentForm] = useState<InventoryAdjustment>({
    product_id: 0,
    quantity_change: 0,
    reason: ''
  });
  const [selectedProductId, setSelectedProductId] = useState<number | undefined>();

  // Load data on component mount
  useEffect(() => {
    loadStockLevels();
    loadLowStockAlerts();
    loadInventoryHistory();
  }, []);

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adjustInventory(adjustmentForm);
      setAdjustmentForm({ product_id: 0, quantity_change: 0, reason: '' });
      // Reload data to reflect changes
      loadStockLevels();
      loadLowStockAlerts();
      loadInventoryHistory(selectedProductId);
    } catch (error) {
      // Error handled by the hook
    }
  };

  const handleProductFilter = (productId: number | undefined) => {
    setSelectedProductId(productId);
    loadInventoryHistory(productId);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Track and manage product stock levels</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
          <button onClick={clearError} className="absolute top-0 right-0 px-4 py-3">
            <span className="text-2xl">&times;</span>
          </button>
        </div>
      )}

      {/* Low Stock Alerts */}
      {lowStockAlerts.length > 0 && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <h3 className="font-bold mb-2">⚠️ Low Stock Alerts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {lowStockAlerts.map(alert => (
              <div key={alert.product_id} className="bg-yellow-50 p-2 rounded">
                <strong>{alert.product_name}</strong>: {alert.current_stock} / {alert.min_stock_level}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Levels Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Current Stock Levels</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Product</th>
                  <th className="px-4 py-2 text-left">Stock</th>
                  <th className="px-4 py-2 text-left">Min Level</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {stockLevels.map(item => (
                  <tr 
                    key={item.product_id} 
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleProductFilter(item.product_id)}
                  >
                    <td className="px-4 py-2">{item.product_name}</td>
                    <td className="px-4 py-2">{item.current_stock}</td>
                    <td className="px-4 py-2">{item.min_stock_level}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.needs_restock 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {item.needs_restock ? 'Needs Restock' : 'OK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inventory Adjustment Form */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">Adjust Inventory</h2>
          </div>
          <div className="p-4">
            <form onSubmit={handleAdjustment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product</label>
                <select
                  required
                  value={adjustmentForm.product_id}
                  onChange={(e) => setAdjustmentForm({
                    ...adjustmentForm,
                    product_id: parseInt(e.target.value)
                  })}
                  className="w-full p-2 border rounded"
                >
                  <option value={0}>Select a product</option>
                  {stockLevels.map(product => (
                    <option key={product.product_id} value={product.product_id}>
                      {product.product_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Quantity Change</label>
                <input
                  type="number"
                  required
                  value={adjustmentForm.quantity_change}
                  onChange={(e) => setAdjustmentForm({
                    ...adjustmentForm,
                    quantity_change: parseInt(e.target.value)
                  })}
                  className="w-full p-2 border rounded"
                  placeholder="Positive for restock, negative for deduction"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <input
                  type="text"
                  value={adjustmentForm.reason}
                  onChange={(e) => setAdjustmentForm({
                    ...adjustmentForm,
                    reason: e.target.value
                  })}
                  className="w-full p-2 border rounded"
                  placeholder="Optional reason for adjustment"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Adjust Inventory'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Inventory History */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            Inventory History {selectedProductId && `(Filtered)`}
          </h2>
          {selectedProductId && (
            <button
              onClick={() => handleProductFilter(undefined)}
              className="text-sm text-blue-500 hover:text-blue-700"
            >
              Clear Filter
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Product</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Change</th>
                <th className="px-4 py-2 text-left">Previous</th>
                <th className="px-4 py-2 text-left">New</th>
                <th className="px-4 py-2 text-left">Reason</th>
                <th className="px-4 py-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {inventoryHistory.map(history => (
                <tr key={history.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{history.product_name || `Product ${history.product_id}`}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      history.change_type === 'restock' 
                        ? 'bg-green-100 text-green-800'
                        : history.change_type === 'sale'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {history.change_type}
                    </span>
                  </td>
                  <td className={`px-4 py-2 ${
                    history.quantity_change > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {history.quantity_change > 0 ? '+' : ''}{history.quantity_change}
                  </td>
                  <td className="px-4 py-2">{history.previous_quantity}</td>
                  <td className="px-4 py-2">{history.new_quantity}</td>
                  <td className="px-4 py-2">{history.reason || '-'}</td>
                  <td className="px-4 py-2">
                    {new Date(history.changed_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {inventoryHistory.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No inventory history found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
