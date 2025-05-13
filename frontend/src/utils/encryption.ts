import { box, randomBytes } from 'tweetnacl';
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Types for our encryption state
export interface EncryptionKeys {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export interface EncryptedMessage {
  encrypted: string;  // Base64 encoded encrypted message
  nonce: string;     // Base64 encoded nonce
}

// Generate a new keypair for encryption
export const generateKeyPair = (): EncryptionKeys => {
  const keypair = box.keyPair();
  return {
    publicKey: keypair.publicKey,
    secretKey: keypair.secretKey
  };
};

// Encrypt a message using the recipient's public key and sender's secret key
export const encryptMessage = (
  message: string,
  recipientPublicKey: Uint8Array,
  senderSecretKey: Uint8Array
): EncryptedMessage => {
  const messageUint8 = decodeUTF8(message);
  const nonce = randomBytes(box.nonceLength);
  const encryptedMessage = box(
    messageUint8,
    nonce,
    recipientPublicKey,
    senderSecretKey
  );

  return {
    encrypted: encodeBase64(encryptedMessage),
    nonce: encodeBase64(nonce)
  };
};

// Decrypt a message using the recipient's secret key and sender's public key
export const decryptMessage = (
  encryptedMessage: EncryptedMessage,
  senderPublicKey: Uint8Array,
  recipientSecretKey: Uint8Array
): string => {
  const decryptedMessage = box.open(
    decodeBase64(encryptedMessage.encrypted),
    decodeBase64(encryptedMessage.nonce),
    senderPublicKey,
    recipientSecretKey
  );

  if (!decryptedMessage) {
    throw new Error('Failed to decrypt message');
  }

  return encodeUTF8(decryptedMessage);
};

// Helper to convert keys to/from string format for storage
export const keyToString = (key: Uint8Array): string => {
  return encodeBase64(key);
};

export const keyFromString = (keyStr: string): Uint8Array => {
  return decodeBase64(keyStr);
};

// Encrypt an entire chat message object
export const encryptChatMessage = (
  message: Message,
  recipientPublicKey: Uint8Array,
  senderSecretKey: Uint8Array
): { role: 'user' | 'assistant' | 'system'; content: EncryptedMessage } => {
  const encrypted = encryptMessage(
    message.content,
    recipientPublicKey,
    senderSecretKey
  );

  return {
    role: message.role,
    content: encrypted
  };
};

// Decrypt an encrypted chat message object
export const decryptChatMessage = (
  message: { role: 'user' | 'assistant' | 'system'; content: EncryptedMessage },
  senderPublicKey: Uint8Array,
  recipientSecretKey: Uint8Array
): Message => {
  const decrypted = decryptMessage(
    message.content,
    senderPublicKey,
    recipientSecretKey
  );

  return {
    role: message.role,
    content: decrypted
  };
}; 