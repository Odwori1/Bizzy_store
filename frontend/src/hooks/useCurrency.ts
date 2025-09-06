import { useState, useEffect, useCallback } from 'react';
import { useBusinessStore } from './useBusiness';
import { currencyService } from '../services/currency';

// Base currency for the application. All product prices are stored in this.
const BASE_CURRENCY = 'USD';

export const useCurrency = () => {
  const { business } = useBusinessStore();
  const businessCurrency = business?.currency_code || BASE_CURRENCY;

  // State to cache the exchange rate to avoid calling the API for every render
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Effect to fetch the exchange rate when the business currency changes
  useEffect(() => {
    // If business currency is the same as base, no conversion needed.
    if (businessCurrency === BASE_CURRENCY) {
      setExchangeRate(1);
      setIsLoading(false);
      return;
    }

    const fetchExchangeRate = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log(`Fetching rate for ${BASE_CURRENCY} to ${businessCurrency}`);
        const rate = await currencyService.getExchangeRate(BASE_CURRENCY, businessCurrency);
        console.log(`Fetched exchange rate: ${rate}`);
        setExchangeRate(rate);
      } catch (err) {
        console.error('Failed to fetch exchange rate:', err);
        setError('Failed to load exchange rates. Displaying base currency.');
        // Set rate to 1 as a fallback to show un-converted amounts
        setExchangeRate(1);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExchangeRate();
  }, [businessCurrency]); // Re-run this effect if the business currency changes

  // Function to convert an amount from BASE_CURRENCY to the business currency
  const convertToLocal = useCallback((amount: number): number => {
    if (exchangeRate === null) return amount; // Wait for rate to load
    return amount * exchangeRate;
  }, [exchangeRate]);

  // Function to convert an amount from the business currency BACK to BASE_CURRENCY (USD)
  const convertToUSD = useCallback((amount: number): number => {
    if (exchangeRate === null) return amount; // Wait for rate to load
    // To get USD, we divide the local amount by the exchange rate
    return amount / exchangeRate;
  }, [exchangeRate]);

  // Main function: Convert AND format an amount
  const formatCurrency = (amount: number, currencyCode?: string): string => {
    const targetCurrencyCode = currencyCode || businessCurrency;
    let finalAmount = amount;
    let finalCurrencyCode = targetCurrencyCode;

    // Only convert if the target currency is different from base AND we have a rate
    if (targetCurrencyCode !== BASE_CURRENCY && exchangeRate !== null) {
      finalAmount = convertToLocal(amount);
      finalCurrencyCode = targetCurrencyCode;
    } else {
      // If target is USD or rate isn't loaded, show USD amount
      finalCurrencyCode = BASE_CURRENCY;
    }

    // Format the final amount
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: finalCurrencyCode
      }).format(finalAmount);
    } catch (formatError) {
      console.error('Error formatting currency:', formatError);
      // Fallback to simple formatting
      return `${finalCurrencyCode} ${finalAmount.toFixed(2)}`;
    }
  };

  const getCurrencySymbol = (currencyCode?: string): string => {
    const code = currencyCode || businessCurrency;
    try {
      const formatter = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: code
      });
      const parts = formatter.formatToParts(1);
      const currencyPart = parts.find(part => part.type === 'currency');
      return currencyPart?.value || code;
    } catch (error) {
      return code;
    }
  };

  // Return all necessary values and state
  return {
    formatCurrency,
    getCurrencySymbol,
    convertToLocal,
    convertToUSD,
    exchangeRate, // Added for debugging
    currencyCode: businessCurrency,
    baseCurrency: BASE_CURRENCY,
    isLoading,
    error
  };
};
