import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { randomBytes } from 'crypto';
import {
  LocalKMSProvider,
  createKMSProvider,
  resetKMSProvider,
} from '../src/kms';

describe('LocalKMSProvider', () => {
  const testMasterKey = randomBytes(32).toString('base64');

  beforeEach(() => {
    process.env.LOCAL_MASTER_KEY = testMasterKey;
  });

  afterEach(() => {
    delete process.env.LOCAL_MASTER_KEY;
    delete process.env.CERT_ENCRYPTION_KEY;
    resetKMSProvider();
  });

  describe('constructor', () => {
    it('should initialize with explicit master key', () => {
      const key = randomBytes(32);
      const provider = new LocalKMSProvider(key);
      expect(provider).toBeDefined();
    });

    it('should initialize with base64 master key', () => {
      const provider = new LocalKMSProvider(testMasterKey);
      expect(provider).toBeDefined();
    });

    it('should initialize from environment variable', () => {
      const provider = new LocalKMSProvider();
      expect(provider).toBeDefined();
    });

    it('should use CERT_ENCRYPTION_KEY as fallback', () => {
      delete process.env.LOCAL_MASTER_KEY;
      process.env.CERT_ENCRYPTION_KEY = 'test-key-that-is-at-least-32-characters';

      const provider = new LocalKMSProvider();
      expect(provider).toBeDefined();
    });

    it('should throw if no master key is provided', () => {
      delete process.env.LOCAL_MASTER_KEY;
      delete process.env.CERT_ENCRYPTION_KEY;

      expect(() => new LocalKMSProvider()).toThrow();
    });
  });

  describe('generateDataKey', () => {
    it('should generate a data key pair', async () => {
      const provider = new LocalKMSProvider();
      const result = await provider.generateDataKey();

      expect(result.plaintext).toBeDefined();
      expect(result.ciphertext).toBeDefined();
      expect(result.plaintext.length).toBe(32);
    });

    it('should generate unique data keys', async () => {
      const provider = new LocalKMSProvider();

      const result1 = await provider.generateDataKey();
      const result2 = await provider.generateDataKey();

      expect(result1.plaintext.equals(result2.plaintext)).toBe(false);
    });
  });

  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt data', async () => {
      const provider = new LocalKMSProvider();
      const originalData = Buffer.from('test data');

      const encrypted = await provider.encrypt(originalData);
      const decrypted = await provider.decrypt(encrypted);

      expect(decrypted.toString()).toBe(originalData.toString());
    });

    it('should produce different ciphertext for same data', async () => {
      const provider = new LocalKMSProvider();
      const data = Buffer.from('same data');

      const encrypted1 = await provider.encrypt(data);
      const encrypted2 = await provider.encrypt(data);

      expect(encrypted1.equals(encrypted2)).toBe(false);
    });
  });

  describe('isAvailable', () => {
    it('should return true', async () => {
      const provider = new LocalKMSProvider();
      const available = await provider.isAvailable();
      expect(available).toBe(true);
    });
  });
});

describe('createKMSProvider', () => {
  const testMasterKey = randomBytes(32).toString('base64');

  beforeEach(() => {
    process.env.LOCAL_MASTER_KEY = testMasterKey;
    delete process.env.KMS_PROVIDER;
    delete process.env.AWS_KMS_KEY_ID;
  });

  afterEach(() => {
    delete process.env.LOCAL_MASTER_KEY;
    delete process.env.KMS_PROVIDER;
    delete process.env.AWS_KMS_KEY_ID;
    resetKMSProvider();
  });

  it('should create local provider by default', () => {
    const provider = createKMSProvider();
    expect(provider).toBeInstanceOf(LocalKMSProvider);
  });

  it('should create local provider when specified', () => {
    const provider = createKMSProvider({ provider: 'local' });
    expect(provider).toBeInstanceOf(LocalKMSProvider);
  });

  it('should throw when AWS provider requested without key ID', () => {
    expect(() => createKMSProvider({ provider: 'aws' })).toThrow(
      'AWS_KMS_KEY_ID'
    );
  });

  it('should respect environment variable for provider type', () => {
    process.env.KMS_PROVIDER = 'local';
    const provider = createKMSProvider();
    expect(provider).toBeInstanceOf(LocalKMSProvider);
  });
});

describe('Data Key Round Trip', () => {
  const testMasterKey = randomBytes(32).toString('base64');

  beforeEach(() => {
    process.env.LOCAL_MASTER_KEY = testMasterKey;
  });

  afterEach(() => {
    delete process.env.LOCAL_MASTER_KEY;
  });

  it('should successfully round-trip data key', async () => {
    const provider = new LocalKMSProvider();

    // Generate data key
    const { plaintext, ciphertext } = await provider.generateDataKey();

    // Decrypt the encrypted data key
    const decryptedKey = await provider.decrypt(ciphertext);

    // Should match original plaintext
    expect(decryptedKey.equals(plaintext)).toBe(true);
  });

  it('should fail to decrypt with different provider instance', async () => {
    // Different master key
    const differentKey = randomBytes(32).toString('base64');

    const provider1 = new LocalKMSProvider(testMasterKey);
    const provider2 = new LocalKMSProvider(differentKey);

    const { ciphertext } = await provider1.generateDataKey();

    // Should fail because master keys are different
    await expect(provider2.decrypt(ciphertext)).rejects.toThrow();
  });
});
