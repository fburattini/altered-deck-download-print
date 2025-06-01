import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: './webapp',
  build: {
    outDir: '../dist-webapp'
  },
  server: {
    port: 3000
  }
})
