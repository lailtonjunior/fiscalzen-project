import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts'],
    exclude: ['tests/integration/**'],
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

// Integration test configuration
// Run with: vitest run tests/integration --config vitest.integration.config.ts
