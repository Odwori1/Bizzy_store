import React, { useState } from 'react';
import { PurchaseOrderCreate, PurchaseOrderItemCreate, Supplier, Product } from '../../types';
import { useSuppliers } from '../../hooks/useSuppliers';

interface PurchaseOrderFormProps {
  suppliers: Supplier[];
  products: Product[];
  onClose: () => void;
  onSuccess: () => void;
}

const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({ suppliers, products, onClose, onSuccess }) => {
  const { createPurchaseOrder, loading, error } = useSuppliers();
  const [formData, setFormData] = useState<Omit<PurchaseOrderCreate, 'items'>>({
    supplier_id: 0,
    expected_delivery: '',
    notes: ''
  });
  const [items, setItems] = useState<PurchaseOrderItemCreate[]>([]);
  const [currentItem, setCurrentItem] = useState<PurchaseOrderItemCreate>({
    product_id: 0,
    quantity: 1,
    unit_cost: 0,
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    try {
      await createPurchaseOrder({
        ...formData,
        items
      });
      onSuccess();
    } catch (error) {
      // Error handled by store
    }
  };

  const handleAddItem = () => {
    if (currentItem.product_id && currentItem.quantity > 0 && currentItem.unit_cost >= 0) {
      setItems([...items, { ...currentItem }]);
      setCurrentItem({
        product_id: 0,
        quantity: 1,
        unit_cost: 0,
        notes: ''
      });
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const getProductName = (productId: number) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : `Product #${productId}`;
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create Purchase Order</h3>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Supplier *</label>
                <select
                  name="supplier_id"
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({ ...formData, supplier_id: parseInt(e.target.value) })}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value={0}>Select Supplier</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Expected Delivery</label>
                <input
                  type="date"
                  name="expected_delivery"
                  value={formData.expected_delivery}
                  onChange={(e) => setFormData({ ...formData, expected_delivery: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="text-md font-medium text-gray-900 mb-4">Items</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Product *</label>
                  <select
                    value={currentItem.product_id}
                    onChange={(e) => setCurrentItem({ ...currentItem, product_id: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value={0}>Select Product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit Cost ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentItem.unit_cost}
                    onChange={(e) => setCurrentItem({ ...currentItem, unit_cost: parseFloat(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Add Item
                  </button>
                </div>
              </div>

              {items.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="text-left text-sm font-medium text-gray-700">Product</th>
                        <th className="text-left text-sm font-medium text-gray-700">Quantity</th>
                        <th className="text-left text-sm font-medium text-gray-700">Unit Cost</th>
                        <th className="text-left text-sm font-medium text-gray-700">Total</th>
                        <th className="text-left text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={index}>
                          <td className="text-sm text-gray-900">{getProductName(item.product_id)}</td>
                          <td className="text-sm text-gray-900">{item.quantity}</td>
                          <td className="text-sm text-gray-900">${item.unit_cost.toFixed(2)}</td>
                          <td className="text-sm text-gray-900">${(item.quantity * item.unit_cost).toFixed(2)}</td>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-600 hover:text-red-900 text-sm"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4 text-right font-semibold">
                    Total: ${totalAmount.toFixed(2)}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || items.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Purchase Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderForm;
