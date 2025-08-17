#!/usr/bin/env python3
"""
Persian AI Chatbot Development Server
Runs both backend (FastAPI) and frontend (Next.js) simultaneously
"""

import subprocess
import sys
import os
import time
import signal
from pathlib import Path
import threading
from concurrent.futures import ThreadPoolExecutor

# Colors for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_colored(message, color=Colors.ENDC):
    print(f"{color}{message}{Colors.ENDC}")

def print_banner():
    banner = """
    ╔══════════════════════════════════════════════════════════════╗
    ║              Persian AI Chatbot Development Server          ║
    ║                                                              ║
    ║  🚀 Starting Backend (FastAPI) + Frontend (Next.js)         ║
    ║  📝 Backend: http://localhost:8000                          ║
    ║  🌐 Frontend: http://localhost:3000                         ║
    ║  📚 API Docs: http://localhost:8000/docs                    ║
    ║                                                              ║
    ║  Press Ctrl+C to stop all services                          ║
    ╚══════════════════════════════════════════════════════════════╝
    """
    print_colored(banner, Colors.HEADER)

def check_dependencies():
    """Check if required dependencies are installed"""
    print_colored("🔍 Checking dependencies...", Colors.OKCYAN)
    
    # Check Python
    try:
        python_version = sys.version.split()[0]
        print_colored(f"✅ Python {python_version}", Colors.OKGREEN)
    except Exception as e:
        print_colored(f"❌ Python check failed: {e}", Colors.FAIL)
        return False
    
    # Check Node.js
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print_colored(f"✅ Node.js {result.stdout.strip()}", Colors.OKGREEN)
        else:
            print_colored("❌ Node.js not found", Colors.FAIL)
            return False
    except FileNotFoundError:
        print_colored("❌ Node.js not found. Please install Node.js", Colors.FAIL)
        return False
    
    # Check npm/yarn
    try:
        result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print_colored(f"✅ npm {result.stdout.strip()}", Colors.OKGREEN)
        else:
            # Try yarn
            result = subprocess.run(['yarn', '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                print_colored(f"✅ yarn {result.stdout.strip()}", Colors.OKGREEN)
            else:
                print_colored("❌ Neither npm nor yarn found", Colors.FAIL)
                return False
    except FileNotFoundError:
        print_colored("❌ Package manager not found", Colors.FAIL)
        return False
    
    return True

def setup_backend():
    """Setup backend environment"""
    backend_path = Path("backend")
    
    if not backend_path.exists():
        print_colored("❌ Backend directory not found", Colors.FAIL)
        return False
    
    print_colored("🔧 Setting up backend environment...", Colors.OKCYAN)
    
    # Check if virtual environment exists
    venv_path = backend_path / "venv"
    if not venv_path.exists():
        print_colored("📦 Creating virtual environment...", Colors.WARNING)
        result = subprocess.run([sys.executable, "-m", "venv", str(venv_path)])
        if result.returncode != 0:
            print_colored("❌ Failed to create virtual environment", Colors.FAIL)
            return False
    
    # Determine activation script path
    if sys.platform == "win32":
        activate_script = venv_path / "Scripts" / "activate"
        pip_path = venv_path / "Scripts" / "pip"
    else:
        activate_script = venv_path / "bin" / "activate"
        pip_path = venv_path / "bin" / "pip"
    
    # Install requirements
    requirements_path = backend_path / "requirements.txt"
    if requirements_path.exists():
        print_colored("📦 Installing Python dependencies...", Colors.WARNING)
        result = subprocess.run([str(pip_path), "install", "-r", str(requirements_path)])
        if result.returncode != 0:
            print_colored("⚠️  Some dependencies may have failed to install", Colors.WARNING)
    
    return True

def setup_frontend():
    """Setup frontend environment"""
    frontend_path = Path("frontend")
    
    if not frontend_path.exists():
        print_colored("❌ Frontend directory not found", Colors.FAIL)
        return False
    
    print_colored("🔧 Setting up frontend environment...", Colors.OKCYAN)
    
    # Check if node_modules exists
    node_modules = frontend_path / "node_modules"
    if not node_modules.exists():
        print_colored("📦 Installing Node.js dependencies...", Colors.WARNING)
        
        # Try yarn first, then npm
        try:
            result = subprocess.run(['yarn', 'install'], cwd=frontend_path, check=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            try:
                result = subprocess.run(['npm', 'install'], cwd=frontend_path, check=True)
            except subprocess.CalledProcessError:
                print_colored("❌ Failed to install frontend dependencies", Colors.FAIL)
                return False
    
    return True

def run_backend():
    """Run the backend server"""
    backend_path = Path("backend")
    venv_path = backend_path / "venv"
    
    if sys.platform == "win32":
        python_path = venv_path / "Scripts" / "python"
    else:
        python_path = venv_path / "bin" / "python"
    
    # Create .env file if it doesn't exist
    env_file = backend_path / ".env"
    if not env_file.exists():
        print_colored("📝 Creating backend .env file...", Colors.WARNING)
        env_content = """# Backend Environment Configuration
NODE_ENV=development
DEBUG=true
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000

# Add your API keys here
# OPENAI_API_KEY=your_key_here
# HUGGINGFACE_API_KEY=your_key_here
"""
        env_file.write_text(env_content)
    
    print_colored("🚀 Starting backend server (FastAPI)...", Colors.OKBLUE)
    
    # Run uvicorn
    cmd = [str(python_path), "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
    
    try:
        process = subprocess.Popen(
            cmd,
            cwd=backend_path,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )
        
        # Print backend output with prefix
        for line in iter(process.stdout.readline, ''):
            if line:
                print_colored(f"[BACKEND] {line.rstrip()}", Colors.OKBLUE)
        
        return process
    except Exception as e:
        print_colored(f"❌ Failed to start backend: {e}", Colors.FAIL)
        return None

def run_frontend():
    """Run the frontend server"""
    frontend_path = Path("frontend")
    
    # Create .env.local file if it doesn't exist
    env_file = frontend_path / ".env.local"
    if not env_file.exists():
        print_colored("📝 Creating frontend .env.local file...", Colors.WARNING)
        env_content = """# Frontend Environment Configuration
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/chat
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
"""
        env_file.write_text(env_content)
    
    print_colored("🌐 Starting frontend server (Next.js)...", Colors.OKGREEN)
    
    # Try yarn first, then npm
    try:
        # Check if yarn.lock exists
        if (frontend_path / "yarn.lock").exists():
            cmd = ["yarn", "dev"]
        else:
            cmd = ["npm", "run", "dev"]
        
        process = subprocess.Popen(
            cmd,
            cwd=frontend_path,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )
        
        # Print frontend output with prefix
        for line in iter(process.stdout.readline, ''):
            if line:
                print_colored(f"[FRONTEND] {line.rstrip()}", Colors.OKGREEN)
        
        return process
    except Exception as e:
        print_colored(f"❌ Failed to start frontend: {e}", Colors.FAIL)
        return None

def main():
    """Main function to orchestrate the development environment"""
    print_banner()
    
    # Check dependencies
    if not check_dependencies():
        print_colored("❌ Dependency check failed. Please install missing dependencies.", Colors.FAIL)
        sys.exit(1)
    
    # Setup environments
    if not setup_backend():
        print_colored("❌ Backend setup failed", Colors.FAIL)
        sys.exit(1)
    
    if not setup_frontend():
        print_colored("❌ Frontend setup failed", Colors.FAIL)
        sys.exit(1)
    
    print_colored("✅ Environment setup complete!", Colors.OKGREEN)
    print_colored("🚀 Starting development servers...", Colors.HEADER)
    
    # Store processes for cleanup
    processes = []
    
    def signal_handler(signum, frame):
        print_colored("\n🛑 Shutting down development servers...", Colors.WARNING)
        for process in processes:
            if process and process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()
        print_colored("✅ All servers stopped", Colors.OKGREEN)
        sys.exit(0)
    
    # Register signal handler
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Run servers in parallel using ThreadPoolExecutor
    with ThreadPoolExecutor(max_workers=2) as executor:
        # Submit both tasks
        backend_future = executor.submit(run_backend)
        frontend_future = executor.submit(run_frontend)
        
        # Wait a moment for servers to start
        time.sleep(3)
        
        print_colored("\n" + "="*60, Colors.HEADER)
        print_colored("🎉 Development servers are running!", Colors.HEADER)
        print_colored("📝 Backend API: http://localhost:8000", Colors.OKBLUE)
        print_colored("🌐 Frontend App: http://localhost:3000", Colors.OKGREEN)
        print_colored("📚 API Documentation: http://localhost:8000/docs", Colors.OKCYAN)
        print_colored("🔧 Press Ctrl+C to stop all servers", Colors.WARNING)
        print_colored("="*60, Colors.HEADER)
        
        try:
            # Wait for both processes to complete (they won't unless there's an error)
            backend_process = backend_future.result()
            frontend_process = frontend_future.result()
            
            if backend_process:
                processes.append(backend_process)
            if frontend_process:
                processes.append(frontend_process)
            
            # Keep the main thread alive
            while True:
                time.sleep(1)
                # Check if any process died
                for process in processes:
                    if process and process.poll() is not None:
                        print_colored(f"⚠️  A server process stopped unexpectedly", Colors.WARNING)
                        signal_handler(None, None)
        
        except KeyboardInterrupt:
            signal_handler(None, None)

if __name__ == "__main__":
    main()