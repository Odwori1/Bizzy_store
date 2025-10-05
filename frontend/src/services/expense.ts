import { api } from './api';
import { Expense, ExpenseCategory, ExpenseCreate, ExpenseCategoryCreate } from '../types';

export const expenseService = {
  // Get all expenses for a specific business
  getExpenses: async (business_id: number): Promise<Expense[]> => {
    const response = await api.get<Expense[]>('/api/expenses/', {
      params: { business_id }  // Add the required business_id parameter
    });
    return response.data;
  },

  // Get expense by ID
  getExpense: async (id: number): Promise<Expense> => {
    const response = await api.get<Expense>(`/api/expenses/${id}`);
    return response.data;
  },

  // Create new expense
  createExpense: async (expense: ExpenseCreate): Promise<Expense> => {
    const response = await api.post<Expense>('/api/expenses/', expense);
    return response.data;
  },

  // Delete expense
  deleteExpense: async (id: number): Promise<void> => {
    await api.delete(`/api/expenses/${id}`);
  },

  // Get all expense categories
  getCategories: async (): Promise<ExpenseCategory[]> => {
    const response = await api.get<ExpenseCategory[]>('/api/expenses/categories');
    return response.data;
  },

  // Create new category
  createCategory: async (category: ExpenseCategoryCreate): Promise<ExpenseCategory> => {
    const response = await api.post<ExpenseCategory>('/api/expenses/categories', category);
    return response.data;
  },

  // Get expense summary by category
  getExpenseSummary: async (business_id: number): Promise<{ category: string; total_amount: number }[]> => {
    // This would call a backend endpoint for summary data
    // For now, we'll calculate it from the expenses list
    const expenses = await expenseService.getExpenses(business_id);
    const summary = expenses.reduce((acc, expense) => {
      const categoryName = expense.category?.name || 'Unknown';
      acc[categoryName] = (acc[categoryName] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(summary).map(([category, total_amount]) => ({
      category,
      total_amount
    }));
  }
};
