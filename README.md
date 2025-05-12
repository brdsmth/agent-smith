# Agent Smith - Open Source LLM Deployment Platform

A modern, scalable platform for deploying and interacting with Large Language Models (LLMs). This project provides both a REST API and a beautiful chat interface for interacting with your deployed LLM.

## Features

- 🚀 Fast and scalable API built with Go and Gin
- 💬 Modern, responsive chat interface built with React and TypeScript
- 🔒 Secure API key management
- 📊 Request logging and monitoring
- 🎯 Support for multiple LLM backends (currently Ollama)
- 🔄 Streaming responses for real-time chat
- 🛠️ Easy deployment with Docker

## Project Structure

```
agent-smith/
├── api/                 # Go backend
│   ├── llm/            # LLM interface and implementations
│   ├── main.go         # Main server code
│   └── Dockerfile      # Backend container definition
├── frontend/           # React frontend
│   ├── src/           # Source code
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

### Production Deployment

1. Build and run with Docker Compose:
   ```bash
   docker-compose up --build
   ```

## API Documentation

The API follows the OpenAI-compatible format:

### Endpoints

- `GET /health` - Health check endpoint
- `GET /v1/models` - List available models
- `POST /v1/chat/completions` - Chat completion endpoint

### Chat Completion Request Format

```json
{
  "messages": [
    {"role": "user", "content": "Hello"}
  ],
  "model": "mistral",
  "temperature": 0.7,
  "max_tokens": 2048
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 