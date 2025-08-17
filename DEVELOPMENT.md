# Persian AI Chatbot - Development Guide

This guide explains how to set up and run the Persian AI Chatbot development environment with both backend (FastAPI) and frontend (Next.js) services.

## 🚀 Quick Start

### Option 1: Automatic Setup (Recommended)
```bash
# Cross-platform Python script (works on Windows/Mac/Linux)
python dev-start.py
```

### Option 2: Platform-Specific Scripts

**Linux/Mac:**
```bash
chmod +x dev-start.sh
./dev-start.sh
```

**Windows:**
```cmd
dev-start.bat
```

### Option 3: Docker Development
```bash
# Start with Docker Compose
npm run dev:docker

# Stop Docker services
npm run dev:docker:down
```

### Option 4: NPM Scripts
```bash
# Install all dependencies
npm run setup

# Start development servers
npm run dev
```

## 📋 Prerequisites

### Required Software
- **Python 3.8+** - For backend API server
- **Node.js 18+** - For frontend development
- **npm or Yarn** - Package manager for frontend
- **Git** - Version control

### Optional
- **Docker & Docker Compose** - For containerized development

## 🛠️ Manual Setup

If you prefer to set up manually:

### 1. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Linux/Mac:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
# Edit .env with your API keys

# Start backend server
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install
# or
yarn install

# Create environment file
cp .env.example .env.local
# Edit .env.local with your configuration

# Start frontend server
npm run dev
# or
yarn dev
```

## 🌐 Development URLs

Once both services are running:

- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **API Redoc**: http://localhost:8000/redoc

## 📁 Project Structure

```
persian-ai-chatbot/
├── backend/                 # FastAPI backend
│   ├── main.py             # Main application entry
│   ├── requirements.txt    # Python dependencies
│   ├── .env               # Backend environment variables
│   └── venv/              # Python virtual environment
├── frontend/               # Next.js frontend
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   ├── hooks/            # Custom React hooks
│   ├── package.json      # Node.js dependencies
│   ├── .env.local        # Frontend environment variables
│   └── node_modules/     # Node.js packages
├── dev-start.py          # Cross-platform development script
├── dev-start.sh          # Unix development script
├── dev-start.bat         # Windows development script
├── docker-compose.dev.yml # Docker development setup
└── package.json          # Root package.json with scripts
```

## 🔧 Environment Configuration

### Backend (.env)
```env
NODE_ENV=development
DEBUG=true
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000

# Add your API keys
OPENAI_API_KEY=your_openai_key_here
HUGGINGFACE_API_KEY=your_huggingface_key_here
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/chat
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
```

## 🐳 Docker Development

### Start Development Environment
```bash
# Build and start services
docker-compose -f docker-compose.dev.yml up --build

# Start in background
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

### Stop Development Environment
```bash
# Stop and remove containers
docker-compose -f docker-compose.dev.yml down

# Stop and remove containers + volumes
docker-compose -f docker-compose.dev.yml down -v
```

## 📦 Available NPM Scripts

```bash
# Development
npm run dev                 # Start both servers (Python script)
npm run dev:unix           # Start both servers (Unix script)
npm run dev:windows        # Start both servers (Windows script)
npm run dev:docker         # Start with Docker Compose

# Individual services
npm run backend:dev        # Start only backend
npm run frontend:dev       # Start only frontend

# Setup and installation
npm run setup              # Install all dependencies
npm run install:all        # Install all dependencies
npm run install:frontend   # Install frontend dependencies
npm run install:backend    # Install backend dependencies

# Building and testing
npm run build              # Build frontend for production
npm run test               # Run frontend tests
npm run lint               # Lint frontend code

# Cleanup
npm run clean              # Clean all build artifacts
npm run clean:frontend     # Clean frontend artifacts
npm run clean:backend      # Clean backend artifacts

# Docker management
npm run docker:build       # Build Docker images
npm run docker:logs        # View Docker logs
npm run docker:restart     # Restart Docker services
```

## 🔍 Troubleshooting

### Common Issues

**Port Already in Use:**
```bash
# Kill processes on ports 3000 and 8000
# Linux/Mac:
sudo lsof -ti:3000,8000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Python Virtual Environment Issues:**
```bash
# Remove and recreate virtual environment
cd backend
rm -rf venv
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

**Node.js Dependencies Issues:**
```bash
# Clear npm cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

**WebSocket Connection Issues:**
- Ensure backend is running on port 8000
- Check if firewall is blocking connections
- Verify CORS settings in backend
- Check browser console for detailed error messages

### Development Tips

1. **Hot Reload**: Both servers support hot reload - changes are automatically reflected
2. **API Testing**: Use http://localhost:8000/docs for interactive API testing
3. **Debugging**: Enable DEBUG=true in backend .env for detailed logs
4. **Network Issues**: Use `localhost` instead of `127.0.0.1` for better compatibility

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test with development scripts
5. Commit changes: `git commit -m "Add feature"`
6. Push to branch: `git push origin feature-name`
7. Create a Pull Request

## 📝 Notes

- The development scripts automatically create virtual environments and install dependencies
- Environment files are created automatically with default values
- All scripts include proper cleanup when stopped with Ctrl+C
- Docker setup includes volume mounting for live code changes
- WebSocket connections are automatically configured for local development

For production deployment, see [DEPLOYMENT.md](DEPLOYMENT.md).