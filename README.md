# Agent Smith - Open Source LLM Deployment Platform

A modern, scalable platform for deploying and interacting with Large Language Models (LLMs). This project provides both a REST API and a beautiful chat interface for interacting with your deployed LLM.

## Features

- 🚀 Fast and scalable API built with FastAPI
- 💬 Modern, responsive chat interface built with React and TypeScript
- 🔒 Secure API key management
- 📊 Request logging and monitoring
- 🎯 Support for multiple LLM backends
- 🔄 Streaming responses for real-time chat
- 🛠️ Easy deployment with Docker

## Project Structure

```
agent-smith/
├── api/                 # FastAPI backend
│   ├── app/            # Main application code
│   ├── tests/          # Backend tests
│   └── Dockerfile      # Backend container definition
├── frontend/                # React frontend
│   ├── src/           # Source code
│   ├── public/        # Static assets
│   └── Dockerfile     # Frontend container definition
├── docker-compose.yml  # Development and production setup
└── README.md          # This file
```

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- Docker and Docker Compose
- An LLM model (e.g., LLaMA, Mistral, etc.)

### Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/agent-smith.git
   cd agent-smith
   ```

2. Set up the backend:
   ```bash
   cd api
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Set up the frontend:
   ```bash
   cd frontend
   npm install
   ```

4. Start the development servers:
   ```bash
   # Terminal 1 (Backend)
   cd api
   uvicorn app.main:app --reload

   # Terminal 2 (Frontend)
   cd frontend
   npm run dev
   ```

### Production Deployment

1. Build and run with Docker Compose:
   ```bash
   docker-compose up --build
   ```

## API Documentation

Once the server is running, visit:
- API Documentation: http://localhost:8000/docs
- Chat Interface: http://localhost:3000

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 