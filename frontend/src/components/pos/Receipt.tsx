import React, { useState, useEffect } from 'react';
import { Business, Sale, Payment, SaleItem } from '../../types';
import { productService } from '../../services/sales';

interface ReceiptProps {
  sale: Sale;
  business: Business | null;
  payments: Payment[];
  onClose: () => void;
  amountReceived?: number;
}

interface EnhancedSaleItem extends SaleItem {
  product_name?: string;
}

export default function Receipt({ sale, business, payments, onClose, amountReceived }: ReceiptProps) {
  const [itemsWithNames, setItemsWithNames] = useState<EnhancedSaleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProductNames = async () => {
      try {
        const enhancedItems = await Promise.all(
          sale.sale_items.map(async (item) => {
            try {
              const product = await productService.getProduct(item.product_id);
              return { ...item, product_name: product.name };
            } catch (error) {
              console.error(`Failed to fetch product ${item.product_id}:`, error);
              return { ...item, product_name: `Product #${item.product_id}` };
            }
          })
        );
        setItemsWithNames(enhancedItems);
      } catch (error) {
        console.error('Failed to fetch product names:', error);
        setItemsWithNames(sale.sale_items.map(item => ({ ...item, product_name: `Product #${item.product_id}` })));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductNames();
  }, [sale.sale_items]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const printReceipt = () => {
    window.print();
  };

  const change = amountReceived ? amountReceived - sale.total_amount : 0;

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
        <div className="text-center">Loading receipt...</div>
      </div>
    );
  }

  return (
    <div className="receipt-container bg-white p-4 rounded-lg shadow-md max-w-md mx-auto" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
      {/* Business Header - Compact */}
      <div className="text-center mb-3">
        <h2 className="text-xl font-bold">{business?.name || 'Business Name'}</h2>
        {business?.address && <p className="text-xs">{business.address}</p>}
        {(business?.phone || business?.email) && (
          <p className="text-xs">
            {business.phone && `${business.phone} `}
            {business.email && `• ${business.email}`}
          </p>
        )}
        <div className="border-t border-gray-300 my-2"></div>
      </div>

      {/* Sale Information - Compact */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-semibold">Receipt #:</span>
          <span>{sale.id}</span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span className="font-semibold">Date:</span>
          <span>{formatDate(sale.created_at)}</span>
        </div>
        <div className="border-t border-gray-300 my-2"></div>
      </div>

      {/* Items - Compact */}
      <div className="mb-3">
        <h3 className="font-semibold text-sm mb-2">ITEMS:</h3>
        {itemsWithNames.map((item) => (
          <div key={item.id} className="flex justify-between text-sm mb-1">
            <div className="flex-1">
              <div className="font-medium">{item.product_name}</div>
              <div className="text-xs text-gray-600">{item.quantity} x ${item.unit_price.toFixed(2)}</div>
            </div>
            <span className="font-semibold">${(item.unit_price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t border-gray-300 my-2"></div>
      </div>

      {/* Totals - Compact */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span>Subtotal:</span>
          <span>${sale.total_amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span>Tax:</span>
          <span>${sale.tax_amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-sm mb-1">
          <span>TOTAL:</span>
          <span>${sale.total_amount.toFixed(2)}</span>
        </div>
        
        {amountReceived && (
          <>
            <div className="flex justify-between text-sm mb-1">
              <span>Received:</span>
              <span>${amountReceived.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm mb-1">
              <span>CHANGE:</span>
              <span>${change.toFixed(2)}</span>
            </div>
          </>
        )}
        <div className="border-t border-gray-300 my-2"></div>
      </div>

      {/* Payments - Compact */}
      <div className="mb-3">
        <h3 className="font-semibold text-sm mb-2">PAYMENT:</h3>
        {payments.map((payment) => (
          <div key={payment.id} className="flex justify-between text-sm mb-1">
            <span>{payment.payment_method.toUpperCase()}:</span>
            <span>${payment.amount.toFixed(2)}</span>
          </div>
        ))}
        <div className="border-t border-gray-300 my-2"></div>
      </div>

      {/* Footer - Compact */}
      <div className="text-center text-xs text-gray-600 mb-3">
        <p>Thank you for your business!</p>
        <p>{business?.name || 'Bizzy POS'}</p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-3 no-print">
  	<button
    	  onClick={printReceipt}
    	  className="bg-indigo-600 text-white px-4 py-1.5 text-sm rounded-md hover:bg-indigo-700"
  	>
    	  Print
  	</button>
  	<button
    	  onClick={onClose}
    	  className="bg-gray-600 text-white px-4 py-1.5 text-sm rounded-md hover:bg-gray-700"
  	>
    	  Close & Return to POS
  	</button>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body, html { background: white; height: auto; }
          .receipt-container { 
            box-shadow: none; 
            margin: 0; 
            padding: 0;
            max-height: none;
            overflow: visible;
          }
        }
      `}</style>
    </div>
  );
}
