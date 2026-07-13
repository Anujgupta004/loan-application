// ============================================================
// AES-256-GCM Encryption using Web Crypto API
// For encrypting PII data in LocalStorage auto-save
// ============================================================

const PASSPHRASE = 'LendSwift_AutoSave_Key_2024_v1';
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

// Works in browser (window.crypto) and Node 18+ (globalThis.crypto)
const cryptoApi = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;

/**
 * Derive a CryptoKey from passphrase using PBKDF2
 */
async function deriveKey(salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await cryptoApi.subtle.importKey(
    'raw',
    encoder.encode(PASSPHRASE),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return cryptoApi.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Convert ArrayBuffer to Base64 string
 */
function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const b64fn = typeof window !== 'undefined' ? window.btoa : globalThis.btoa;
  return b64fn(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 */
function base64ToBuffer(base64) {
  const atobFn = typeof window !== 'undefined' ? window.atob : globalThis.atob;
  const binary = atobFn(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Encrypt a string using AES-256-GCM
 * @param {string} plaintext
 * @returns {Promise<string>} encrypted base64 string with salt+iv prepended
 */
export async function encrypt(plaintext) {
  try {
    const encoder = new TextEncoder();
    const salt = cryptoApi.getRandomValues(new Uint8Array(16));
    const iv = cryptoApi.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(salt);

    const encrypted = await cryptoApi.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      encoder.encode(plaintext)
    );

    // Combine: salt (16) + iv (12) + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    return bufferToBase64(combined.buffer);
  } catch (error) {
    console.error('Encryption failed:', error);
    return null;
  }
}

/**
 * Decrypt an AES-256-GCM encrypted string
 * @param {string} encryptedBase64
 * @returns {Promise<string|null>} decrypted plaintext or null on failure
 */
export async function decrypt(encryptedBase64) {
  try {
    const combined = new Uint8Array(base64ToBuffer(encryptedBase64));

    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encrypted = combined.slice(28);

    const key = await deriveKey(salt);

    const decrypted = await cryptoApi.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      encrypted
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}
