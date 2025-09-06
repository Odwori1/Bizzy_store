import React from 'react';
import { Expense } from '../../types';
import { useBusinessStore } from '../../hooks/useBusiness';
import { useCurrency } from '../../hooks/useCurrency';

interface ExpenseAmountDisplayProps {
  expense: Expense;
}

export const ExpenseAmountDisplay: React.FC<ExpenseAmountDisplayProps> = ({ expense }) => {
  const { business } = useBusinessStore();
  const { convertAmount } = useCurrency();

  const businessCurrency = business?.currency_code || 'USD';

  // If the expense was originally in the same currency as business currency, show original amount
  if (expense.original_currency_code === businessCurrency) {
    return (
      <span>
        {new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: businessCurrency
        }).format(expense.original_amount)}
      </span>
    );
  }

  // If different currency, convert the USD amount to business currency using CURRENT rate
  const amountInBusinessCurrency = convertAmount(expense.amount);
  
  return (
    <span>
      {new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: businessCurrency
      }).format(amountInBusinessCurrency)}
      <span className="text-xs text-gray-500 ml-1">
        (was {expense.original_amount.toLocaleString()} {expense.original_currency_code})
      </span>
    </span>
  );
};
