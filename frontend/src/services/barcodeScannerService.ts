import { api } from './api';
import { barcodeValidationService } from './barcodeValidationService';

export interface BarcodeLookupResult {
  success: boolean;
  product?: {
    id: string;
    name: string;
    price: number;
    barcode: string;
    stock_quantity: number;
    description?: string;
    min_stock_level?: number;
    source?: 'local_database' | 'external_api';
  };
  error?: string;
}

// OFFLINE CACHE SETTINGS
const OFFLINE_CACHE_KEY = 'barcode_offline_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const getOfflineCache = (): Record<string, { result: BarcodeLookupResult; timestamp: number }> => {
  try {
    const cache = localStorage.getItem(OFFLINE_CACHE_KEY);
    return cache ? JSON.parse(cache) : {};
  } catch {
    return {};
  }
};

const saveToOfflineCache = (barcode: string, result: BarcodeLookupResult) => {
  try {
    const cache = getOfflineCache();
    const now = Date.now();

    // Clean old entries
    Object.keys(cache).forEach(key => {
      if (now - cache[key].timestamp > CACHE_DURATION) {
        delete cache[key];
      }
    });

    // Add new entry
    cache[barcode] = { result, timestamp: now };
    localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to save to offline cache:', error);
  }
};

export const barcodeScannerService = {
  async lookupBarcode(barcode: string): Promise<BarcodeLookupResult> {
    try {
      console.log('🔍 Looking up barcode:', barcode);

      // 1. Validate barcode
      const validation = barcodeValidationService.validateBarcode(barcode);
      if (!validation.isValid) {
        console.warn('❌ Invalid barcode format:', validation.error);
        return {
          success: false,
          error: validation.error || 'Invalid barcode format',
        };
      }

      const normalizedBarcode = validation.normalizedBarcode || barcode;
      console.log('📋 Normalized barcode:', normalizedBarcode);

      // 2. Check offline cache
      const cachedResult = this._checkOfflineCache(normalizedBarcode);
      if (cachedResult) {
        console.log('📦 Using cached result');
        return cachedResult;
      }

      // 3. Call backend scanner API
      console.log('🔄 Calling backend scanner API...');
      const response = await api.post('/api/scanner/scan', {
        barcode: normalizedBarcode,
      });

      const data = response.data;

      if (data.success && data.product) {
        // Map to structured product object
        const product = {
          id: data.product.id,
          name: data.product.name,
          price: data.product.price,
          barcode: data.product.barcode,
          stock_quantity: data.product.stock_quantity,
          description: data.product.description,
          min_stock_level: data.product.min_stock_level,
          source: data.product.source,
        };

        const result: BarcodeLookupResult = { success: true, product };
        saveToOfflineCache(normalizedBarcode, result);
        return result;
      }

      return { success: false, error: data.error || 'Product not found' };
    } catch (error: any) {
      console.error('❌ Barcode lookup error:', error);

      // Fallback to cache if network fails
      const cachedResult = this._checkOfflineCache(barcode);
      if (cachedResult) {
        console.log('📦 Using cached result (network fallback)');
        return cachedResult;
      }

      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Network error: Failed to lookup barcode',
      };
    }
  },

  // Check offline cache
  _checkOfflineCache(barcode: string): BarcodeLookupResult | null {
    try {
      const cache = getOfflineCache();
      const cached = cache[barcode];
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.result;
      }
    } catch (error) {
      console.warn('Failed to read from offline cache:', error);
    }
    return null;
  },

  // Clear cache (useful for testing/debugging)
  clearCache(): void {
    try {
      localStorage.removeItem(OFFLINE_CACHE_KEY);
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  },
};

