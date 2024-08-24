import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: resolve(__dirname, 'src'),
  test: {
    clearMocks: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    include: ['**/__tests__/*.{test,spec}.js'],
    exclude: ['**/dits/**', '**/node_modules/**'],
    coverage: {
      reportsDirectory: resolve(__dirname, 'coverage'),
      reporter: ['html'],
      enabled: true,
    },
  },
});
