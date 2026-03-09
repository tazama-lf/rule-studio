import * as CryptoJS from 'crypto-js';

/**
 * Decrypts data that was encrypted using AES.
 * @param encryptedData The data to decrypt.
 * @returns The decrypted data as a string.
 * @throws Error if the secret key is not found in environment variables.
 */
export const decryptData = (encryptedData: string): string => {
  const secretKey = process.env.CRYPTO_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Secret key not found in environment variables.');
  }
  const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
  const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
  return decryptedData;
};
