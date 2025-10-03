import React, { useState, useEffect } from 'react';
import { Sale, Payment, Business, Product } from '../../types';
import { productService } from '../../services/products';
import { CurrencyDisplay } from '../CurrencyDisplay';

interface ReceiptProps {
  sale: Sale;
  business: Business | null;
  payments: Payment[];
  amountReceived: number;
  onClose: () => void;
}

const Receipt: React.FC<ReceiptProps> = ({ sale, business, payments, amountReceived, onClose }) => {
  // Use sale.original_amount if available, otherwise fallback to total_amount
  const originalTotal = sale.original_amount || sale.total_amount;
  const change = amountReceived - originalTotal;
  const receiptDate = new Date(sale.created_at).toLocaleString();

  // State to hold product names
  const [productNames, setProductNames] = useState<{ [key: number]: string }>({});

  // Fetch product names if product_name is missing
  useEffect(() => {
    const fetchProductNames = async () => {
      const names: { [key: number]: string } = {};
      for (const item of sale.sale_items) {
        if (!item.product_name) {
          try {
            const product: Product = await productService.getProduct(item.product_id);
            names[item.product_id] = product.name;
          } catch (error) {
            // Fallback if fetch fails
            names[item.product_id] = `Product #${item.product_id}`;
          }
        } else {
          // If product_name exists, just use it
          names[item.product_id] = item.product_name;
        }
      }
      setProductNames(names);
    };

    fetchProductNames();
  }, [sale.sale_items]);

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    const currencyCode = sale.original_currency || business?.currency_code || 'USD';

    const receiptContent = `
      ${business?.name || 'Business Name'}
      ${business?.address || 'Business Address'}
      ${business?.phone || 'Phone: N/A'}

      Receipt #: ${sale.id}
      Date: ${receiptDate}
      Cashier: ${sale.user_name || 'System'}

      Items:
      ${sale.sale_items
        .map(
          (item) => `
        ${(productNames[item.product_id]) || `Product #${item.product_id}`} x${item.quantity}
        ${item.unit_price} ${currencyCode} each
        ${item.subtotal} ${currencyCode}
      `
        )
        .join('')}

      Subtotal: ${sale.original_amount - (sale.tax_amount / sale.exchange_rate_at_sale)} ${currencyCode}
      Tax: ${sale.tax_amount / sale.exchange_rate_at_sale} ${currencyCode}
      Total: ${sale.original_amount} ${currencyCode}

      Payment: ${amountReceived} ${currencyCode}
      Change: ${change} ${currencyCode}

      Thank you for your business!
      Powered by Bizzy POS
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${sale.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-11/12 md:w-3/4 lg:w-1/2 xl:w-1/3 max-h-[90vh] overflow-y-auto">
        {/* Receipt Header */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold">{business?.name || 'Bizzy POS'}</h2>
          {business?.address && <p className="text-sm">{business.address}</p>}
          {business?.phone && <p className="text-sm">Phone: {business.phone}</p>}
          {business?.tax_id && <p className="text-sm">Tax ID: {business.tax_id}</p>}
          <div className="border-t border-dashed border-gray-300 my-3"></div>
        </div>

        {/* Receipt Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Receipt #:</span>
            <span className="font-semibold">{sale.id}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{receiptDate}</span>
          </div>
          <div className="flex justify-between">
            <span>Cashier:</span>
            <span>{sale.user_name || 'System'}</span>
          </div>
        </div>

        {/* Items List */}
        <div className="my-4">
          <h3 className="font-semibold border-b border-gray-300 pb-1">Items</h3>
          <div className="max-h-48 overflow-y-auto">
            {sale.sale_items.map((item) => (
              <div key={item.id} className="py-2 border-b border-gray-100">
                <div className="flex justify-between">
                  <span className="font-medium">
                    {(productNames[item.product_id]) || `Product #${item.product_id}`}
                  </span>
                  <span>
                    <CurrencyDisplay
                      amount={item.subtotal}
                      originalAmount={item.original_subtotal || item.subtotal}
                      originalCurrencyCode={sale.original_currency || business?.currency_code}
                      exchangeRateAtCreation={item.exchange_rate_at_creation || sale.exchange_rate_at_sale}
                    />
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>
                    {item.quantity} x{' '}
                    <CurrencyDisplay
                      amount={item.unit_price}
                      originalAmount={item.original_unit_price || item.unit_price}
                      originalCurrencyCode={sale.original_currency || business?.currency_code}
                      exchangeRateAtCreation={item.exchange_rate_at_creation || sale.exchange_rate_at_sale}
                    />
                  </span>
                  <span>
                    Subtotal:{' '}
                    <CurrencyDisplay
                      amount={item.subtotal}
                      originalAmount={item.original_subtotal || item.subtotal}
                      originalCurrencyCode={sale.original_currency || business?.currency_code}
                      exchangeRateAtCreation={item.exchange_rate_at_creation || sale.exchange_rate_at_sale}
                    />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="space-y-1 text-sm border-t border-gray-300 pt-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>
              <CurrencyDisplay
                amount={sale.total_amount - sale.tax_amount}
                originalAmount={originalTotal - (sale.tax_amount / sale.exchange_rate_at_sale)}
                originalCurrencyCode={sale.original_currency || business?.currency_code}
                exchangeRateAtCreation={sale.exchange_rate_at_sale}
              />
            </span>
          </div>
          <div className="flex justify-between">
            <span>Tax:</span>
            <span>
              <CurrencyDisplay
                amount={sale.tax_amount}
                originalAmount={sale.tax_amount / sale.exchange_rate_at_sale}
                originalCurrencyCode={sale.original_currency || business?.currency_code}
                exchangeRateAtCreation={sale.exchange_rate_at_sale}
              />
            </span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-2">
            <span>Total:</span>
            <span>
              <CurrencyDisplay
                amount={sale.total_amount}
                originalAmount={originalTotal}
                originalCurrencyCode={sale.original_currency || business?.currency_code}
                exchangeRateAtCreation={sale.exchange_rate_at_sale}
              />
            </span>
          </div>
          <div className="flex justify-between">
            <span>Amount Received:</span>
            <span>
              <CurrencyDisplay
                amount={amountReceived * sale.exchange_rate_at_sale}
                originalAmount={amountReceived}
                originalCurrencyCode={sale.original_currency || business?.currency_code}
                exchangeRateAtCreation={sale.exchange_rate_at_sale}
              />
            </span>
          </div>
          <div className="flex justify-between font-semibold border-t border-gray-300 pt-2">
            <span>Change:</span>
            <span>
              <CurrencyDisplay
                amount={change * sale.exchange_rate_at_sale}
                originalAmount={change}
                originalCurrencyCode={sale.original_currency || business?.currency_code}
                exchangeRateAtCreation={sale.exchange_rate_at_sale}
              />
            </span>
          </div>
        </div>

        {/* Payment Method */}
        {payments.length > 0 && (
          <div className="mt-4 text-sm">
            <div className="flex justify-between">
              <span>Payment Method:</span>
              <span className="capitalize">{payments[0].payment_method}</span>
            </div>
            {payments[0].transaction_id && (
              <div className="flex justify-between">
                <span>Transaction ID:</span>
                <span className="text-xs">{payments[0].transaction_id}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6 pt-4 border-t border-dashed border-gray-300">
          <p className="text-sm text-gray-600">Thank you for your business!</p>
          <p className="text-xs text-gray-400 mt-2">Powered by Bizzy POS</p>
          <p className="text-xs text-gray-500 mt-1">Please come again</p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-6">
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
          >
            Print Receipt
          </button>
          <button
            onClick={handleSave}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
          >
            Save Receipt
          </button>
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
