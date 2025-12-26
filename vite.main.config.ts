
import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

// Plugin to copy template files and assets to dist
function copyResources() {
  return {
    name: 'copy-resources',
    closeBundle() {
      // Copy templates
      const srcTemplates = path.resolve(__dirname, 'src/templates');
      const destTemplates = path.resolve(__dirname, 'dist/templates');
      if (fs.existsSync(srcTemplates)) {
        fs.cpSync(srcTemplates, destTemplates, { recursive: true });
        console.log('✓ Copied templates to dist/templates');
      }

      // Copy assets
      const srcAssets = path.resolve(__dirname, 'assets');
      const destAssets = path.resolve(__dirname, 'dist/assets');
      if (fs.existsSync(srcAssets)) {
        fs.cpSync(srcAssets, destAssets, { recursive: true });
        console.log('✓ Copied assets to dist/assets');
      }
    },
  };
}

export default defineConfig({
  plugins: [copyResources()],
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