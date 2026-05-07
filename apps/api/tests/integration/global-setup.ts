/**
 * Global Setup for Integration Tests
 * 
 * Ensures database is ready before running any tests.
 */
import { assertDatabaseConnection, createTestClient, schemaExists } from '../helpers/database';
import { closeTestClient } from '../helpers/database';
import { describeTestDatabaseTarget, getTestDatabaseUrl, setupIntegrationEnvironment } from './setup.integration';

export default async function () {
    setupIntegrationEnvironment();

    const db = createTestClient();
    try {
        await assertDatabaseConnection(db);
        const hasSchema = await schemaExists(db);

        if (!hasSchema) {
            throw new Error(
                [
                    'Integration test database schema not initialized.',
                    `Checked ${describeTestDatabaseTarget(getTestDatabaseUrl())}.`,
                    'Run pnpm db:push:test before pnpm --filter @fiscalzen/api test:integration.',
                ].join(' ')
            );
        }
    } catch (error) {
        const message =
            error instanceof Error && error.message
                ? error.message
                : String(error || 'unknown error');
        throw new Error(
            [
                `Integration test environment is not ready: ${message}.`,
                `Checked ${describeTestDatabaseTarget(getTestDatabaseUrl())}.`,
                'Start the test services with pnpm test:integration:up and prepare the schema with pnpm db:push:test.',
            ].join(' ')
        );
    } finally {
        await closeTestClient();
    }
}
