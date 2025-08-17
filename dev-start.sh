#!/bin/bash

# Persian AI Chatbot Development Server
# Runs both backend (FastAPI) and frontend (Next.js) simultaneously

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_banner() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║              Persian AI Chatbot Development Server          ║"
    echo "║                                                              ║"
    echo "║  🚀 Starting Backend (FastAPI) + Frontend (Next.js)         ║"
    echo "║  📝 Backend: http://localhost:8000                          ║"
    echo "║  🌐 Frontend: http://localhost:3000                         ║"
    echo "║  📚 API Docs: http://localhost:8000/docs                    ║"
    echo "║                                                              ║"
    echo "║  Press Ctrl+C to stop all services                          ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down development servers...${NC}"
    
    # Kill background processes
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    # Kill any remaining processes
    pkill -f "uvicorn.*main:app" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    
    echo -e "${GREEN}✅ All servers stopped${NC}"
    exit 0
}

check_dependencies() {
    echo -e "${CYAN}🔍 Checking dependencies...${NC}"
    
    # Check Python
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version)
        echo -e "${GREEN}✅ $PYTHON_VERSION${NC}"
    else
        echo -e "${RED}❌ Python 3 not found${NC}"
        exit 1
    fi
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        echo -e "${GREEN}✅ Node.js $NODE_VERSION${NC}"
    else
        echo -e "${RED}❌ Node.js not found${NC}"
        exit 1
    fi
    
    # Check package manager
    if command -v yarn &> /dev/null; then
        YARN_VERSION=$(yarn --version)
        echo -e "${GREEN}✅ Yarn $YARN_VERSION${NC}"
        PACKAGE_MANAGER="yarn"
    elif command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        echo -e "${GREEN}✅ npm $NPM_VERSION${NC}"
        PACKAGE_MANAGER="npm"
    else
        echo -e "${RED}❌ Neither yarn nor npm found${NC}"
        exit 1
    fi
}

setup_backend() {
    echo -e "${CYAN}🔧 Setting up backend environment...${NC}"
    
    cd backend
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        echo -e "${YELLOW}📦 Creating virtual environment...${NC}"
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install requirements
    if [ -f "requirements.txt" ]; then
        echo -e "${YELLOW}📦 Installing Python dependencies...${NC}"
        pip install -r requirements.txt
    fi
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}📝 Creating backend .env file...${NC}"
        cat > .env << EOF
# Backend Environment Configuration
NODE_ENV=development
DEBUG=true
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000

# Add your API keys here
# OPENAI_API_KEY=your_key_here
# HUGGINGFACE_API_KEY=your_key_here
EOF
    fi
    
    cd ..
}

setup_frontend() {
    echo -e "${CYAN}🔧 Setting up frontend environment...${NC}"
    
    cd frontend
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing Node.js dependencies...${NC}"
        if [ "$PACKAGE_MANAGER" = "yarn" ]; then
            yarn install
        else
            npm install
        fi
    fi
    
    # Create .env.local file if it doesn't exist
    if [ ! -f ".env.local" ]; then
        echo -e "${YELLOW}📝 Creating frontend .env.local file...${NC}"
        cat > .env.local << EOF
# Frontend Environment Configuration
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/chat
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
EOF
    fi
    
    cd ..
}

run_backend() {
    echo -e "${BLUE}🚀 Starting backend server (FastAPI)...${NC}"
    cd backend
    source venv/bin/activate
    python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload 2>&1 | sed "s/^/[BACKEND] /" &
    BACKEND_PID=$!
    cd ..
}

run_frontend() {
    echo -e "${GREEN}🌐 Starting frontend server (Next.js)...${NC}"
    cd frontend
    if [ "$PACKAGE_MANAGER" = "yarn" ]; then
        yarn dev 2>&1 | sed "s/^/[FRONTEND] /" &
    else
        npm run dev 2>&1 | sed "s/^/[FRONTEND] /" &
    fi
    FRONTEND_PID=$!
    cd ..
}

main() {
    print_banner
    
    # Set up signal handlers
    trap cleanup SIGINT SIGTERM
    
    # Check dependencies
    check_dependencies
    
    # Setup environments
    setup_backend
    setup_frontend
    
    echo -e "${GREEN}✅ Environment setup complete!${NC}"
    echo -e "${PURPLE}🚀 Starting development servers...${NC}"
    
    # Start servers
    run_backend
    sleep 2
    run_frontend
    
    # Wait for servers to start
    sleep 5
    
    echo -e "\n${PURPLE}============================================================${NC}"
    echo -e "${PURPLE}🎉 Development servers are running!${NC}"
    echo -e "${BLUE}📝 Backend API: http://localhost:8000${NC}"
    echo -e "${GREEN}🌐 Frontend App: http://localhost:3000${NC}"
    echo -e "${CYAN}📚 API Documentation: http://localhost:8000/docs${NC}"
    echo -e "${YELLOW}🔧 Press Ctrl+C to stop all servers${NC}"
    echo -e "${PURPLE}============================================================${NC}\n"
    
    # Wait for processes
    wait
}

main "$@"