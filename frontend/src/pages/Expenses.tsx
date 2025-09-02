import React, { useState } from 'react';
import { ExpenseCreate, ExpenseCategoryCreate } from '../types';
import { useExpenses } from '../hooks/useExpenses';
import { ExpenseForm } from '../components/expenses/ExpenseForm';
import { ExpenseList } from '../components/expenses/ExpenseList';
import { CurrencyDisplay } from '../components/CurrencyDisplay';

const Expenses: React.FC = () => {
  const { expenses, categories, loading, error, createExpense, deleteExpense, createCategory } = useExpenses();
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleCreateExpense = async (expenseData: ExpenseCreate) => {
    try {
      await createExpense(expenseData);
      setShowForm(false);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(id);
      } catch (err) {
        // Error is handled by the hook
      }
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      await createCategory({ name: newCategoryName.trim() });
      setNewCategoryName('');
      setShowCategoryForm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create category');
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Expense Tracker</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Expense
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Summary Card */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Expenses</p>
            <p className="text-2xl font-bold text-gray-900">
              <CurrencyDisplay amount={totalExpenses} />
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Number of Expenses</p>
            <p className="text-2xl font-bold text-gray-900">{expenses.length}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Average per Expense</p>
            <p className="text-2xl font-bold text-gray-900">
              <CurrencyDisplay amount={expenses.length ? totalExpenses / expenses.length : 0} />
            </p>
          </div>
        </div>
      </div>

      {/* Category Management */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
          <button
            onClick={() => setShowCategoryForm(true)}
            className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
          >
            Add Category
          </button>
        </div>

        {showCategoryForm && (
          <form onSubmit={handleCreateCategory} className="mb-4 flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="New category name"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowCategoryForm(false)}
              className="px-3 py-2 bg-gray-500 text-white rounded-md text-sm"
            >
              Cancel
            </button>
          </form>
        )}

        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <span
              key={category.id}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {category.name}
            </span>
          ))}
        </div>
      </div>

      {/* Expense Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Expense</h2>
            <ExpenseForm
              categories={categories}
              onSubmit={handleCreateExpense}
              onCancel={() => setShowForm(false)}
              loading={loading}
            />
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Expenses</h2>
        <ExpenseList expenses={expenses} onDelete={handleDeleteExpense} loading={loading} />
      </div>
    </div>
  );
};

export default Expenses; // Change to default export
