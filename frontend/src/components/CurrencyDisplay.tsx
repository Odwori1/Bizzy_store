import React from 'react';
import { useCurrency } from '../hooks/useCurrency';

interface CurrencyDisplayProps {
  amount: number;
  currencyCode?: string;
  className?: string;
  compact?: boolean;
  showTooltip?: boolean;
  showCurrencyCode?: boolean;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  currencyCode,
  className = '',
  compact = false,
  showTooltip = true,
  showCurrencyCode = true
}) => {
  const { formatCurrency, getCurrencySymbol, isLoading, error } = useCurrency();

  // Get the formatted currency value for the tooltip
  const formattedValue = formatCurrency(amount, currencyCode);
  
  // Extract the display amount and currency symbol from the formatted value
  const displaySymbol = getCurrencySymbol(currencyCode);
  const isLongValue = amount >= 1000000; // 1 million+
  const isVeryLongValue = amount >= 10000000; // 10 million+

  // For the stacked display, we need to extract just the numeric part
  const extractAmountFromFormatted = (formatted: string, symbol: string): string => {
    // Remove the currency symbol and trim
    return formatted.replace(symbol, '').trim();
  };

  const displayAmount = extractAmountFromFormatted(formattedValue, displaySymbol);

  // Show a placeholder while the exchange rate is loading
  if (isLoading) {
    return (
      <span className={`currency-display currency-loading ${className}`}>
        {showCurrencyCode && <span className="currency-code">...</span>}
        <span className="currency-amount">...</span>
      </span>
    );
  }

  // Optional: Show an error indicator
  if (error) {
    console.error(error);
    return (
      <span 
        className={`currency-display currency-error ${className}`} 
        title={error}
        data-full-value={showTooltip ? formattedValue : undefined}
      >
        {showCurrencyCode && <span className="currency-code">{displaySymbol}</span>}
        <span className="currency-amount">Error</span>
      </span>
    );
  }

  const currencyClass = [
    'currency-display',
    compact && 'currency-compact',
    isLongValue && 'currency-long',
    isVeryLongValue && 'currency-very-long',
    className
  ].filter(Boolean).join(' ');

  return (
    <span
      className={currencyClass}
      data-full-value={showTooltip ? formattedValue : undefined}
      title={showTooltip ? formattedValue : undefined}
    >
      {showCurrencyCode && (
        <span className="currency-code">{displaySymbol}</span>
      )}
      <span className="currency-amount">
        {displayAmount}
      </span>
    </span>
  );
};
