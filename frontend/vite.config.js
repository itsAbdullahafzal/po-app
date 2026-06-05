import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      // Only used in local development — in production VITE_API_URL overrides this
      '/api': { target: 'http://localhost:3001', changeOrigin: true }
    }
  }
});
