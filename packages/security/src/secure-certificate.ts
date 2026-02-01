import { EnvelopeEncryption, type EncryptedEnvelope } from './envelope-encryption';
import { type KMSProvider, getKMSProvider } from './kms';
import {
  type AuditLogger,
  type AuditContext,
  InMemoryAuditLogger,
} from './audit';

// ============================================
// Types
// ============================================

export interface SecureCertificateData {
  /** Envelope criptografado (serializado) */
  encryptedEnvelope: string;
  /** DEK criptografado pelo KMS (Base64) */
  encryptedKek: string;
  /** Versao do formato */
  version: number;
  /** Hash do certificado original (para verificacao) */
  certificateHash: string;
}

export interface CertificateMetadata {
  cnpj: string;
  razaoSocial: string;
  validFrom: Date;
  validTo: Date;
  serialNumber: string;
  issuer: string;
  thumbprint: string;
}

export interface SecureCertificateConfig {
  kmsProvider?: KMSProvider;
  auditLogger?: AuditLogger;
}

// ============================================
// Secure Certificate Service
// ============================================

const CURRENT_VERSION = 1;

export class SecureCertificateService {
  private envelope: EnvelopeEncryption;
  private kms: KMSProvider | null = null;
  private auditLogger: AuditLogger;
  private initialized = false;

  constructor(config?: SecureCertificateConfig) {
    this.envelope = new EnvelopeEncryption();
    this.kms = config?.kmsProvider || null;
    this.auditLogger = config?.auditLogger || new InMemoryAuditLogger();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (!this.kms) {
      this.kms = await getKMSProvider();
    }

    this.initialized = true;
  }

  /**
   * Criptografa um certificado PFX para armazenamento seguro
   */
  async encryptCertificate(
    pfxBuffer: Buffer,
    password: string,
    context: AuditContext
  ): Promise<SecureCertificateData> {
    await this.initialize();

    try {
      // Combinar certificado e senha
      const dataToEncrypt = this.packCertificateData(pfxBuffer, password);

      // Gerar KEK via KMS
      const { plaintext: kek, ciphertext: encryptedKek } =
        await this.kms!.generateDataKey();

      try {
        // Criptografar com envelope encryption
        const encryptedEnvelope = await this.envelope.encrypt(dataToEncrypt, kek);

        // Serializar envelope
        const serialized = this.envelope.serialize(encryptedEnvelope);

        // Calcular hash do certificado original
        const { createHash } = await import('crypto');
        const certificateHash = createHash('sha256').update(pfxBuffer).digest('hex');

        const result: SecureCertificateData = {
          encryptedEnvelope: serialized.data,
          encryptedKek: encryptedKek.toString('base64'),
          version: CURRENT_VERSION,
          certificateHash,
        };

        // Auditoria
        await this.auditLogger.log({
          action: 'UPLOAD',
          status: 'success',
          context,
          metadata: {
            certificateHash,
            version: CURRENT_VERSION,
          },
        });

        return result;
      } finally {
        // Limpar KEK da memoria
        kek.fill(0);
      }
    } catch (error) {
      await this.auditLogger.log({
        action: 'UPLOAD',
        status: 'failure',
        context,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Decriptografa um certificado para uso
   */
  async decryptCertificate(
    data: SecureCertificateData,
    context: AuditContext
  ): Promise<{ pfxBuffer: Buffer; password: string }> {
    await this.initialize();

    try {
      // Decriptografar KEK via KMS
      const encryptedKek = Buffer.from(data.encryptedKek, 'base64');
      const kek = await this.kms!.decrypt(encryptedKek);

      try {
        // Deserializar e decriptografar envelope
        const envelope = this.envelope.deserialize({
          data: data.encryptedEnvelope,
          version: data.version,
        });

        const decrypted = await this.envelope.decrypt(envelope, kek);

        // Extrair certificado e senha
        const { pfxBuffer, password } = this.unpackCertificateData(decrypted);

        // Verificar hash
        const { createHash } = await import('crypto');
        const hash = createHash('sha256').update(pfxBuffer).digest('hex');

        if (hash !== data.certificateHash) {
          throw new Error('Certificado corrompido: hash nao confere');
        }

        // Auditoria
        await this.auditLogger.log({
          action: 'DECRYPT',
          status: 'success',
          context,
          metadata: {
            certificateHash: data.certificateHash,
          },
        });

        return { pfxBuffer, password };
      } finally {
        kek.fill(0);
      }
    } catch (error) {
      await this.auditLogger.log({
        action: 'DECRYPT',
        status: 'failure',
        context,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Rotaciona a KEK de um certificado (re-criptografa)
   */
  async rotateKek(
    data: SecureCertificateData,
    context: AuditContext
  ): Promise<SecureCertificateData> {
    await this.initialize();

    // Decriptografar KEK antiga
    const oldEncryptedKek = Buffer.from(data.encryptedKek, 'base64');
    const oldKek = await this.kms!.decrypt(oldEncryptedKek);

    // Gerar nova KEK
    const { plaintext: newKek, ciphertext: newEncryptedKek } =
      await this.kms!.generateDataKey();

    try {
      // Deserializar envelope
      const envelope = this.envelope.deserialize({
        data: data.encryptedEnvelope,
        version: data.version,
      });

      // Re-criptografar envelope com nova KEK
      const reencryptedEnvelope = await this.envelope.reencrypt(
        envelope,
        oldKek,
        newKek
      );

      const serialized = this.envelope.serialize(reencryptedEnvelope);

      await this.auditLogger.log({
        action: 'USE_FOR_SIGNING',
        status: 'success',
        context,
        metadata: {
          operation: 'KEY_ROTATION',
          certificateHash: data.certificateHash,
        },
      });

      return {
        ...data,
        encryptedEnvelope: serialized.data,
        encryptedKek: newEncryptedKek.toString('base64'),
      };
    } finally {
      oldKek.fill(0);
      newKek.fill(0);
    }
  }

  // ============================================
  // Private Methods
  // ============================================

  /**
   * Empacota certificado e senha em um unico buffer
   * Formato: [passwordLength(4 bytes)][password][pfxBuffer]
   */
  private packCertificateData(pfxBuffer: Buffer, password: string): Buffer {
    const passwordBuffer = Buffer.from(password, 'utf-8');
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32BE(passwordBuffer.length);

    return Buffer.concat([lengthBuffer, passwordBuffer, pfxBuffer]);
  }

  /**
   * Desempacota certificado e senha
   */
  private unpackCertificateData(data: Buffer): {
    pfxBuffer: Buffer;
    password: string;
  } {
    const passwordLength = data.readUInt32BE(0);
    const password = data.subarray(4, 4 + passwordLength).toString('utf-8');
    const pfxBuffer = data.subarray(4 + passwordLength);

    return { pfxBuffer, password };
  }
}

// ============================================
// Singleton
// ============================================

let _instance: SecureCertificateService | null = null;

export function getSecureCertificateService(
  config?: SecureCertificateConfig
): SecureCertificateService {
  if (!_instance) {
    _instance = new SecureCertificateService(config);
  }
  return _instance;
}

export function resetSecureCertificateService(): void {
  _instance = null;
}
