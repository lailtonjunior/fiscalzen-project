import { describe, it, expect, beforeEach } from 'vitest';
import { randomBytes } from 'crypto';
import {
  EnvelopeEncryption,
  generateKek,
  deriveKekFromPassword,
  secureCompare,
} from '../src/envelope-encryption';

describe('EnvelopeEncryption', () => {
  let encryption: EnvelopeEncryption;
  let kek: Buffer;

  beforeEach(() => {
    encryption = new EnvelopeEncryption();
    kek = generateKek();
  });

  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt data correctly', async () => {
      const originalData = Buffer.from('Hello, World! This is sensitive data.');

      const encrypted = await encryption.encrypt(originalData, kek);
      const decrypted = await encryption.decrypt(encrypted, kek);

      expect(decrypted.toString()).toBe(originalData.toString());
    });

    it('should encrypt large data correctly', async () => {
      const originalData = randomBytes(10 * 1024); // 10KB

      const encrypted = await encryption.encrypt(originalData, kek);
      const decrypted = await encryption.decrypt(encrypted, kek);

      expect(decrypted.equals(originalData)).toBe(true);
    });

    it('should produce different ciphertext for same data', async () => {
      const originalData = Buffer.from('Same data');

      const encrypted1 = await encryption.encrypt(originalData, kek);
      const encrypted2 = await encryption.encrypt(originalData, kek);

      // IV e DEK são diferentes, então ciphertext deve ser diferente
      expect(encrypted1.ciphertext.equals(encrypted2.ciphertext)).toBe(false);
    });

    it('should fail to decrypt with wrong KEK', async () => {
      const originalData = Buffer.from('Sensitive data');
      const wrongKek = generateKek();

      const encrypted = await encryption.encrypt(originalData, kek);

      await expect(encryption.decrypt(encrypted, wrongKek)).rejects.toThrow();
    });

    it('should include version in envelope', async () => {
      const originalData = Buffer.from('Test data');

      const encrypted = await encryption.encrypt(originalData, kek);

      expect(encrypted.version).toBe(1);
    });
  });

  describe('serialize/deserialize', () => {
    it('should serialize and deserialize envelope correctly', async () => {
      const originalData = Buffer.from('Data to serialize');

      const encrypted = await encryption.encrypt(originalData, kek);
      const serialized = encryption.serialize(encrypted);
      const deserialized = encryption.deserialize(serialized);

      expect(deserialized.version).toBe(encrypted.version);
      expect(deserialized.iv.equals(encrypted.iv)).toBe(true);
      expect(deserialized.authTag.equals(encrypted.authTag)).toBe(true);
      expect(deserialized.ciphertext.equals(encrypted.ciphertext)).toBe(true);
      expect(deserialized.encryptedDek.equals(encrypted.encryptedDek)).toBe(true);
    });

    it('should produce base64 serialized data', async () => {
      const originalData = Buffer.from('Test');

      const encrypted = await encryption.encrypt(originalData, kek);
      const serialized = encryption.serialize(encrypted);

      // Verificar que é base64 válido
      expect(() => Buffer.from(serialized.data, 'base64')).not.toThrow();
    });

    it('should decrypt after serialize/deserialize round-trip', async () => {
      const originalData = Buffer.from('Round-trip test data');

      const encrypted = await encryption.encrypt(originalData, kek);
      const serialized = encryption.serialize(encrypted);
      const deserialized = encryption.deserialize(serialized);
      const decrypted = await encryption.decrypt(deserialized, kek);

      expect(decrypted.toString()).toBe(originalData.toString());
    });
  });

  describe('reencrypt', () => {
    it('should reencrypt with new KEK', async () => {
      const originalData = Buffer.from('Data to reencrypt');
      const newKek = generateKek();

      const encrypted = await encryption.encrypt(originalData, kek);
      const reencrypted = await encryption.reencrypt(encrypted, kek, newKek);

      // Dados não devem mudar
      expect(reencrypted.ciphertext.equals(encrypted.ciphertext)).toBe(true);
      expect(reencrypted.iv.equals(encrypted.iv)).toBe(true);
      expect(reencrypted.authTag.equals(encrypted.authTag)).toBe(true);

      // DEK criptografado deve mudar
      expect(reencrypted.encryptedDek.equals(encrypted.encryptedDek)).toBe(false);

      // Deve decriptar com nova KEK
      const decrypted = await encryption.decrypt(reencrypted, newKek);
      expect(decrypted.toString()).toBe(originalData.toString());

      // Não deve decriptar com KEK antiga
      await expect(encryption.decrypt(reencrypted, kek)).rejects.toThrow();
    });
  });

  describe('KEK validation', () => {
    it('should reject KEK with wrong size', async () => {
      const shortKek = randomBytes(16);
      const data = Buffer.from('Test');

      await expect(encryption.encrypt(data, shortKek)).rejects.toThrow(
        'KEK deve ter 32 bytes'
      );
    });

    it('should reject non-buffer KEK', async () => {
      const data = Buffer.from('Test');

      await expect(
        encryption.encrypt(data, 'not-a-buffer' as any)
      ).rejects.toThrow('KEK deve ser um Buffer');
    });
  });
});

describe('Helper Functions', () => {
  describe('generateKek', () => {
    it('should generate 32-byte KEK', () => {
      const kek = generateKek();
      expect(kek.length).toBe(32);
    });

    it('should generate unique KEKs', () => {
      const kek1 = generateKek();
      const kek2 = generateKek();
      expect(kek1.equals(kek2)).toBe(false);
    });
  });

  describe('deriveKekFromPassword', () => {
    it('should derive consistent KEK from password', () => {
      const password = 'test-password-123';
      const salt = 'test-salt';

      const kek1 = deriveKekFromPassword(password, salt);
      const kek2 = deriveKekFromPassword(password, salt);

      expect(kek1.equals(kek2)).toBe(true);
    });

    it('should derive different KEK for different passwords', () => {
      const salt = 'test-salt';

      const kek1 = deriveKekFromPassword('password1', salt);
      const kek2 = deriveKekFromPassword('password2', salt);

      expect(kek1.equals(kek2)).toBe(false);
    });

    it('should derive different KEK for different salts', () => {
      const password = 'test-password';

      const kek1 = deriveKekFromPassword(password, 'salt1');
      const kek2 = deriveKekFromPassword(password, 'salt2');

      expect(kek1.equals(kek2)).toBe(false);
    });

    it('should derive 32-byte KEK', () => {
      const kek = deriveKekFromPassword('password', 'salt');
      expect(kek.length).toBe(32);
    });
  });

  describe('secureCompare', () => {
    it('should return true for equal buffers', () => {
      const a = Buffer.from('test');
      const b = Buffer.from('test');
      expect(secureCompare(a, b)).toBe(true);
    });

    it('should return false for different buffers', () => {
      const a = Buffer.from('test1');
      const b = Buffer.from('test2');
      expect(secureCompare(a, b)).toBe(false);
    });

    it('should return false for different length buffers', () => {
      const a = Buffer.from('test');
      const b = Buffer.from('longer-test');
      expect(secureCompare(a, b)).toBe(false);
    });
  });
});
