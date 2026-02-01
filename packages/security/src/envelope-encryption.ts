import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'crypto';

// ============================================
// Types
// ============================================

export interface EncryptedEnvelope {
  /** Dados criptografados com DEK */
  ciphertext: Buffer;
  /** DEK criptografado com KEK */
  encryptedDek: Buffer;
  /** Vetor de inicializacao para dados */
  iv: Buffer;
  /** Tag de autenticacao GCM */
  authTag: Buffer;
  /** Versao do algoritmo (para migracao futura) */
  version: number;
}

export interface SerializedEnvelope {
  /** Envelope completo em Base64 */
  data: string;
  /** Versao do formato */
  version: number;
}

// ============================================
// Constants
// ============================================

const ALGORITHM = 'aes-256-gcm' as const;
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const CURRENT_VERSION = 1;

// ============================================
// Envelope Encryption Class
// ============================================

/**
 * Implementa Envelope Encryption para protecao de dados sensiveis.
 *
 * Conceito:
 * - DEK (Data Encryption Key): Chave unica gerada para cada dado
 * - KEK (Key Encryption Key): Chave mestra que protege os DEKs
 *
 * O dado e criptografado com DEK, e o DEK e criptografado com KEK.
 * Isso permite rotacao de KEK sem re-criptografar todos os dados.
 */
export class EnvelopeEncryption {
  /**
   * Criptografa dados usando envelope encryption
   *
   * @param data - Dados a serem criptografados
   * @param kek - Key Encryption Key (deve ter 32 bytes)
   * @returns Envelope criptografado
   */
  async encrypt(data: Buffer, kek: Buffer): Promise<EncryptedEnvelope> {
    this.validateKek(kek);

    // Gerar DEK aleatorio (Data Encryption Key)
    const dek = randomBytes(KEY_LENGTH);

    // Criptografar dados com DEK usando AES-256-GCM
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, dek, iv);

    const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Criptografar DEK com KEK
    const encryptedDek = this.encryptDek(dek, kek);

    // Limpar DEK da memoria (melhor esforco)
    dek.fill(0);

    return {
      ciphertext,
      encryptedDek,
      iv,
      authTag,
      version: CURRENT_VERSION,
    };
  }

  /**
   * Decriptografa envelope
   *
   * @param envelope - Envelope criptografado
   * @param kek - Key Encryption Key
   * @returns Dados decriptografados
   */
  async decrypt(envelope: EncryptedEnvelope, kek: Buffer): Promise<Buffer> {
    this.validateKek(kek);

    // Decriptografar DEK com KEK
    const dek = this.decryptDek(envelope.encryptedDek, kek);

    try {
      // Decriptografar dados com DEK
      const decipher = createDecipheriv(ALGORITHM, dek, envelope.iv);
      decipher.setAuthTag(envelope.authTag);

      const plaintext = Buffer.concat([
        decipher.update(envelope.ciphertext),
        decipher.final(),
      ]);

      return plaintext;
    } finally {
      // Limpar DEK da memoria
      dek.fill(0);
    }
  }

  /**
   * Serializa envelope para armazenamento
   *
   * Formato: version(1) + ivLen(1) + iv + authTagLen(1) + authTag + dekLen(2) + encryptedDek + ciphertext
   */
  serialize(envelope: EncryptedEnvelope): SerializedEnvelope {
    const ivLen = Buffer.alloc(1);
    ivLen.writeUInt8(envelope.iv.length);

    const authTagLen = Buffer.alloc(1);
    authTagLen.writeUInt8(envelope.authTag.length);

    const dekLen = Buffer.alloc(2);
    dekLen.writeUInt16BE(envelope.encryptedDek.length);

    const versionBuf = Buffer.alloc(1);
    versionBuf.writeUInt8(envelope.version);

    const combined = Buffer.concat([
      versionBuf,
      ivLen,
      envelope.iv,
      authTagLen,
      envelope.authTag,
      dekLen,
      envelope.encryptedDek,
      envelope.ciphertext,
    ]);

    return {
      data: combined.toString('base64'),
      version: CURRENT_VERSION,
    };
  }

  /**
   * Deserializa envelope do armazenamento
   */
  deserialize(serialized: SerializedEnvelope): EncryptedEnvelope {
    const buffer = Buffer.from(serialized.data, 'base64');
    let offset = 0;

    const version = buffer.readUInt8(offset);
    offset += 1;

    const ivLen = buffer.readUInt8(offset);
    offset += 1;

    const iv = buffer.subarray(offset, offset + ivLen);
    offset += ivLen;

    const authTagLen = buffer.readUInt8(offset);
    offset += 1;

    const authTag = buffer.subarray(offset, offset + authTagLen);
    offset += authTagLen;

    const dekLen = buffer.readUInt16BE(offset);
    offset += 2;

    const encryptedDek = buffer.subarray(offset, offset + dekLen);
    offset += dekLen;

    const ciphertext = buffer.subarray(offset);

    return {
      ciphertext,
      encryptedDek,
      iv,
      authTag,
      version,
    };
  }

  /**
   * Re-criptografa envelope com nova KEK (para rotacao de chaves)
   */
  async reencrypt(
    envelope: EncryptedEnvelope,
    oldKek: Buffer,
    newKek: Buffer
  ): Promise<EncryptedEnvelope> {
    // Decriptografar DEK com KEK antiga
    const dek = this.decryptDek(envelope.encryptedDek, oldKek);

    try {
      // Re-criptografar DEK com nova KEK
      const newEncryptedDek = this.encryptDek(dek, newKek);

      return {
        ...envelope,
        encryptedDek: newEncryptedDek,
      };
    } finally {
      dek.fill(0);
    }
  }

  // ============================================
  // Private Methods
  // ============================================

  private encryptDek(dek: Buffer, kek: Buffer): Buffer {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, kek, iv);

    const encrypted = Buffer.concat([cipher.update(dek), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Formato: iv + authTag + encrypted
    return Buffer.concat([iv, authTag, encrypted]);
  }

  private decryptDek(encryptedDek: Buffer, kek: Buffer): Buffer {
    const iv = encryptedDek.subarray(0, IV_LENGTH);
    const authTag = encryptedDek.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = encryptedDek.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, kek, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }

  private validateKek(kek: Buffer): void {
    if (!Buffer.isBuffer(kek)) {
      throw new Error('KEK deve ser um Buffer');
    }
    if (kek.length !== KEY_LENGTH) {
      throw new Error(`KEK deve ter ${KEY_LENGTH} bytes (256 bits)`);
    }
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Deriva uma KEK a partir de uma senha usando scrypt
 * Util para desenvolvimento/testes
 */
export function deriveKekFromPassword(
  password: string,
  salt: Buffer | string
): Buffer {
  const saltBuffer = typeof salt === 'string' ? Buffer.from(salt) : salt;
  return scryptSync(password, saltBuffer, KEY_LENGTH);
}

/**
 * Gera uma KEK aleatoria segura
 */
export function generateKek(): Buffer {
  return randomBytes(KEY_LENGTH);
}

/**
 * Compara dois buffers de forma segura (timing-safe)
 */
export function secureCompare(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

// ============================================
// Singleton Export
// ============================================

export const envelopeEncryption = new EnvelopeEncryption();
