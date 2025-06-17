export const CRYPTO_CONFIG = {
  ALGORITHM: {
    name: 'AES-GCM',
    length: 256
  },
  KEY_USAGE: ['encrypt', 'decrypt'] as KeyUsage[],
  IV_LENGTH: 12,
  SALT_LENGTH: 16,
  // Server-side secret key (in production, this should be stored securely)
  SECRET_KEY: 'your-secure-hmac-secret-key-min-32-bytes-long!'
} as const;