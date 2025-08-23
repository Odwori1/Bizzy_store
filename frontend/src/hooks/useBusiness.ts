import { create } from 'zustand'

interface Business {
  id: number
  user_id: number
  name: string
  address?: string
  phone?: string
  email?: string
  logo_url?: string
  tax_id?: string
}

interface BusinessState {
  business: Business | null
  isLoading: boolean
  loadBusiness: () => Promise<void>
}

export const useBusinessStore = create<BusinessState>((set) => ({
  business: null,
  isLoading: false,

  loadBusiness: async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) return

    set({ isLoading: true })
    try {
      const response = await fetch('/api/business/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const businessData = await response.json()
        set({ business: businessData })
      } else if (response.status === 404) {
        // Business not set up yet, this is normal
        set({ business: null })
      }
    } catch (error) {
      console.error('Failed to load business data:', error)
    } finally {
      set({ isLoading: false })
    }
  }
}))
