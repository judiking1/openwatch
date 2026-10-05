import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // three.js is lazy-loaded with the viewer and is legitimately large.
    chunkSizeWarningLimit: 1000,
  },
})
