import React, { useEffect, useState } from 'react';
import { useSuppliers } from '../hooks/useSuppliers';
import { productService } from '../services/products';
import { Supplier, Product } from '../types';
import SupplierList from '../components/suppliers/SupplierList';
import SupplierForm from '../components/suppliers/SupplierForm';
import PurchaseOrderList from '../components/suppliers/PurchaseOrderList';
import PurchaseOrderForm from '../components/suppliers/PurchaseOrderForm';
import PurchaseOrderDetail from '../components/suppliers/PurchaseOrderDetail';
import { CurrencyDisplay } from '../components/CurrencyDisplay';
import { useBusinessStore } from '../hooks/useBusiness'; // FIXED: useBusinessStore instead of useBusiness

const Suppliers: React.FC = () => {
  const {
    suppliers,
    purchaseOrders,
    loading,
    error,
    loadSuppliers,
    loadPurchaseOrders,
    clearError
  } = useSuppliers();

  const { business } = useBusinessStore(); // FIXED: use the store correctly
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'suppliers' | 'purchase-orders'>('suppliers');
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showPOForm, setShowPOForm] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);

  // Get currency context from business store - following the same pattern as Cart component
  const currencyContext = business?.currency_code ? {
    originalAmount: 0, // Not needed for display-only context
    originalCurrencyCode: business.currency_code,
    exchangeRateAtCreation: 1 // Default exchange rate for local currency
  } : {
    originalAmount: 0,
    originalCurrencyCode: 'UGX', // Fallback currency
    exchangeRateAtCreation: 1
  };

  useEffect(() => {
    loadSuppliers();
    loadPurchaseOrders();
    loadProducts();
  }, [loadSuppliers, loadPurchaseOrders]);

  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const productsData = await productService.getProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleSupplierCreated = () => {
    setShowSupplierForm(false);
    loadSuppliers();
  };

  const handlePOCreated = () => {
    setShowPOForm(false);
    loadPurchaseOrders();
  };

  const handleViewPODetail = (po: any) => {
    setSelectedPO(po);
  };

  const handleClosePODetail = () => {
    setSelectedPO(null);
  };

  // Enhanced PurchaseOrderDetail with proper currency display
  const EnhancedPurchaseOrderDetail = ({ purchaseOrder, onClose }: any) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-11/12 md:w-3/4 lg:w-1/2 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Purchase Order: {purchaseOrder.po_number}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h4 className="font-medium text-gray-700">Supplier Information</h4>
              <p>{purchaseOrder.supplier_name || `Supplier #${purchaseOrder.supplier_id}`}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700">Status</h4>
              <span className={`px-2 py-1 rounded text-xs ${
                purchaseOrder.status === 'received' ? 'bg-green-100 text-green-800' :
                purchaseOrder.status === 'ordered' ? 'bg-blue-100 text-blue-800' :
                purchaseOrder.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                'bg-red-100 text-red-800'
              }`}>
                {purchaseOrder.status?.toUpperCase()}
              </span>
            </div>
            <div>
              <h4 className="font-medium text-gray-700">Order Date</h4>
              <p>{new Date(purchaseOrder.order_date).toLocaleDateString()}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700">Expected Delivery</h4>
              <p>{purchaseOrder.expected_delivery ? new Date(purchaseOrder.expected_delivery).toLocaleDateString() : 'Not set'}</p>
            </div>
            <div className="md:col-span-2">
              <h4 className="font-medium text-gray-700">Total Amount</h4>
              <p className="text-lg font-semibold">
                <CurrencyDisplay
                  amount={purchaseOrder.total_amount}
                  originalAmount={purchaseOrder.total_amount}
                  originalCurrencyCode={currencyContext.originalCurrencyCode}
                  exchangeRateAtCreation={currencyContext.exchangeRateAtCreation}
                />
              </p>
            </div>
            {purchaseOrder.notes && (
              <div className="md:col-span-2">
                <h4 className="font-medium text-gray-700">Notes</h4>
                <p className="text-sm text-gray-600">{purchaseOrder.notes}</p>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-2">Items</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Product</th>
                    <th className="px-4 py-2 text-left">Ordered</th>
                    <th className="px-4 py-2 text-left">Received</th>
                    <th className="px-4 py-2 text-left">Unit Cost</th>
                    <th className="px-4 py-2 text-left">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrder.items?.map((item: any) => (
                    <tr key={item.id} className="border-b">
                      <td className="px-4 py-2">{item.product_name || `Product #${item.product_id}`}</td>
                      <td className="px-4 py-2">{item.quantity}</td>
                      <td className="px-4 py-2">{item.received_quantity || 0}</td>
                      <td className="px-4 py-2">
                        <CurrencyDisplay
                          amount={item.unit_cost}
                          originalAmount={item.unit_cost}
                          originalCurrencyCode={currencyContext.originalCurrencyCode}
                          exchangeRateAtCreation={currencyContext.exchangeRateAtCreation}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <CurrencyDisplay
                          amount={item.unit_cost * item.quantity}
                          originalAmount={item.unit_cost * item.quantity}
                          originalCurrencyCode={currencyContext.originalCurrencyCode}
                          exchangeRateAtCreation={currencyContext.exchangeRateAtCreation}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            {purchaseOrder.status === 'draft' && (
              <>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  Mark as Ordered
                </button>
                <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
                  Cancel Order
                </button>
              </>
            )}
            <button 
              onClick={onClose}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading && suppliers.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse">Loading suppliers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
          <button onClick={clearError} className="ml-4 text-red-800 underline">
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Supplier Management</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'suppliers'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Suppliers
          </button>
          <button
            onClick={() => setActiveTab('purchase-orders')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'purchase-orders'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Purchase Orders
          </button>
        </div>
      </div>

      {activeTab === 'suppliers' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Suppliers</h2>
            <button
              onClick={() => setShowSupplierForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Add Supplier
            </button>
          </div>
          <SupplierList suppliers={suppliers} />
        </div>
      )}

      {activeTab === 'purchase-orders' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Purchase Orders</h2>
            <button
              onClick={() => setShowPOForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Create PO
            </button>
          </div>
          <PurchaseOrderList
            purchaseOrders={purchaseOrders}
            onViewDetail={handleViewPODetail}
          />
        </div>
      )}

      {showSupplierForm && (
        <SupplierForm
          onClose={() => setShowSupplierForm(false)}
          onSuccess={handleSupplierCreated}
        />
      )}

      {showPOForm && (
        <PurchaseOrderForm
          suppliers={suppliers}
          products={products}
          onClose={() => setShowPOForm(false)}
          onSuccess={handlePOCreated}
        />
      )}

      {selectedPO && (
        <EnhancedPurchaseOrderDetail
          purchaseOrder={selectedPO}
          onClose={handleClosePODetail}
        />
      )}
    </div>
  );
};

export default Suppliers;
