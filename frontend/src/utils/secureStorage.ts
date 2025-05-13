import { EncryptionKeys, generateKeyPair, keyToString, keyFromString } from './encryption';

const STORAGE_KEYS = {
  ENCRYPTION_ENABLED: 'encryption_enabled',
  PUBLIC_KEY: 'public_key',
  SECRET_KEY: 'secret_key',
  SERVER_PUBLIC_KEY: 'server_public_key'
} as const;

export const getEncryptionEnabled = (): boolean => {
  return localStorage.getItem(STORAGE_KEYS.ENCRYPTION_ENABLED) === 'true';
};

export const setEncryptionEnabled = (enabled: boolean): void => {
  localStorage.setItem(STORAGE_KEYS.ENCRYPTION_ENABLED, enabled.toString());
};

export const getOrGenerateKeys = (): EncryptionKeys => {
  const storedPublicKey = localStorage.getItem(STORAGE_KEYS.PUBLIC_KEY);
  const storedSecretKey = localStorage.getItem(STORAGE_KEYS.SECRET_KEY);

  if (storedPublicKey && storedSecretKey) {
    return {
      publicKey: keyFromString(storedPublicKey),
      secretKey: keyFromString(storedSecretKey)
    };
  }

  // Generate new keys if none exist
  const keys = generateKeyPair();
  localStorage.setItem(STORAGE_KEYS.PUBLIC_KEY, keyToString(keys.publicKey));
  localStorage.setItem(STORAGE_KEYS.SECRET_KEY, keyToString(keys.secretKey));
  return keys;
};

export const getServerPublicKey = (): Uint8Array | null => {
  const storedKey = localStorage.getItem(STORAGE_KEYS.SERVER_PUBLIC_KEY);
  return storedKey ? keyFromString(storedKey) : null;
};

export const setServerPublicKey = (key: Uint8Array): void => {
  localStorage.setItem(STORAGE_KEYS.SERVER_PUBLIC_KEY, keyToString(key));
};

export const clearEncryptionData = (): void => {
  localStorage.removeItem(STORAGE_KEYS.ENCRYPTION_ENABLED);
  localStorage.removeItem(STORAGE_KEYS.PUBLIC_KEY);
  localStorage.removeItem(STORAGE_KEYS.SECRET_KEY);
  localStorage.removeItem(STORAGE_KEYS.SERVER_PUBLIC_KEY);
}; 