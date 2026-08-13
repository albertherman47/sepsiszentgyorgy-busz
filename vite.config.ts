import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    // MapLibre v6 ESM worker breaks Vite pre-bundling (missing maplibre-gl-worker.mjs)
    exclude: ['maplibre-gl'],
  },
})
