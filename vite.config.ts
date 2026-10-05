import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string
}

// https://vite.dev/config/
export default defineConfig({
  // Relative base: works on GitHub Pages (/openwatch/) and at a domain root alike;
  // routing is hash-based so no server rewrites are needed.
  base: './',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    // three.js is lazy-loaded with the viewer and is legitimately large.
    chunkSizeWarningLimit: 1000,
  },
})
