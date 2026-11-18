import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: { sourcemap: false },
  // In development the API runs separately on :4000; Vite forwards /api to it so the
  // browser still sees one origin (same as production, where Express serves both).
  server: { proxy: { '/api': 'http://localhost:4000' } },
  preview: { proxy: { '/api': 'http://localhost:4000' } },
})
