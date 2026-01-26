import 'reflect-metadata';
import { describe, it, expect, beforeAll } from 'vitest';
import { CertificateCryptoService } from '../src/modules/companies/crypto.service';

describe('CertificateCryptoService', () => {
    let crypto: CertificateCryptoService;

    beforeAll(() => {
        crypto = new CertificateCryptoService('test-encryption-key-that-is-at-least-32-chars');
    });

    it('should encrypt and decrypt buffer correctly', () => {
        const original = Buffer.from('Hello, World!');
        const encrypted = crypto.encrypt(original);
        const decrypted = crypto.decrypt(encrypted);

        expect(decrypted.toString()).toBe(original.toString());
    });

    it('should produce format iv:tag:data', () => {
        const original = Buffer.from('Test Data');
        const encrypted = crypto.encrypt(original);

        expect(encrypted.split(':').length).toBe(3);
    });

    it('should encrypt and decrypt password correctly', () => {
        const password = 'my-secret-password';
        const encrypted = crypto.encryptPassword(password);
        const decrypted = crypto.decryptPassword(encrypted);

        expect(decrypted).toBe(password);
    });

    it('should handle legacy base64 format', () => {
        const originalData = 'Legacy Data';
        const legacyEncrypted = Buffer.from(originalData).toString('base64');
        const decrypted = crypto.decrypt(legacyEncrypted);

        expect(decrypted.toString()).toBe(originalData);
    });

    it('should throw on invalid format', () => {
        expect(() => crypto.decrypt('invalid:format')).toThrow('Formato de certificado encriptado inválido');
    });
});
