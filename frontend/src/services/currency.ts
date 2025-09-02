import { api } from './api';
import { Currency, ExchangeRate } from '../types';

export const currencyService = {
  // Get all currencies
  getCurrencies: async (): Promise<Currency[]> => {
    const response = await api.get<Currency[]>('/api/currencies/');
    return response.data;
  },

  // Get exchange rate between two currencies
  getExchangeRate: async (fromCurrency: string, toCurrency: string): Promise<number> => {
    if (fromCurrency === toCurrency) return 1;

    try {
      // Use the convert endpoint instead
      const response = await api.get<any>(
        `/api/currencies/convert/1/${fromCurrency}/${toCurrency}`
      );

      return response.data.converted_amount;
    } catch (error) {
      console.error('Failed to get exchange rate:', error);
      throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
    }
  },

  // Convert amount between currencies
  convertAmount: async (amount: number, fromCurrency: string, toCurrency: string): Promise<number> => {
    if (fromCurrency === toCurrency) return amount;

    const rate = await currencyService.getExchangeRate(fromCurrency, toCurrency);
    return amount * rate;
  }
};
