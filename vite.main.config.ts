// Vite configuration for the Electron main process

import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  // Build for Node.js (Electron main process)
  build: {
    outDir: 'dist/main',
    emptyOutDir: true,
    lib: {
      entry: {
        main: path.resolve(__dirname, 'src/main/main.ts'),
        'workers/import-worker': path.resolve(__dirname, 'src/main/workers/import-worker.ts'),
      },
      formats: ['cjs'],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [
        'electron',
        'better-sqlite3',
        'path',
        'fs',
        'url',
        'worker_threads',
        // Add other Node.js built-ins as needed
      ],
      output: {
        // Preserve dynamic requires for native modules
        format: 'cjs',
      },
    },
    // Don't minify so native modules work properly
    minify: false,
  },
  
  resolve: {
    // Use browser field resolution for compatibility
    browserField: false,
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
});