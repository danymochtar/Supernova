import { randomBytes } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { decrypt, decryptJson, encrypt, encryptJson } from '../aes';

let originalKey: string | undefined;

beforeAll(() => {
  originalKey = process.env.DATA_ENCRYPTION_KEY;
  process.env.DATA_ENCRYPTION_KEY = randomBytes(32).toString('base64');
});

afterAll(() => {
  if (originalKey === undefined) delete process.env.DATA_ENCRYPTION_KEY;
  else process.env.DATA_ENCRYPTION_KEY = originalKey;
});

describe('aes-256-gcm envelope', () => {
  it('round-trips a plaintext string', () => {
    const plaintext = 'Dany Pratama';
    const env = encrypt(plaintext);
    expect(env.startsWith('v1:')).toBe(true);
    expect(env.split(':')).toHaveLength(4);
    expect(decrypt(env)).toBe(plaintext);
  });

  it('round-trips JSON', () => {
    const dob = { year: 1992, month: 11, day: 22 };
    const env = encryptJson(dob);
    expect(decryptJson<typeof dob>(env)).toEqual(dob);
  });

  it('produces different ciphertexts for the same plaintext (random IV)', () => {
    const a = encrypt('hello');
    const b = encrypt('hello');
    expect(a).not.toBe(b);
  });

  it('rejects a tampered ciphertext', () => {
    const env = encrypt('secret');
    const parts = env.split(':');
    // Flip a bit in the ciphertext segment
    const ct = Buffer.from(parts[3]!, 'base64');
    ct[0]! ^= 0x01;
    parts[3] = ct.toString('base64');
    expect(() => decrypt(parts.join(':'))).toThrow();
  });

  it('rejects an unknown version', () => {
    expect(() => decrypt('v9:a:b:c')).toThrow(/version/);
  });

  it('rejects a malformed envelope', () => {
    expect(() => decrypt('not-an-envelope')).toThrow(/envelope/);
  });
});
