import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true
        }
      }
    },
    // Add this to define global constants
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:8000')
    }
  }
})
