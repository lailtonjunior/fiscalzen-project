#!/usr/bin/env node
/**
 * Script para gerar secrets de segurança para o FiscalZen
 * 
 * Uso: node scripts/generate-secrets.js
 * 
 * Copie a saída para seu arquivo .env.local
 */

const crypto = require('crypto');

console.log('===========================================');
console.log('  FiscalZen - Gerador de Secrets');
console.log('===========================================\n');

console.log('Copie as linhas abaixo para seu .env.local:\n');

console.log('# JWT / Session');
console.log(`JWT_SECRET=${crypto.randomBytes(64).toString('hex')}`);
console.log('');

console.log('# Agent WebSocket');
console.log(`AGENT_TOKEN_SECRET=${crypto.randomBytes(32).toString('hex')}`);
console.log('');

console.log('# Certificate Encryption (A1 PFX)');
console.log(`CERT_ENCRYPTION_KEY=${crypto.randomBytes(32).toString('base64')}`);
console.log('');

console.log('===========================================');
console.log('  IMPORTANTE');
console.log('===========================================');
console.log('- Nunca commite esses valores no Git!');
console.log('- Use valores diferentes em produção!');
console.log('- Guarde CERT_ENCRYPTION_KEY em local seguro');
console.log('  (sem ela, certificados não podem ser descriptografados)');
console.log('===========================================\n');
