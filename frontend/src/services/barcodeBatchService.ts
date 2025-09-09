import { barcodeScannerService } from './barcodeScannerService';
import { barcodeValidationService } from './barcodeValidationService';

export interface BatchProcessResult {
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    barcode: string;
    success: boolean;
    productName?: string;
    error?: string;
  }>;
}

export interface CSVImportRow {
  barcode: string;
  name?: string;
  price?: number;
  quantity?: number;
}

export const barcodeBatchService = {

  // Process multiple barcodes in batch
  async processBarcodes(barcodes: string[]): Promise<BatchProcessResult> {
    const results: BatchProcessResult['results'] = [];
    let successful = 0;
    let failed = 0;

    console.log(`🔄 Processing ${barcodes.length} barcodes in batch`);

    for (const barcode of barcodes) {
      try {
        // Validate barcode first
        const validation = barcodeValidationService.validateBarcode(barcode);
        if (!validation.isValid) {
          results.push({
            barcode,
            success: false,
            error: validation.error
          });
          failed++;
          continue;
        }

        // Lookup barcode
        const lookupResult = await barcodeScannerService.lookupBarcode(
          validation.normalizedBarcode || barcode
        );

        if (lookupResult.success) {
          results.push({
            barcode,
            success: true,
            productName: lookupResult.product?.name
          });
          successful++;
        } else {
          results.push({
            barcode,
            success: false,
            error: lookupResult.error
          });
          failed++;
        }
      } catch (error: any) {
        results.push({
          barcode,
          success: false,
          error: error.message || 'Unexpected error'
        });
        failed++;
      }
    }

    return {
      total: barcodes.length,
      successful,
      failed,
      results
    };
  },

  // Process CSV data for bulk import
  async processCSVData(csvRows: CSVImportRow[]): Promise<BatchProcessResult> {
    const barcodes = csvRows.map(row => row.barcode);
    return this.processBarcodes(barcodes);
  },

  // Generate CSV template for bulk import
  generateCSVTemplate(): string {
    return 'barcode,name,price,quantity\nExample: 5901234123457,Product Name,10.99,100';
  },

  // Parse CSV string into rows
  parseCSV(csvData: string): CSVImportRow[] {
    const rows: CSVImportRow[] = [];
    const lines = csvData.trim().split('\n');
    
    // Skip header row if exists
    const startIndex = lines[0].toLowerCase().includes('barcode') ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const columns = line.split(',').map(col => col.trim());
      if (columns.length >= 1) {
        rows.push({
          barcode: columns[0],
          name: columns[1],
          price: columns[2] ? parseFloat(columns[2]) : undefined,
          quantity: columns[3] ? parseInt(columns[3]) : undefined
        });
      }
    }
    
    return rows;
  },

  // Export results to CSV
  exportResultsToCSV(results: BatchProcessResult): string {
    let csv = 'Barcode,Status,Product Name,Error\n';
    
    for (const result of results.results) {
      const status = result.success ? 'SUCCESS' : 'FAILED';
      const productName = result.productName || '';
      const error = result.error || '';
      
      // Escape CSV special characters
      const escapeCSV = (value: string) => `"${value.replace(/"/g, '""')}"`;
      
      csv += `${result.barcode},${status},${escapeCSV(productName)},${escapeCSV(error)}\n`;
    }
    
    return csv;
  }

};
