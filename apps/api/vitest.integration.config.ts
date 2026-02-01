import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for integration tests
 * 
 * Run with: pnpm test:integration
 * Requires: docker-compose.test.yml running (pnpm test:integration:up)
 */
export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        // Updated to include new test filenames
        include: ['tests/integration/**/*.test.ts', 'tests/integration/**/*.integration.test.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            exclude: ['node_modules', 'tests', 'dist'],
        },
        // Longer timeout for database operations
        testTimeout: 30000,
        hookTimeout: 30000,
        // Global setup for container/db checks
        globalSetup: ['./tests/integration/global-setup.ts'],
        // Setup files for integration test environment
        setupFiles: ['./tests/integration/setup.integration.ts'],
        // Run tests sequentially to avoid database conflicts
        sequence: {
            concurrent: false,
        },
        // Retry failed tests once (useful for flaky DB connections)
        retry: 1,
    },
});
