import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['pdfjs-dist'],
  },
  build: {
    commonjsOptions: {
      include: [/pdfjs-dist/, /node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-worker': ['pdfjs-dist'],
        },
      },
    },
  },
  worker: {
    format: 'es',
  },
  server: {
    host: true,
    port: 5173,
    cors: true,
    allowedHosts: 'all',
    hmr: {
      clientPort: 443,
    },
  },
});
