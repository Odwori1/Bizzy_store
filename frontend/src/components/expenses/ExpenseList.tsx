import React from 'react';
import { Expense } from '../../types';
import { CurrencyDisplay } from '../CurrencyDisplay';

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: number) => void;
  loading?: boolean;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onDelete, loading = false }) => {
  if (loading) {
    return <div className="text-center py-8">Loading expenses...</div>;
  }

  if (expenses.length === 0) {
    return <div className="text-center py-8 text-gray-500">No expenses recorded yet.</div>;
  }

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Payment
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {expenses.map((expense) => (
            <tr key={expense.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {new Date(expense.date).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">{expense.description}</td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {expense.category?.name || 'Unknown'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                <CurrencyDisplay amount={expense.amount} currencyCode={expense.currency_code} />
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 capitalize">
                {expense.payment_method.replace('_', ' ')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => onDelete(expense.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
