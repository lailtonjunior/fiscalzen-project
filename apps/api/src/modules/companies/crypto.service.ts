import crypto from 'crypto';
import { env } from '../../config/env';

export interface CertificateInfo {
    subject: string;
    issuer: string;
    validFrom: Date;
    validTo: Date;
    serialNumber: string;
}

/**
 * Service for encrypting/decrypting A1 digital certificates (PFX)
 * Uses AES-256-GCM for authenticated encryption
 */
export class CertificateCryptoService {
    private readonly algorithm = 'aes-256-gcm' as const;
    private readonly keyLength = 32;
    private readonly ivLength = 16;
    private readonly key: Buffer;

    constructor(encryptionKey: string) {
        if (!encryptionKey || encryptionKey.length < 32) {
            throw new Error('CERT_ENCRYPTION_KEY deve ter pelo menos 32 caracteres');
        }
        // Derive a proper 32-byte key using scrypt
        this.key = crypto.scryptSync(encryptionKey, 'fiscalzen-cert-salt', this.keyLength);
    }

    /**
     * Encrypts the PFX certificate buffer for secure storage
     * @param pfxBuffer - Raw PFX certificate buffer
     * @returns Base64 encoded string in format: iv:tag:encrypted
     */
    encrypt(pfxBuffer: Buffer): string {
        const iv = crypto.randomBytes(this.ivLength);

        const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

        const encrypted = Buffer.concat([
            cipher.update(pfxBuffer),
            cipher.final()
        ]);

        const tag = cipher.getAuthTag();

        // Format: iv:tag:encrypted (all base64)
        return [
            iv.toString('base64'),
            tag.toString('base64'),
            encrypted.toString('base64')
        ].join(':');
    }

    /**
     * Decrypts an encrypted certificate string back to Buffer
     * @param encryptedData - Base64 encoded string in format: iv:tag:encrypted
     * @returns Decrypted PFX buffer
     */
    decrypt(encryptedData: string): Buffer {
        // Handle legacy format (raw base64 without iv:tag prefix)
        if (!encryptedData.includes(':')) {
            // Legacy: assume it's just base64 encoded raw data
            return Buffer.from(encryptedData, 'base64');
        }

        const parts = encryptedData.split(':');
        if (parts.length !== 3) {
            throw new Error('Formato de certificado encriptado inválido');
        }

        const [ivB64, tagB64, encryptedB64] = parts;

        const iv = Buffer.from(ivB64, 'base64');
        const tag = Buffer.from(tagB64, 'base64');
        const encrypted = Buffer.from(encryptedB64, 'base64');

        const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
        decipher.setAuthTag(tag);

        return Buffer.concat([
            decipher.update(encrypted),
            decipher.final()
        ]);
    }

    /**
     * Encrypts a password string for secure storage
     * @param password - Plain text password
     * @returns Base64 encoded encrypted string
     */
    encryptPassword(password: string): string {
        return this.encrypt(Buffer.from(password, 'utf-8'));
    }

    /**
     * Decrypts an encrypted password
     * @param encryptedPassword - Encrypted password string
     * @returns Plain text password
     */
    decryptPassword(encryptedPassword: string): string {
        return this.decrypt(encryptedPassword).toString('utf-8');
    }

    /**
     * Extracts certificate information without exposing the private key
     * Requires node-forge for PKCS#12 parsing
     */
    extractCertInfo(pfxBuffer: Buffer, password: string): CertificateInfo {
        try {
            // Using node-forge for PKCS#12 parsing
            const forge = require('node-forge');
            const p12Asn1 = forge.asn1.fromDer(pfxBuffer.toString('binary'));
            const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

            // Find the certificate bag
            const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
            const certBag = certBags[forge.pki.oids.certBag];

            if (!certBag || certBag.length === 0) {
                throw new Error('Nenhum certificado encontrado no arquivo PFX');
            }

            const cert = certBag[0].cert;

            return {
                subject: cert.subject.getField('CN')?.value || 'Unknown',
                issuer: cert.issuer.getField('CN')?.value || 'Unknown',
                validFrom: cert.validity.notBefore,
                validTo: cert.validity.notAfter,
                serialNumber: cert.serialNumber
            };
        } catch (error: any) {
            throw new Error(`Erro ao extrair informações do certificado: ${error.message}`);
        }
    }
}

// Singleton instance using environment key
let _instance: CertificateCryptoService | null = null;

export function getCertificateCryptoService(): CertificateCryptoService {
    if (!_instance) {
        _instance = new CertificateCryptoService(env.CERT_ENCRYPTION_KEY);
    }
    return _instance;
}

// Export singleton for convenience
export const certificateCrypto = {
    encrypt: (pfxBuffer: Buffer) => getCertificateCryptoService().encrypt(pfxBuffer),
    decrypt: (encryptedData: string) => getCertificateCryptoService().decrypt(encryptedData),
    encryptPassword: (password: string) => getCertificateCryptoService().encryptPassword(password),
    decryptPassword: (encryptedPassword: string) => getCertificateCryptoService().decryptPassword(encryptedPassword),
    extractCertInfo: (pfxBuffer: Buffer, password: string) => getCertificateCryptoService().extractCertInfo(pfxBuffer, password)
};
