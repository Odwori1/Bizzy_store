import React, { useState } from 'react';
import { ExpenseCreate, ExpenseCategory } from '../../types';
import { useBusinessStore } from '../../hooks/useBusiness';
import { CurrencyDisplay } from '../CurrencyDisplay';

interface ExpenseFormProps {
  categories: ExpenseCategory[];
  onSubmit: (expense: ExpenseCreate) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  categories,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const { business } = useBusinessStore();
  const [formData, setFormData] = useState<Omit<ExpenseCreate, 'business_id'>>({
    amount: 0,
    currency_code: business?.currency_code || 'USD',
    description: '',
    category_id: categories[0]?.id || 0,
    payment_method: 'cash',
    is_recurring: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    await onSubmit({
      ...formData,
      business_id: business.id
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Amount</label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
            <CurrencyDisplay amount={formData.amount} currencyCode={formData.currency_code} showCurrencyCode={true} />
          </span>
          <input
            type="number"
            step="0.01"
            required
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            placeholder="0.00"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <input
          type="text"
          required
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="What was this expense for?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Category</label>
        <select
          required
          value={formData.category_id}
          onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) })}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Payment Method</label>
        <select
          value={formData.payment_method}
          onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="cash">Cash</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="mobile_money">Mobile Money</option>
          <option value="credit_card">Credit Card</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_recurring"
          checked={formData.is_recurring}
          onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="is_recurring" className="ml-2 block text-sm text-gray-900">
          This is a recurring expense
        </label>
      </div>

      <div className="flex space-x-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Expense'}
        </button>
      </div>
    </form>
  );
};
