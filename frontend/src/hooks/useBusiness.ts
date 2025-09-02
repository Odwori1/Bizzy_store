import { create } from 'zustand'
import { Business } from '../types'
import { businessService } from '../services/business' // ADD THIS

interface BusinessState {
  business: Business | null
  isLoading: boolean
  error: string | null
  loadBusiness: () => Promise<void>
  updateBusiness: (data: Partial<Business>) => Promise<void>
  clearError: () => void
}

export const useBusinessStore = create<BusinessState>((set) => ({
  business: null,
  isLoading: false,
  error: null,

  loadBusiness: async () => {
    set({ isLoading: true, error: null })
    try {
      const businessData = await businessService.getBusiness()
      set({ business: businessData })
    } catch (error: any) {
      if (error.response?.status === 404) {
        set({ business: null })
      } else {
        console.error('Failed to load business data:', error)
        set({ error: error.response?.data?.detail || 'Failed to load business data' })
      }
    } finally {
      set({ isLoading: false })
    }
  },

  updateBusiness: async (data: Partial<Business>) => {
    set({ isLoading: true, error: null })
    try {
      const updatedBusiness = await businessService.updateBusiness(data)
      set({ business: updatedBusiness })
    } catch (error: any) {
      console.error('Failed to update business:', error)
      const errorMessage = error.response?.data?.detail || 'Failed to update business'
      set({ error: errorMessage })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  clearError: () => set({ error: null })
}))
