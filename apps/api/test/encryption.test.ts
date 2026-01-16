import test from "node:test";
import assert from "node:assert/strict";
import { encryptToBase64, decryptFromBase64 } from "../src/utils/encryption";

// For test execution only (do not use this key in production)
process.env.CERT_ENCRYPTION_KEY =
  process.env.CERT_ENCRYPTION_KEY ?? Buffer.alloc(32, 7).toString("base64");

test("encrypt/decrypt round-trip", () => {
  const plain = Buffer.from("sensitive information", "utf-8");
  const enc = encryptToBase64(plain);
  assert.notEqual(enc, plain.toString("base64"));
  const dec = decryptFromBase64(enc);
  assert.equal(dec.toString("utf-8"), plain.toString("utf-8"));
});
