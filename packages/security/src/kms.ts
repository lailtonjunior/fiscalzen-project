import {
  KMSClient,
  GenerateDataKeyCommand,
  DecryptCommand,
  EncryptCommand,
} from '@aws-sdk/client-kms';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto';

// ============================================
// Types
// ============================================

export interface DataKeyResult {
  /** Chave em texto plano (usar e descartar) */
  plaintext: Buffer;
  /** Chave criptografada (armazenar) */
  ciphertext: Buffer;
}

export interface KMSProvider {
  /** Gera uma nova Data Key */
  generateDataKey(): Promise<DataKeyResult>;
  /** Decripta uma Data Key criptografada */
  decrypt(ciphertext: Buffer): Promise<Buffer>;
  /** Cripta dados diretamente (para dados pequenos) */
  encrypt(plaintext: Buffer): Promise<Buffer>;
  /** Verifica se o provider esta disponivel */
  isAvailable(): Promise<boolean>;
}

// ============================================
// AWS KMS Provider
// ============================================

export class AWSKMSProvider implements KMSProvider {
  private client: KMSClient;
  private keyId: string;

  constructor(keyId: string, region?: string) {
    this.keyId = keyId;
    this.client = new KMSClient({
      region: region || process.env.AWS_REGION || 'sa-east-1',
    });
  }

  async generateDataKey(): Promise<DataKeyResult> {
    const command = new GenerateDataKeyCommand({
      KeyId: this.keyId,
      KeySpec: 'AES_256',
    });

    const response = await this.client.send(command);

    if (!response.Plaintext || !response.CiphertextBlob) {
      throw new Error('KMS nao retornou Data Key');
    }

    return {
      plaintext: Buffer.from(response.Plaintext),
      ciphertext: Buffer.from(response.CiphertextBlob),
    };
  }

  async decrypt(ciphertext: Buffer): Promise<Buffer> {
    const command = new DecryptCommand({
      CiphertextBlob: ciphertext,
      KeyId: this.keyId,
    });

    const response = await this.client.send(command);

    if (!response.Plaintext) {
      throw new Error('KMS nao retornou dados decriptados');
    }

    return Buffer.from(response.Plaintext);
  }

  async encrypt(plaintext: Buffer): Promise<Buffer> {
    const command = new EncryptCommand({
      KeyId: this.keyId,
      Plaintext: plaintext,
    });

    const response = await this.client.send(command);

    if (!response.CiphertextBlob) {
      throw new Error('KMS nao retornou dados criptografados');
    }

    return Buffer.from(response.CiphertextBlob);
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Tenta gerar uma data key para verificar conectividade
      await this.generateDataKey();
      return true;
    } catch {
      return false;
    }
  }
}

// ============================================
// Local KMS Provider (Desenvolvimento/Fallback)
// ============================================

const ALGORITHM = 'aes-256-gcm' as const;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

export class LocalKMSProvider implements KMSProvider {
  private masterKey: Buffer;

  constructor(masterKey?: string | Buffer) {
    if (masterKey) {
      this.masterKey = typeof masterKey === 'string'
        ? Buffer.from(masterKey, 'base64')
        : masterKey;
    } else {
      const envKey = process.env.LOCAL_MASTER_KEY || process.env.CERT_ENCRYPTION_KEY;
      if (!envKey) {
        throw new Error(
          'LOCAL_MASTER_KEY ou CERT_ENCRYPTION_KEY deve estar configurada para LocalKMSProvider'
        );
      }

      // Se a chave tiver menos de 32 bytes, deriva usando scrypt
      if (envKey.length < KEY_LENGTH) {
        this.masterKey = scryptSync(envKey, 'fiscalzen-kms-salt', KEY_LENGTH);
      } else if (envKey.length === KEY_LENGTH) {
        this.masterKey = Buffer.from(envKey);
      } else {
        // Tenta decodificar como base64
        try {
          this.masterKey = Buffer.from(envKey, 'base64');
          if (this.masterKey.length !== KEY_LENGTH) {
            this.masterKey = scryptSync(envKey, 'fiscalzen-kms-salt', KEY_LENGTH);
          }
        } catch {
          this.masterKey = scryptSync(envKey, 'fiscalzen-kms-salt', KEY_LENGTH);
        }
      }
    }

    if (this.masterKey.length !== KEY_LENGTH) {
      throw new Error(`Master key deve ter ${KEY_LENGTH} bytes`);
    }
  }

  async generateDataKey(): Promise<DataKeyResult> {
    // Gerar nova Data Key aleatoria
    const plaintext = randomBytes(KEY_LENGTH);

    // Criptografar com master key
    const ciphertext = this.encryptInternal(plaintext);

    return { plaintext, ciphertext };
  }

  async decrypt(ciphertext: Buffer): Promise<Buffer> {
    return this.decryptInternal(ciphertext);
  }

  async encrypt(plaintext: Buffer): Promise<Buffer> {
    return this.encryptInternal(plaintext);
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  private encryptInternal(data: Buffer): Buffer {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.masterKey, iv);

    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Formato: iv + authTag + encrypted
    return Buffer.concat([iv, authTag, encrypted]);
  }

  private decryptInternal(ciphertext: Buffer): Buffer {
    const iv = ciphertext.subarray(0, IV_LENGTH);
    const authTag = ciphertext.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = ciphertext.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, this.masterKey, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }
}

// ============================================
// KMS Factory
// ============================================

export interface KMSConfig {
  provider: 'aws' | 'local';
  awsKeyId?: string;
  awsRegion?: string;
  localMasterKey?: string;
}

export function createKMSProvider(config?: KMSConfig): KMSProvider {
  const providerType = config?.provider || process.env.KMS_PROVIDER || 'local';

  if (providerType === 'aws') {
    const keyId = config?.awsKeyId || process.env.AWS_KMS_KEY_ID;
    if (!keyId) {
      throw new Error('AWS_KMS_KEY_ID deve estar configurado para usar AWS KMS');
    }
    return new AWSKMSProvider(keyId, config?.awsRegion);
  }

  return new LocalKMSProvider(config?.localMasterKey);
}

// ============================================
// Singleton com Fallback Automatico
// ============================================

let _kmsProvider: KMSProvider | null = null;

export async function getKMSProvider(): Promise<KMSProvider> {
  if (_kmsProvider) {
    return _kmsProvider;
  }

  // Tenta AWS KMS primeiro se configurado
  const awsKeyId = process.env.AWS_KMS_KEY_ID;
  if (awsKeyId) {
    const awsProvider = new AWSKMSProvider(awsKeyId);
    const available = await awsProvider.isAvailable();

    if (available) {
      _kmsProvider = awsProvider;
      console.info('[KMS] Usando AWS KMS');
      return _kmsProvider;
    }

    console.warn('[KMS] AWS KMS nao disponivel, usando fallback local');
  }

  // Fallback para local
  _kmsProvider = new LocalKMSProvider();
  console.info('[KMS] Usando Local KMS Provider');
  return _kmsProvider;
}

export function resetKMSProvider(): void {
  _kmsProvider = null;
}
