@echo off
setlocal enabledelayedexpansion

REM Persian AI Chatbot Development Server
REM Runs both backend (FastAPI) and frontend (Next.js) simultaneously

title Persian AI Chatbot - Development Server

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║              Persian AI Chatbot Development Server          ║
echo ║                                                              ║
echo ║  🚀 Starting Backend (FastAPI) + Frontend (Next.js)         ║
echo ║  📝 Backend: http://localhost:8000                          ║
echo ║  🌐 Frontend: http://localhost:3000                         ║
echo ║  📚 API Docs: http://localhost:8000/docs                    ║
echo ║                                                              ║
echo ║  Press Ctrl+C to stop all services                          ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Check dependencies
echo 🔍 Checking dependencies...

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found. Please install Python 3.8+
    pause
    exit /b 1
) else (
    for /f "tokens=2" %%i in ('python --version') do echo ✅ Python %%i
)

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js
    pause
    exit /b 1
) else (
    for /f %%i in ('node --version') do echo ✅ Node.js %%i
)

REM Check package manager
set PACKAGE_MANAGER=npm
yarn --version >nul 2>&1
if not errorlevel 1 (
    set PACKAGE_MANAGER=yarn
    for /f %%i in ('yarn --version') do echo ✅ Yarn %%i
) else (
    npm --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ Neither npm nor yarn found
        pause
        exit /b 1
    ) else (
        for /f %%i in ('npm --version') do echo ✅ npm %%i
    )
)

REM Setup backend
echo.
echo 🔧 Setting up backend environment...
cd backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Failed to create virtual environment
        pause
        exit /b 1
    )
)

REM Activate virtual environment and install requirements
call venv\Scripts\activate.bat
if exist "requirements.txt" (
    echo 📦 Installing Python dependencies...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ⚠️ Some dependencies may have failed to install
    )
)

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo 📝 Creating backend .env file...
    (
    echo # Backend Environment Configuration
    echo NODE_ENV=development
    echo DEBUG=true
    echo FRONTEND_URL=http://localhost:3000
    echo BACKEND_URL=http://localhost:8000
    echo.
    echo # Add your API keys here
    echo # OPENAI_API_KEY=your_key_here
    echo # HUGGINGFACE_API_KEY=your_key_here
    ) > .env
)

cd ..

REM Setup frontend
echo.
echo 🔧 Setting up frontend environment...
cd frontend

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing Node.js dependencies...
    if "!PACKAGE_MANAGER!"=="yarn" (
        yarn install
    ) else (
        npm install
    )
    if errorlevel 1 (
        echo ❌ Failed to install frontend dependencies
        pause
        exit /b 1
    )
)

REM Create .env.local file if it doesn't exist
if not exist ".env.local" (
    echo 📝 Creating frontend .env.local file...
    (
    echo # Frontend Environment Configuration
    echo NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/chat
    echo NEXT_PUBLIC_API_URL=http://localhost:8000/api
    echo NODE_ENV=development
    echo NEXT_TELEMETRY_DISABLED=1
    ) > .env.local
)

cd ..

echo.
echo ✅ Environment setup complete!
echo 🚀 Starting development servers...

REM Start backend in background
echo.
echo 🚀 Starting backend server (FastAPI)...
start "Backend Server" /min cmd /c "cd backend && call venv\Scripts\activate.bat && python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in background
echo 🌐 Starting frontend server (Next.js)...
if "!PACKAGE_MANAGER!"=="yarn" (
    start "Frontend Server" /min cmd /c "cd frontend && yarn dev"
) else (
    start "Frontend Server" /min cmd /c "cd frontend && npm run dev"
)

REM Wait for servers to start
timeout /t 5 /nobreak >nul

echo.
echo ============================================================
echo 🎉 Development servers are running!
echo 📝 Backend API: http://localhost:8000
echo 🌐 Frontend App: http://localhost:3000
echo 📚 API Documentation: http://localhost:8000/docs
echo 🔧 Close this window or press Ctrl+C to stop all servers
echo ============================================================
echo.

REM Keep the script running
echo Press any key to stop all servers...
pause >nul

REM Cleanup - kill background processes
taskkill /f /im "python.exe" /fi "windowtitle eq Backend Server*" >nul 2>&1
taskkill /f /im "node.exe" /fi "windowtitle eq Frontend Server*" >nul 2>&1
taskkill /f /im "cmd.exe" /fi "windowtitle eq Backend Server*" >nul 2>&1
taskkill /f /im "cmd.exe" /fi "windowtitle eq Frontend Server*" >nul 2>&1

echo.
echo ✅ All servers stopped
pause