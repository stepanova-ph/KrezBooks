
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
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
      ],
      output: {
        format: 'cjs',
      },
    },
    minify: false,
  },
  
  resolve: {
    browserField: false,
    mainFields: ['module', 'jsnext:main', 'jsnext'],
  },
});