import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base: './' keeps every asset path relative, so the build works on any host or sub-folder.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: { target: 'es2020', chunkSizeWarningLimit: 900 },
  // A dedicated address, so an older copy of the site still running on Vite's
  // default port (5173) can never be mistaken for this one. Opens automatically.
  server: { port: 5190, strictPort: true, open: true },
  preview: { port: 5191, strictPort: true, open: true },
})
