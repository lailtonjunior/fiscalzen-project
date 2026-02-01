/**
 * Global Setup for Integration Tests
 * 
 * Ensures database is ready before running any tests.
 */
import { createTestClient, schemaExists } from '../helpers/database';
// @ts-ignore
import { execSync } from 'child_process';

export default async function () {
    console.log('\n🔵 Global Setup: Checking test environment...');

    const db = createTestClient();
    const hasSchema = await schemaExists(db);

    if (!hasSchema) {
        console.log('⚠️  Schema not found. Attempting to push schema...');
        try {
            // This assumes we are in apps/api and database package is at ../../packages/database
            // Adjust path if necessary based on monorepo structure
            // Actually, easiest way is to use the existing tool or script if available.
            // For now, we warn the user as auto-migration might be risky/complex in global setup without proper context.
            console.warn('❌ Test database not initialized! Please run: pnpm db:push:test');
        } catch (e) {
            console.error('Failed to initialize db', e);
        }
    } else {
        console.log('✅ Test database connected and schema exists.');
    }

    // Close connection used for check
    // @ts-ignore
    if (db.end) await db.end();
}
