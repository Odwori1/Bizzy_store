import { api } from './api';

export interface BarcodeLookupResult {
  success: boolean;
  product?: {
    id: string;
    name: string;
    price: number;
    barcode: string;
    stock_quantity: number;
  };
  error?: string;
}

export const barcodeScannerService = {
  // Look up a product by barcode in our database
  async lookupBarcode(barcode: string): Promise<BarcodeLookupResult> {
    try {
      console.log('🔍 Looking up barcode in database:', barcode);
      
      // First, try to find product in our database
      const response = await api.get(`/api/products?barcode=${encodeURIComponent(barcode)}`);
      
      if (response.data && response.data.length > 0) {
        const product = response.data[0];
        console.log('✅ Product found in database:', product.name);
        return {
          success: true,
          product: {
            id: product.id,
            name: product.name,
            price: product.price,
            barcode: product.barcode,
            stock_quantity: product.stock_quantity
          }
        };
      }
      
      console.log('ℹ️ Product not found in database');
      return {
        success: false,
        error: 'Product not found in database'
      };
      
    } catch (error: any) {
      console.error('❌ Barcode lookup error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to lookup barcode'
      };
    }
  },

  // You can add external API integrations here later
  // For example: Open Food Facts, Barcode Database API, etc.
};
