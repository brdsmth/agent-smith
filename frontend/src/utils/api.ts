import { getEncryptionEnabled, getOrGenerateKeys, getServerPublicKey } from './secureStorage';
import { encryptChatMessage, decryptChatMessage } from './encryption';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: Message[];
  model: string;
  temperature: number;
  max_tokens: number;
}

interface ChatResponse {
  choices: Array<{
    message: Message;
  }>;
}

const API_BASE_URL = 'http://localhost:8000';

export const sendChatMessage = async (request: ChatRequest): Promise<ChatResponse> => {
  const isEncryptionEnabled = getEncryptionEnabled();
  
  if (!isEncryptionEnabled) {
    // Send unencrypted request
    const response = await fetch(`${API_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Get encryption keys
  const clientKeys = getOrGenerateKeys();
  const serverPublicKey = getServerPublicKey();

  if (!serverPublicKey) {
    throw new Error('Server public key not found. Please check your encryption settings.');
  }

  // Encrypt each message in the request
  const encryptedMessages = request.messages.map(msg => 
    encryptChatMessage(msg, serverPublicKey, clientKeys.secretKey)
  );

  // Send encrypted request
  const response = await fetch(`${API_BASE_URL}/v1/chat/completions/secure`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Public-Key': encodeBase64(clientKeys.publicKey)
    },
    body: JSON.stringify({
      ...request,
      messages: encryptedMessages
    })
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  const encryptedResponse = await response.json();

  // Decrypt the response message
  const decryptedMessage = decryptChatMessage(
    encryptedResponse.choices[0].message,
    serverPublicKey,
    clientKeys.secretKey
  );

  return {
    ...encryptedResponse,
    choices: [{
      ...encryptedResponse.choices[0],
      message: decryptedMessage
    }]
  };
};

// Function to fetch server's public key
export const fetchServerPublicKey = async (): Promise<Uint8Array> => {
  const response = await fetch(`${API_BASE_URL}/v1/security/public-key`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch server public key');
  }

  const { publicKey } = await response.json();
  return decodeBase64(publicKey);
}; 