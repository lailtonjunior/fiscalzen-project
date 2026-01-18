import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules', 'tests', 'dist'],
    },
    // Set test timeout for API tests
    testTimeout: 10000,
    // Setup files for test environment
    setupFiles: ['./tests/setup.ts'],
  },
});
