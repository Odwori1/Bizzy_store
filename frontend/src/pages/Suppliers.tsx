import React, { useEffect, useState } from 'react';
import { useSuppliers } from '../hooks/useSuppliers';
import { productService } from '../services/products'; // Correct import name
import { Supplier, Product } from '../types';
import SupplierList from '../components/suppliers/SupplierList';
import SupplierForm from '../components/suppliers/SupplierForm';
import PurchaseOrderList from '../components/suppliers/PurchaseOrderList';
import PurchaseOrderForm from '../components/suppliers/PurchaseOrderForm';
import PurchaseOrderDetail from '../components/suppliers/PurchaseOrderDetail';

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
  
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'suppliers' | 'purchase-orders'>('suppliers');
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showPOForm, setShowPOForm] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);

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
        <PurchaseOrderDetail
          purchaseOrder={selectedPO}
          onClose={handleClosePODetail}
        />
      )}
    </div>
  );
};

export default Suppliers;
