/**
 * Initialize Test Database Schema
 * 
 * Creates all tables in the test database using drizzle-kit push.
 * This script answers 'yes' to the interactive prompt automatically.
 * 
 * Usage: tsx init-test-db.ts
 */

import { spawn } from 'child_process';
import path from 'path';

const TEST_DB_URL = 'postgresql://fiscalzen_test:fiscalzen_test@localhost:5434/fiscalzen_test';

async function main() {
    console.log('🔄 Initializing test database schema...');
    console.log(`📍 Database: ${TEST_DB_URL.replace(/:[^:@]+@/, ':***@')}`);

    // Set DATABASE_URL for drizzle-kit
    process.env.DATABASE_URL = TEST_DB_URL;

    const drizzleKit = spawn(
        'npx',
        ['drizzle-kit', 'push:pg', '--force'],
        {
            cwd: path.resolve(__dirname, '../../../packages/database'),
            env: { ...process.env, DATABASE_URL: TEST_DB_URL },
            shell: true,
            stdio: 'inherit',
        }
    );

    drizzleKit.on('close', (code) => {
        if (code === 0) {
            console.log('✅ Test database schema initialized successfully!');
        } else {
            console.error(`❌ Failed with exit code ${code}`);
            process.exit(1);
        }
    });
}

main().catch(console.error);
