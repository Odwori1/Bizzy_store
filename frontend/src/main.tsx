import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'
import { useAuthStore } from './hooks/useAuth'
import './styles/mobile.css' // Add mobile styles

const queryClient = new QueryClient()

// Initialize auth when app starts
useAuthStore.getState().initializeAuth()

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('SW registered: ', registration)
      },
      (registrationError) => {
        console.log('SW registration failed: ', registrationError)
      }
    )
  })
}
// Import Capacitor
import { Capacitor } from '@capacitor/core';

// Initialize mobile features
if (Capacitor.isNativePlatform()) {
  // Mobile-specific initialization
  console.log('Running on native platform:', Capacitor.getPlatform());
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
