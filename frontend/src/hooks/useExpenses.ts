import { useState, useEffect } from 'react';
import { Expense, ExpenseCategory, ExpenseCreate, ExpenseCategoryCreate } from '../types';
import { expenseService } from '../services/expense';

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load expenses
  const loadExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await expenseService.getExpenses();
      setExpenses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  // Load categories
  const loadCategories = async () => {
    try {
      const data = await expenseService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  // Create expense
  const createExpense = async (expenseData: ExpenseCreate): Promise<Expense> => {
    setLoading(true);
    setError(null);
    try {
      const newExpense = await expenseService.createExpense(expenseData);
      setExpenses(prev => [...prev, newExpense]);
      return newExpense;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create expense';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  // Delete expense
  const deleteExpense = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await expenseService.deleteExpense(id);
      setExpenses(prev => prev.filter(expense => expense.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete expense');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create category
  const createCategory = async (categoryData: ExpenseCategoryCreate): Promise<ExpenseCategory> => {
    try {
      const newCategory = await expenseService.createCategory(categoryData);
      setCategories(prev => [...prev, newCategory]);
      return newCategory;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create category';
      throw new Error(message);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadExpenses();
    loadCategories();
  }, []);

  return {
    expenses,
    categories,
    loading,
    error,
    createExpense,
    deleteExpense,
    createCategory,
    loadExpenses,
    loadCategories
  };
};
