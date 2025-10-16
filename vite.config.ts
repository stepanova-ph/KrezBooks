// Vite configuration for the React renderer process

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // React plugin for JSX support
  plugins: [react()],
  
  // Base path for assets
  base: './',
  
  // Build output directory
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
  },
  
  // Dev server configuration
  server: {
    port: 5173,
    strictPort: true,
  },
  
  // Path aliases (optional, for cleaner imports)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
    },
  },
});
