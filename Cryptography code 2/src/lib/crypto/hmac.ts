import { CRYPTO_CONFIG } from './constants';

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(CRYPTO_CONFIG.SECRET_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, data);
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

export async function verifyPassword(storedHash: string, inputPassword: string): Promise<boolean> {
  const newHash = await hashPassword(inputPassword);
  return storedHash === newHash;
}