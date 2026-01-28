import CryptoJS from "crypto-js";

const CRYPTO_KEY = import.meta.env.VITE_CRYPTO_KEY as string;

if (!CRYPTO_KEY) {
  throw new Error("VITE_CRYPTO_KEY is not defined in environment variables");
}

const encrypt = <T>(data: T): string => {
  const stringified = JSON.stringify(data);

  return CryptoJS.AES.encrypt(stringified, CRYPTO_KEY).toString();
};

const decrypt = <T>(encryptedData: string): T => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, CRYPTO_KEY);
  const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

  if (!decryptedString) {
    throw new Error("Failed to decrypt data");
  }

  return JSON.parse(decryptedString) as T;
};

export {
  decrypt,
  encrypt
};
