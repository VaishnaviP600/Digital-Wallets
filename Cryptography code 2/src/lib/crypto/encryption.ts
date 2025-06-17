import { CRYPTO_CONFIG } from './constants';
import { str2ab, bufferToBase64, base64ToBuffer } from './utils';

export async function encryptPassword(password: string, key: CryptoKey): Promise<string> {
  try {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedPassword = str2ab(password);

    const encryptedContent = await crypto.subtle.encrypt(
      {
        name: CRYPTO_CONFIG.ALGORITHM.name,
        iv
      },
      key,
      encodedPassword
    );

    // Combine IV and encrypted content
    const combined = new Uint8Array(iv.length + new Uint8Array(encryptedContent).length);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedContent), iv.length);

    return bufferToBase64(combined);
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt password');
  }
}

export async function decryptPassword(encryptedData: string, key: CryptoKey): Promise<string> {
  try {
    const encrypted = base64ToBuffer(encryptedData);
    
    // Extract IV and encrypted content
    const iv = encrypted.slice(0, 12);
    const content = encrypted.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: CRYPTO_CONFIG.ALGORITHM.name,
        iv
      },
      key,
      content
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt password');
  }
}