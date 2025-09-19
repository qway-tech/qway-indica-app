import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:4001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@formacoes': path.resolve(__dirname, '../../../formacoes'),
      '@recursos': path.resolve(__dirname, '../../../recursos'),
      '@mentorias': path.resolve(__dirname, '../../../mentorias'),
      '@assets': path.resolve(__dirname, '../../../assets'),
      '@types': path.resolve(__dirname, 'types')
    }
  },
});
