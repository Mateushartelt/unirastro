import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Com VITE_API_URL=/api, as chamadas vao para a API Express em backend/.
    proxy: { '/api': 'http://localhost:3333' },
  },
})
