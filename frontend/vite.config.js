import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// El proxy manda /api al backend, asi no hace falta configurar CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3001' },
  },
});
