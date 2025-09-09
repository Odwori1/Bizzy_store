export interface BarcodeValidationResult {
  isValid: boolean;
  format?: 'EAN-13' | 'UPC-A' | 'EAN-8' | 'UPC-E' | 'UNKNOWN';
  normalizedBarcode?: string;
  error?: string;
}

export const barcodeValidationService = {

  // Main validation function
  validateBarcode(barcode: string): BarcodeValidationResult {
    // Remove any non-digit characters
    const cleanBarcode = barcode.replace(/\D/g, '');
    
    if (cleanBarcode.length === 0) {
      return { isValid: false, error: 'Barcode must contain numbers' };
    }

    // Validate based on length and format
    switch (cleanBarcode.length) {
      case 13:
        return this._validateEAN13(cleanBarcode);
      case 12:
        return this._validateUPCA(cleanBarcode);
      case 8:
        return this._validateEAN8(cleanBarcode);
      case 6:
      case 7:
        return this._validateUPCE(cleanBarcode);
      default:
        return {
          isValid: false,
          format: 'UNKNOWN',
          error: `Invalid barcode length: ${cleanBarcode.length} digits. Expected 8, 12, or 13 digits.`
        };
    }
  },

  // EAN-13 validation (13 digits)
  _validateEAN13(barcode: string): BarcodeValidationResult {
    if (!/^\d{13}$/.test(barcode)) {
      return { isValid: false, error: 'EAN-13 must be exactly 13 digits' };
    }

    if (this._verifyChecksum(barcode)) {
      return {
        isValid: true,
        format: 'EAN-13',
        normalizedBarcode: barcode
      };
    } else {
      return {
        isValid: false,
        format: 'EAN-13',
        error: 'Invalid EAN-13 checksum'
      };
    }
  },

  // UPC-A validation (12 digits)
  _validateUPCA(barcode: string): BarcodeValidationResult {
    if (!/^\d{12}$/.test(barcode)) {
      return { isValid: false, error: 'UPC-A must be exactly 12 digits' };
    }

    if (this._verifyChecksum(barcode)) {
      return {
        isValid: true,
        format: 'UPC-A',
        normalizedBarcode: barcode
      };
    } else {
      return {
        isValid: false,
        format: 'UPC-A',
        error: 'Invalid UPC-A checksum'
      };
    }
  },

  // EAN-8 validation (8 digits)
  _validateEAN8(barcode: string): BarcodeValidationResult {
    if (!/^\d{8}$/.test(barcode)) {
      return { isValid: false, error: 'EAN-8 must be exactly 8 digits' };
    }

    if (this._verifyChecksum(barcode)) {
      return {
        isValid: true,
        format: 'EAN-8',
        normalizedBarcode: barcode
      };
    } else {
      return {
        isValid: false,
        format: 'EAN-8',
        error: 'Invalid EAN-8 checksum'
      };
    }
  },

  // UPC-E validation (6, 7, or 8 digits)
  _validateUPCE(barcode: string): BarcodeValidationResult {
    if (!/^\d{6,8}$/.test(barcode)) {
      return { isValid: false, error: 'UPC-E must be 6-8 digits' };
    }

    // For simplicity, validate the format pattern
    const isValidPattern = /^[0-1]\d{5,7}$/.test(barcode);
    
    if (isValidPattern) {
      return {
        isValid: true,
        format: 'UPC-E',
        normalizedBarcode: barcode.padStart(8, '0')
      };
    } else {
      return {
        isValid: false,
        format: 'UPC-E',
        error: 'Invalid UPC-E format'
      };
    }
  },

  // Generic checksum verification (for EAN/UPC formats)
  _verifyChecksum(barcode: string): boolean {
    const digits = barcode.split('').map(Number);
    const checkDigit = digits.pop()!;
    
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      sum += digits[i] * (i % 2 === 0 ? 3 : 1);
    }
    
    const calculatedCheckDigit = (10 - (sum % 10)) % 10;
    return calculatedCheckDigit === checkDigit;
  },

  // Detect barcode format without validation
  detectFormat(barcode: string): string {
    const cleanBarcode = barcode.replace(/\D/g, '');
    
    switch (cleanBarcode.length) {
      case 13: return 'EAN-13';
      case 12: return 'UPC-A';
      case 8: return 'EAN-8';
      case 6:
      case 7: return 'UPC-E';
      default: return 'UNKNOWN';
    }
  },

  // Normalize barcode (remove non-digits, pad if necessary)
  normalizeBarcode(barcode: string): string {
    const cleanBarcode = barcode.replace(/\D/g, '');
    const format = this.detectFormat(cleanBarcode);
    
    switch (format) {
      case 'EAN-13':
        return cleanBarcode.padStart(13, '0');
      case 'UPC-A':
        return cleanBarcode.padStart(12, '0');
      case 'EAN-8':
        return cleanBarcode.padStart(8, '0');
      case 'UPC-E':
        return cleanBarcode.padStart(8, '0');
      default:
        return cleanBarcode;
    }
  }

};
