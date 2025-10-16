// Vite configuration for the preload script

import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    outDir: 'dist/preload',
    emptyOutDir: true,
    lib: {
      entry: path.resolve(__dirname, 'src/preload/preload.ts'),
      formats: ['cjs'],
      fileName: () => 'preload.js',
    },
    rollupOptions: {
      external: ['electron'],
    },
  },
});
