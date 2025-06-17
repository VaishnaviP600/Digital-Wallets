import * as argon2 from 'argon2-browser';
import { generateSalt } from './utils';

// Server-side pepper (keep this secret and consistent)
const PEPPER = 'secure_pepper_key_do_not_share';

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = generateSalt();
  const pepperedPassword = `${password}${PEPPER}`;
  
  const hash = await argon2.hash({
    pass: pepperedPassword,
    salt,
    type: argon2.ArgonType.Argon2id,
    time: 3, // Number of iterations
    mem: 64 * 1024, // Memory usage in KiB
    parallelism: 4,
    hashLen: 32 // Output hash length
  });

  return {
    hash: hash.encoded,
    salt: Buffer.from(salt).toString('base64')
  };
}

export async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string
): Promise<boolean> {
  try {
    const salt = Buffer.from(storedSalt, 'base64');
    const pepperedPassword = `${password}${PEPPER}`;

    const verified = await argon2.verify({
      pass: pepperedPassword,
      encoded: storedHash,
      type: argon2.ArgonType.Argon2id
    });

    return verified;
  } catch (error) {
    console.error('Password verification failed:', error);
    return false;
  }
}