import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Allows deploying on both root domains (Vercel) and subdirectory paths (GitHub Pages)
  server: {
    port: 5173,
    host: true
  }
})
