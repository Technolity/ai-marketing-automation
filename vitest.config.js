import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    css: {
      include: [] // Don't process any CSS files
    },
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  },
  css: {
    postcss: false // Completely disable PostCSS
  }
});
