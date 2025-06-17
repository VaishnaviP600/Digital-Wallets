export type EncryptionAlgorithm = 'AES' | 'caesar' | 'vigenere' | 'base64';

// AES Encryption
async function aesEncrypt(text: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encoder.encode(text)
  );

  const combined = new Uint8Array(salt.length + iv.length + new Uint8Array(encrypted).length);
  combined.set(salt);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  return btoa(String.fromCharCode(...combined));
}

async function aesDecrypt(encryptedText: string, key: string): Promise<string> {
  const combined = new Uint8Array(atob(encryptedText).split('').map(c => c.charCodeAt(0)));
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const data = combined.slice(28);

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    data
  );

  return new TextDecoder().decode(decrypted);
}

// Caesar Cipher
function caesarCipher(text: string, shift: number, decrypt = false): string {
  return text
    .split('')
    .map(char => {
      if (char.match(/[a-z]/i)) {
        const code = char.charCodeAt(0);
        const isUpperCase = code >= 65 && code <= 90;
        const base = isUpperCase ? 65 : 97;
        const finalShift = decrypt ? -shift : shift;
        return String.fromCharCode(
          ((code - base + finalShift + 26) % 26) + base
        );
      }
      return char;
    })
    .join('');
}

// Vigenère Cipher
function vigenereProcess(text: string, key: string, decrypt = false): string {
  const fullKey = key.repeat(Math.ceil(text.length / key.length)).slice(0, text.length);
  return text
    .split('')
    .map((char, i) => {
      if (char.match(/[a-z]/i)) {
        const charCode = char.charCodeAt(0);
        const keyChar = fullKey[i].toLowerCase();
        const keyShift = keyChar.charCodeAt(0) - 97;
        const isUpperCase = charCode >= 65 && charCode <= 90;
        const base = isUpperCase ? 65 : 97;
        const shift = decrypt ? -keyShift : keyShift;
        return String.fromCharCode(
          ((charCode - base + shift + 26) % 26) + base
        );
      }
      return char;
    })
    .join('');
}

// Base64 Encoding/Decoding
function base64Encode(text: string): string {
  return btoa(text);
}

function base64Decode(text: string): string {
  try {
    return atob(text);
  } catch (error) {
    throw new Error('Invalid Base64 string');
  }
}

export async function encryptText(
  text: string,
  algorithm: EncryptionAlgorithm,
  key: string
): Promise<string> {
  switch (algorithm) {
    case 'AES':
      return aesEncrypt(text, key);
    case 'caesar':
      const shift = parseInt(key) || 3;
      return caesarCipher(text, shift);
    case 'vigenere':
      if (!key.match(/^[a-zA-Z]+$/)) {
        throw new Error('Vigenère key must contain only letters');
      }
      return vigenereProcess(text, key, false);
    case 'base64':
      return base64Encode(text);
    default:
      throw new Error('Unsupported algorithm');
  }
}

export async function decryptText(
  text: string,
  algorithm: EncryptionAlgorithm,
  key: string
): Promise<string> {
  switch (algorithm) {
    case 'AES':
      return aesDecrypt(text, key);
    case 'caesar':
      const shift = parseInt(key) || 3;
      return caesarCipher(text, shift, true);
    case 'vigenere':
      if (!key.match(/^[a-zA-Z]+$/)) {
        throw new Error('Vigenère key must contain only letters');
      }
      return vigenereProcess(text, key, true);
    case 'base64':
      return base64Decode(text);
    default:
      throw new Error('Unsupported algorithm');
  }
}