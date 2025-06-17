import { CRYPTO_CONFIG } from './constants';
import { bufferToBase64, base64ToBuffer } from './utils';

// Generate RSA key pair
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    },
    true,
    ['encrypt', 'decrypt']
  );
}

// Export public key
export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('spki', key);
  return bufferToBase64(exported);
}

// Export private key
export async function exportPrivateKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('pkcs8', key);
  return bufferToBase64(exported);
}

// Import public key
export async function importPublicKey(keyData: string): Promise<CryptoKey> {
  const binaryKey = base64ToBuffer(keyData);
  return await crypto.subtle.importKey(
    'spki',
    binaryKey,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256'
    },
    true,
    ['encrypt']
  );
}

// Import private key
export async function importPrivateKey(keyData: string): Promise<CryptoKey> {
  const binaryKey = base64ToBuffer(keyData);
  return await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256'
    },
    true,
    ['decrypt']
  );
}

// Generate master key (for backward compatibility)
export async function generateMasterKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );
}

// Export key (for backward compatibility)
export async function exportKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key);
  return bufferToBase64(exported);
}

// Import key (for backward compatibility)
export async function importKey(keyData: string): Promise<CryptoKey> {
  const binaryKey = base64ToBuffer(keyData);
  return await crypto.subtle.importKey(
    'raw',
    binaryKey,
    'AES-GCM',
    true,
    ['encrypt', 'decrypt']
  );
}

// Generate symmetric key for file encryption
export async function generateFileKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );
}

// Export symmetric key
export async function exportSymmetricKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('raw', key);
  return bufferToBase64(exported);
}

// Import symmetric key
export async function importSymmetricKey(keyData: string): Promise<CryptoKey> {
  const binaryKey = base64ToBuffer(keyData);
  return await crypto.subtle.importKey(
    'raw',
    binaryKey,
    'AES-GCM',
    true,
    ['encrypt', 'decrypt']
  );
}

// Encrypt symmetric key with public key
export async function encryptSymmetricKey(
  symmetricKey: CryptoKey,
  publicKey: CryptoKey
): Promise<string> {
  const exportedKey = await exportSymmetricKey(symmetricKey);
  const encryptedKey = await crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP'
    },
    publicKey,
    new TextEncoder().encode(exportedKey)
  );
  return bufferToBase64(encryptedKey);
}

// Decrypt symmetric key with private key
export async function decryptSymmetricKey(
  encryptedKey: string,
  privateKey: CryptoKey
): Promise<CryptoKey> {
  const binaryEncryptedKey = base64ToBuffer(encryptedKey);
  const decryptedKeyData = await crypto.subtle.decrypt(
    {
      name: 'RSA-OAEP'
    },
    privateKey,
    binaryEncryptedKey
  );
  const keyData = new TextDecoder().decode(decryptedKeyData);
  return await importSymmetricKey(keyData);
}