import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        cambusa: resolve(__dirname, 'cambusa.html'),
      },
    },
  },

  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
