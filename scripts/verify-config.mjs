#!/usr/bin/env node
/**
 * FiscalZen Configuration Verification Script
 * Verifies: port consistency, environment variables, and secrets files
 * 
 * Usage: node scripts/verify-config.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ANSI colors
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

let errors = 0;
let warnings = 0;

function pass(msg) {
    console.log(`${GREEN}✓${RESET} ${msg}`);
}

function fail(msg) {
    console.log(`${RED}✗${RESET} ${msg}`);
    errors++;
}

function warn(msg) {
    console.log(`${YELLOW}⚠${RESET} ${msg}`);
    warnings++;
}

console.log('\n🔍 FiscalZen Configuration Verification\n');
console.log('='.repeat(50));

// ============================================
// 1. Port Consistency Check
// ============================================
console.log('\n📌 Port Consistency Check\n');

const EXPECTED_POSTGRES_PORT = '5432';
const EXPECTED_REDIS_PORT = '6379';
const EXPECTED_MEILISEARCH_PORT = '7700';
const EXPECTED_MINIO_PORT = '9000';

const filesToCheck = [
    { path: '.env.example', pattern: /localhost:(\d+)\/fiscalzen/ },
    { path: 'apps/api/.env.example', pattern: /localhost:(\d+)\/fiscalzen/ },
    { path: 'docker/docker-compose.yml', pattern: /'(\d+):5432'/ },
];

for (const file of filesToCheck) {
    const filePath = join(ROOT, file.path);
    if (!existsSync(filePath)) {
        fail(`File not found: ${file.path}`);
        continue;
    }

    const content = readFileSync(filePath, 'utf-8');
    const match = content.match(file.pattern);

    if (match) {
        const port = match[1];
        if (port === EXPECTED_POSTGRES_PORT) {
            pass(`${file.path}: PostgreSQL port = ${port}`);
        } else {
            fail(`${file.path}: PostgreSQL port = ${port} (expected ${EXPECTED_POSTGRES_PORT})`);
        }
    }
}

// ============================================
// 2. Required Environment Variables
// ============================================
console.log('\n📋 Required Environment Variables\n');

const requiredEnvVars = [
    'DATABASE_URL',
    'REDIS_URL',
    'S3_ENDPOINT',
    'S3_BUCKET',
    'MEILISEARCH_HOST',
    'JWT_SECRET',
    'CLERK_SECRET_KEY',
    'CERT_ENCRYPTION_KEY',
];

const envExamplePath = join(ROOT, '.env.example');
if (existsSync(envExamplePath)) {
    const envContent = readFileSync(envExamplePath, 'utf-8');

    for (const varName of requiredEnvVars) {
        if (envContent.includes(`${varName}=`)) {
            pass(`${varName} defined in .env.example`);
        } else {
            fail(`${varName} missing from .env.example`);
        }
    }
} else {
    fail('.env.example not found');
}

// ============================================
// 3. Docker Secrets Files
// ============================================
console.log('\n🔐 Docker Secrets Files\n');

const secretsDir = join(ROOT, 'docker', 'secrets');
const requiredSecrets = [
    'postgres_password.txt',
    'redis_password.txt',
    'meilisearch_key.txt',
    'minio_user.txt',
    'minio_password.txt',
    'jwt_secret.txt',
    'cert_encryption_key.txt',
];

if (existsSync(secretsDir)) {
    for (const secret of requiredSecrets) {
        const secretPath = join(secretsDir, secret);
        if (existsSync(secretPath)) {
            const content = readFileSync(secretPath, 'utf-8').trim();
            if (content.length >= 16) {
                pass(`${secret} exists (${content.length} chars)`);
            } else {
                warn(`${secret} exists but may be too short (${content.length} chars)`);
            }
        } else {
            warn(`${secret} not found (create before running Docker)`);
        }
    }
} else {
    warn('docker/secrets directory not found');
}

// ============================================
// 4. Package.json Scripts Check
// ============================================
console.log('\n📦 Package.json Scripts\n');

const pkgPath = join(ROOT, 'packages', 'database', 'package.json');
if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

    // Check for deprecated drizzle-kit commands
    const deprecatedPatterns = ['generate:pg', 'push:pg', 'migrate:pg'];
    const scripts = JSON.stringify(pkg.scripts || {});

    for (const pattern of deprecatedPatterns) {
        if (scripts.includes(pattern)) {
            fail(`Deprecated command found: ${pattern}`);
        }
    }

    if (!scripts.includes('generate:pg') && !scripts.includes('push:pg')) {
        pass('drizzle-kit commands are using new syntax');
    }

    // Check drizzle-orm version
    const drizzleVersion = pkg.dependencies?.['drizzle-orm'] || '';
    if (drizzleVersion.includes('0.29') || drizzleVersion.includes('0.28')) {
        warn(`drizzle-orm version ${drizzleVersion} is outdated`);
    } else {
        pass(`drizzle-orm version: ${drizzleVersion}`);
    }
}

// ============================================
// Summary
// ============================================
console.log('\n' + '='.repeat(50));
console.log('\n📊 Summary\n');

if (errors === 0 && warnings === 0) {
    console.log(`${GREEN}✓ All checks passed!${RESET}\n`);
    process.exit(0);
} else {
    if (errors > 0) {
        console.log(`${RED}✗ ${errors} error(s)${RESET}`);
    }
    if (warnings > 0) {
        console.log(`${YELLOW}⚠ ${warnings} warning(s)${RESET}`);
    }
    console.log('');
    process.exit(errors > 0 ? 1 : 0);
}
