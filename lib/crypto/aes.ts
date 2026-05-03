import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * AES-256-GCM encryption with a versioned envelope.
 *
 * Format: "v1:<iv_b64>:<tag_b64>:<ciphertext_b64>"
 *
 * The version prefix lets us rotate keys later without breaking existing rows:
 * future ciphertexts can be tagged "v2:..." and the decrypt path can dispatch
 * by version.
 *
 * Key: 32 bytes (256 bits), provided as base64 in DATA_ENCRYPTION_KEY.
 */

const ALGO = 'aes-256-gcm';
const IV_LEN = 12; // GCM standard
const KEY_LEN = 32;

function getKey(): Buffer {
  const raw = process.env.DATA_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('DATA_ENCRYPTION_KEY is not set');
  }
  const key = Buffer.from(raw, 'base64');
  if (key.length !== KEY_LEN) {
    throw new Error(`DATA_ENCRYPTION_KEY must decode to ${KEY_LEN} bytes (got ${key.length})`);
  }
  return key;
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64'), tag.toString('base64'), ct.toString('base64')].join(':');
}

export function decrypt(envelope: string): string {
  const parts = envelope.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted envelope');
  }
  const [version, ivB64, tagB64, ctB64] = parts as [string, string, string, string];
  if (version !== 'v1') {
    throw new Error(`Unsupported encryption version: ${version}`);
  }
  const key = getKey();
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const ct = Buffer.from(ctB64, 'base64');
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString('utf8');
}

export function encryptJson<T>(value: T): string {
  return encrypt(JSON.stringify(value));
}

export function decryptJson<T>(envelope: string): T {
  return JSON.parse(decrypt(envelope)) as T;
}
