import React from 'react';
import { useCurrency } from '../hooks/useCurrency';
import { useBusinessStore } from '../hooks/useBusiness';

interface CurrencyDisplayProps {
  amount: number; // USD amount (internal storage)
  currencyCode?: string;
  className?: string;
  showTooltip?: boolean;
  originalAmount?: number; // Original local currency amount (PRESERVED)
  originalCurrencyCode?: string; // Original currency code at transaction time
  exchangeRateAtCreation?: number; // Historical rate (original → USD)
  preserveOriginal?: boolean; // Whether to preserve historical value
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  currencyCode,
  className = '',
  showTooltip = true,
  originalAmount,
  originalCurrencyCode,
  exchangeRateAtCreation,
  preserveOriginal = true
}) => {
  const { business } = useBusinessStore();
  const businessCurrency = business?.currency_code || 'USD';

  const { formatCurrency, isLoading, convertHistoricalAmount } = useCurrency();

  if (isLoading) {
    return <span className={`${className} text-gray-400`}>Loading...</span>;
  }

  // Determine if we should use historical context
  const useHistorical = preserveOriginal &&
                      originalAmount !== undefined &&
                      originalCurrencyCode &&
                      exchangeRateAtCreation !== undefined;

  // CRITICAL FIX: SMART HISTORICAL CONTEXT HANDLING
  // If we are using historical context AND the target currency is the SAME as the original currency,
  // we should JUST show the original amount without any conversion to prevent inflation
  const isSameCurrency = businessCurrency === originalCurrencyCode;

  let displayAmount: number;
  let targetCurrency: string = currencyCode || businessCurrency;
  let isAmountInUSD = false;

  if (useHistorical) {
    if (isSameCurrency) {
      // SAME CURRENCY: Show original amount directly (NO CONVERSION NEEDED)
      // This prevents the inflation bug when original and display currencies are the same
      displayAmount = originalAmount;
      targetCurrency = originalCurrencyCode;
      isAmountInUSD = false;
    } else {
      // DIFFERENT CURRENCIES: Use proper historical conversion
      // Example: Original was UGX, but business currency is USD → convert properly
      const result = convertHistoricalAmount(
        originalAmount,
        originalCurrencyCode,
        exchangeRateAtCreation,
        targetCurrency
      );
      displayAmount = result.amount;
      targetCurrency = result.currency;
      isAmountInUSD = (targetCurrency === 'USD');
    }
  } else {
    // Fallback: use normal conversion (for amounts without historical context)
    displayAmount = amount;
    isAmountInUSD = true; // Original amount prop is always in USD
  }

  const formattedValue = formatCurrency(displayAmount, targetCurrency, isAmountInUSD);

  return (
    <span className={`currency-display ${className}`} title={showTooltip ? formattedValue : undefined}>
      {formattedValue}
    </span>
  );
};
