import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // base path: '/' for Vercel, '/loan-application/' for GitHub Pages
  base: process.env.GITHUB_PAGES ? '/loan-application/' : '/',
  plugins: [
    react(),
    tailwindcss(),
  ],
})
