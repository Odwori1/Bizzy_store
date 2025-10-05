import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { barcodeScannerService } from '../barcodeScannerService'
import { api } from '../api'
import { barcodeValidationService } from '../barcodeValidationService'

// Mock dependencies
vi.mock('../api')
vi.mock('../barcodeValidationService')

// Mock localStorage globally
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
})

const mockApi = api as any
const mockValidationService = barcodeValidationService as any

describe('BarcodeScannerService - Advanced Analytics Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    barcodeScannerService.clearCache()
    
    // Default validation mock
    mockValidationService.validateBarcode.mockReturnValue({
      isValid: true,
      normalizedBarcode: '5449000000996'
    })

    // Reset localStorage mocks
    localStorageMock.getItem.mockReset()
    localStorageMock.setItem.mockReset()
    localStorageMock.removeItem.mockReset()
    localStorageMock.clear.mockReset()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Server-Side Analytics Integration', () => {
    it('should call the new backend scanner endpoint for analytics tracking', async () => {
      const mockResponse = {
        data: {
          success: true,
          product: {
            id: '17',
            name: 'Coca Cola',
            price: 1.99,
            barcode: '5449000000996',
            stock_quantity: 18,
            source: 'local_database'
          }
        }
      }
      
      mockApi.post.mockResolvedValue(mockResponse)

      const result = await barcodeScannerService.lookupBarcode('5449000000996')

      expect(mockApi.post).toHaveBeenCalledWith('/api/scanner/scan', {
        barcode: '5449000000996'
      })
      expect(result.success).toBe(true)
      expect(result.product?.source).toBe('local_database')
    })

    it('should track failed lookups in analytics', async () => {
      const mockResponse = {
        data: {
          success: false,
          error: 'Product not found in local database or external APIs'
        }
      }
      
      mockApi.post.mockResolvedValue(mockResponse)

      const result = await barcodeScannerService.lookupBarcode('0000000000000')

      expect(mockApi.post).toHaveBeenCalled()
      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should include source information in successful responses', async () => {
      const externalApiResponse = {
        data: {
          success: true,
          product: {
            id: '123',
            name: 'New Product',
            price: 2.99,
            barcode: '1234567890123',
            stock_quantity: 0,
            source: 'external_api'
          }
        }
      }
      
      mockApi.post.mockResolvedValue(externalApiResponse)

      const result = await barcodeScannerService.lookupBarcode('1234567890123')

      expect(result.success).toBe(true)
      expect(result.product?.source).toBe('external_api')
    })
  })

  describe('Offline Cache Behavior with Analytics', () => {
    it('should cache successful responses from backend including source metadata', async () => {
      const mockResponse = {
        data: {
          success: true,
          product: {
            id: '17',
            name: 'Coca Cola',
            price: 1.99,
            barcode: '5449000000996',
            stock_quantity: 18,
            source: 'local_database'
          }
        }
      }
      
      mockApi.post.mockResolvedValue(mockResponse)

      // First call - goes to backend
      const result1 = await barcodeScannerService.lookupBarcode('5449000000996')
      
      // Second call - should use cache (mock localStorage to return cached data)
      const cachedData = {
        '5449000000996': {
          result: {
            success: true,
            product: {
              id: '17',
              name: 'Coca Cola',
              price: 1.99,
              barcode: '5449000000996',
              stock_quantity: 18,
              source: 'local_database'
            }
          },
          timestamp: Date.now() - 1000
        }
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedData))

      const result2 = await barcodeScannerService.lookupBarcode('5449000000996')

      expect(mockApi.post).toHaveBeenCalledTimes(1) // Only one backend call
      expect(result2.success).toBe(true)
      expect(result2.product?.source).toBe('local_database') // Metadata preserved
    })

    it('should not cache failed responses', async () => {
      const mockResponse = {
        data: {
          success: false,
          error: 'Product not found'
        }
      }
      
      mockApi.post.mockResolvedValue(mockResponse)

      await barcodeScannerService.lookupBarcode('0000000000000')
      await barcodeScannerService.lookupBarcode('0000000000000')

      expect(mockApi.post).toHaveBeenCalledTimes(2) // Both calls go to backend
    })
  })

  describe('Error Handling and Analytics', () => {
    it('should handle network errors and fall back to cache', async () => {
      // Mock cache with valid data
      const cachedData = {
        '5449000000996': {
          result: {
            success: true,
            product: {
              id: '17',
              name: 'Coca Cola',
              price: 1.99,
              barcode: '5449000000996',
              stock_quantity: 18,
              source: 'local_database'
            }
          },
          timestamp: Date.now() - 1000 // 1 second ago
        }
      }

      // Mock localStorage to return cached data
      localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedData))

      // Mock network failure
      mockApi.post.mockRejectedValue(new Error('Network error'))

      const result = await barcodeScannerService.lookupBarcode('5449000000996')

      expect(result.success).toBe(true)
      expect(result.product?.name).toBe('Coca Cola')
    })

    it('should return appropriate error messages for different failure types', async () => {
      // Test validation errors
      mockValidationService.validateBarcode.mockReturnValue({
        isValid: false,
        error: 'Invalid barcode format'
      })

      const result = await barcodeScannerService.lookupBarcode('invalid')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid barcode format')
    })
  })

  describe('Performance and Analytics Data Quality', () => {
    it('should normalize barcodes before sending to backend analytics', async () => {
      mockValidationService.validateBarcode.mockReturnValue({
        isValid: true,
        normalizedBarcode: '5449000000996'
      })

      await barcodeScannerService.lookupBarcode('5449-0000-00996')

      expect(mockApi.post).toHaveBeenCalledWith('/api/scanner/scan', {
        barcode: '5449000000996' // Normalized version
      })
    })

    it('should maintain consistent response format for analytics compatibility', async () => {
      const mockResponse = {
        data: {
          success: true,
          product: {
            id: '17',
            name: 'Coca Cola',
            price: 1.99,
            barcode: '5449000000996',
            stock_quantity: 18,
            source: 'local_database',
            description: 'Soft drink',
            min_stock_level: 5
          }
        }
      }
      
      mockApi.post.mockResolvedValue(mockResponse)

      const result = await barcodeScannerService.lookupBarcode('5449000000996')

      // Verify all expected fields are present for analytics
      expect(result).toMatchObject({
        success: expect.any(Boolean),
        product: expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          price: expect.any(Number),
          barcode: expect.any(String),
          stock_quantity: expect.any(Number),
          source: expect.any(String)
        })
      })
    })
  })
})
