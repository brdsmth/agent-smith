# Agent Smith - Open Source LLM Deployment Platform

A modern, scalable platform for deploying and interacting with Large Language Models (LLMs). This project provides both a REST API and a beautiful chat interface for interacting with your deployed LLM.

## Features

- 🚀 Fast and scalable API built with Go and Gin
- 💬 Modern, responsive chat interface built with React and TypeScript
- 🔒 End-to-end encryption support using NaCl
- 🔑 Public key cryptography for secure message exchange
- 🎯 Support for multiple LLM backends (currently Ollama)
- 🔄 Streaming responses for real-time chat
- 🛠️ Easy deployment with Docker

## Project Structure

```
agent-smith/
├── api/                 # Go backend
│   ├── llm/            # LLM interface and implementations
│   ├── encryption/     # Encryption utilities and key management
│   ├── main.go         # Main server code
│   └── Dockerfile      # Backend container definition
├── frontend/           # React frontend
│   ├── src/           
│   │   ├── utils/     # Frontend utilities including encryption
│   │   └── components/ # React components
│   ├── public/        # Static assets
│   └── Dockerfile     # Frontend container definition
├── docker-compose.yml  # Development and production setup
└── README.md          # This file
```

## Getting Started

### Prerequisites

- Go 1.21+
- Node.js 18+
- Docker and Docker Compose
- Ollama (for running LLMs locally)

### Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/agent-smith.git
   cd agent-smith
   ```

2. Install and start Ollama:
   ```bash
   # Install Ollama from https://ollama.ai/
   
   # Start Ollama service
   ollama serve
   
   # Pull the Mistral model
   ollama pull mistral
   ```

3. Set up the backend:
   ```bash
   cd api
   go mod download
   go run main.go
   ```

4. Set up the frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Security Features

#### End-to-End Encryption

The platform supports optional end-to-end encryption for all chat messages:

- Uses TweetNaCl (in browser) and NaCl (on server) for cryptographic operations
- Implements public key cryptography for secure message exchange
- Each session generates new keypairs for maximum security
- Messages are encrypted with unique nonces to prevent replay attacks

To enable encryption:
1. Open Settings in the chat interface
2. Toggle "Enable End-to-End Encryption"
3. The system will automatically handle key exchange and message encryption

## API Documentation

The API follows the OpenAI-compatible format with additional security endpoints:

### Endpoints

- `GET /health` - Health check endpoint
- `GET /v1/models` - List available models
- `POST /v1/chat/completions` - Standard chat completion endpoint
- `GET /v1/security/public-key` - Get server's public key for encryption
- `POST /v1/chat/completions/secure` - Encrypted chat completion endpoint

### Secure Chat Request Format

```json
{
  "messages": [
    {
      "role": "user",
      "content": {
        "encrypted": "base64_encrypted_content",
        "nonce": "base64_nonce"
      }
    }
  ],
  "model": "mistral",
  "temperature": 0.7,
  "max_tokens": 2048
}
```

## TODO

### Security Enhancements
- [ ] Implement persistent storage for server keypairs
- [ ] Add key rotation mechanism
- [ ] Implement perfect forward secrecy
- [ ] Add signature verification for message integrity
- [ ] Add encryption for model responses metadata

### Feature Improvements
- [ ] Add streaming support for encrypted messages
- [ ] Implement chat history encryption
- [ ] Add support for encrypted file uploads
- [ ] Add session management and authentication
- [ ] Implement secure model fine-tuning endpoints

### Performance Optimizations
- [ ] Implement message batching for encrypted requests
- [ ] Add caching layer for public key exchange
- [ ] Optimize encryption/decryption operations
- [ ] Add compression for encrypted payloads

### Developer Experience
- [ ] Add encryption testing utilities
- [ ] Improve error messages for encryption failures
- [ ] Add debugging tools for encrypted messages
- [ ] Create documentation for security features
- [ ] Add encryption status indicators in UI

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 