import { CRYPTO_CONFIG } from './constants';
import { bufferToBase64, base64ToBuffer } from './utils';
import { generateFileKey, exportSymmetricKey, encryptSymmetricKey } from './keys';

export async function encryptFile(file: File, publicKey: CryptoKey): Promise<{ encryptedData: string; encryptedKey: string }> {
  try {
    // Generate a new symmetric key for this file
    const fileKey = await generateFileKey();
    
    // Generate a random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Read the file data
    const fileData = await file.arrayBuffer();

    // Encrypt the file data with the symmetric key
    const encryptedContent = await crypto.subtle.encrypt(
      {
        name: CRYPTO_CONFIG.ALGORITHM.name,
        iv
      },
      fileKey,
      fileData
    );

    // Combine IV and encrypted content
    const combined = new Uint8Array(iv.length + new Uint8Array(encryptedContent).length);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedContent), iv.length);

    // Encrypt the symmetric key with the user's public key
    const encryptedKey = await encryptSymmetricKey(fileKey, publicKey);

    return {
      encryptedData: bufferToBase64(combined),
      encryptedKey
    };
  } catch (error) {
    console.error('File encryption error:', error);
    throw new Error('Failed to encrypt file. Please try again.');
  }
}

export async function decryptFile(encryptedData: string, fileKey: CryptoKey): Promise<ArrayBuffer> {
  try {
    // Convert base64 to buffer
    const encrypted = base64ToBuffer(encryptedData);
    
    // Extract IV and content
    const iv = encrypted.slice(0, 12);
    const content = encrypted.slice(12);

    // Decrypt the content
    const decrypted = await crypto.subtle.decrypt(
      {
        name: CRYPTO_CONFIG.ALGORITHM.name,
        iv
      },
      fileKey,
      content
    );

    return decrypted;
  } catch (error) {
    console.error('File decryption error:', error);
    throw new Error('Failed to decrypt file. The file may be corrupted.');
  }
}