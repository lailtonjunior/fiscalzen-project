import crypto from "crypto";

/**
 * AES-256-GCM symmetric encryption helpers.
 *
 * Required env var:
 *   CERT_ENCRYPTION_KEY: base64-encoded 32 bytes (256-bit) key.
 *
 * Storage format (binary):
 *   [ iv(12) | tag(16) | ciphertext(N) ]
 *
 * Notes:
 * - This is intentionally simple and self-contained.
 * - In production, prefer a KMS/Vault to manage keys and rotation.
 */
const KEY_B64 = process.env.CERT_ENCRYPTION_KEY;

function loadKey(): Buffer {
  if (!KEY_B64) {
    throw new Error(
      "Missing CERT_ENCRYPTION_KEY. Provide a base64-encoded 32-byte key in the environment."
    );
  }
  const key = Buffer.from(KEY_B64, "base64");
  if (key.length !== 32) {
    throw new Error(
      `Invalid CERT_ENCRYPTION_KEY length: expected 32 bytes, got ${key.length}.`
    );
  }
  return key;
}

const IV_LEN = 12; // recommended for GCM
const TAG_LEN = 16;

export function encryptToBuffer(plain: Buffer): Buffer {
  const key = loadKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, ciphertext]);
}

export function decryptFromBuffer(payload: Buffer): Buffer {
  if (payload.length < IV_LEN + TAG_LEN + 1) {
    throw new Error("Invalid encrypted payload.");
  }

  const key = loadKey();
  const iv = payload.subarray(0, IV_LEN);
  const tag = payload.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ciphertext = payload.subarray(IV_LEN + TAG_LEN);

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export function encryptToBase64(plain: Buffer): string {
  return encryptToBuffer(plain).toString("base64");
}

export function decryptFromBase64(payloadB64: string): Buffer {
  return decryptFromBuffer(Buffer.from(payloadB64, "base64"));
}

export function sha256Hex(data: Buffer | string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}
