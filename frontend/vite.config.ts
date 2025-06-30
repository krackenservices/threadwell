import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

const API_BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:8001'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths(), tailwindcss()],

  server: {
    proxy: {
      '/api': {
        target: API_BASE_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'), // optional, adjust if needed
      },
    },
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/vitest.config.js',
  },
})
