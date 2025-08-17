#!/bin/bash

# Persian AI Chatbot - Pipeline Validation Script
# This script validates the CI/CD pipeline configuration locally

set -e

echo "🔍 Persian AI Chatbot - Pipeline Configuration Validation"
echo "========================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  $message${NC}"
            ;;
    esac
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check file exists
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        print_status "SUCCESS" "$description found: $file"
        return 0
    else
        print_status "ERROR" "$description not found: $file"
        return 1
    fi
}

# Function to check directory exists
check_directory() {
    local dir=$1
    local description=$2
    
    if [ -d "$dir" ]; then
        print_status "SUCCESS" "$description found: $dir"
        return 0
    else
        print_status "ERROR" "$description not found: $dir"
        return 1
    fi
}

echo ""
print_status "INFO" "Starting pipeline configuration validation..."
echo ""

# ============================================================================
# Check Required Tools
# ============================================================================

echo "🛠️  Checking Required Tools..."
echo "--------------------------------"

tools_ok=true

if command_exists docker; then
    docker_version=$(docker --version)
    print_status "SUCCESS" "Docker found: $docker_version"
else
    print_status "ERROR" "Docker not found - required for local testing"
    tools_ok=false
fi

if command_exists docker-compose; then
    compose_version=$(docker-compose --version)
    print_status "SUCCESS" "Docker Compose found: $compose_version"
else
    print_status "ERROR" "Docker Compose not found - required for local testing"
    tools_ok=false
fi

if command_exists node; then
    node_version=$(node --version)
    print_status "SUCCESS" "Node.js found: $node_version"
else
    print_status "WARNING" "Node.js not found - required for frontend development"
fi

if command_exists python3; then
    python_version=$(python3 --version)
    print_status "SUCCESS" "Python found: $python_version"
else
    print_status "ERROR" "Python3 not found - required for backend"
    tools_ok=false
fi

if command_exists git; then
    git_version=$(git --version)
    print_status "SUCCESS" "Git found: $git_version"
else
    print_status "ERROR" "Git not found - required for CI/CD"
    tools_ok=false
fi

echo ""

# ============================================================================
# Check Project Structure
# ============================================================================

echo "📁 Checking Project Structure..."
echo "--------------------------------"

structure_ok=true

# Check main directories
check_directory "backend" "Backend directory" || structure_ok=false
check_directory "frontend" "Frontend directory" || structure_ok=false

# Check configuration files
check_file ".gitlab-ci.yml" "GitLab CI/CD configuration" || structure_ok=false
check_file "Dockerfile" "Docker configuration" || structure_ok=false
check_file "docker-compose.yml" "Docker Compose configuration" || structure_ok=false
check_file ".env.example" "Environment example file" || structure_ok=false

# Check backend files
check_file "backend/main.py" "Backend main file" || structure_ok=false
check_file "backend/requirements.txt" "Backend requirements" || structure_ok=false

# Check frontend files
check_file "frontend/package.json" "Frontend package configuration" || structure_ok=false

echo ""

# ============================================================================
# Validate GitLab CI/CD Configuration
# ============================================================================

echo "🔧 Validating GitLab CI/CD Configuration..."
echo "--------------------------------------------"

gitlab_ci_ok=true

if [ -f ".gitlab-ci.yml" ]; then
    # Check for required stages
    if grep -q "stages:" .gitlab-ci.yml; then
        print_status "SUCCESS" "Pipeline stages defined"
        
        # Check each stage
        stages=("prepare" "validate" "test" "security" "build" "deploy" "notify")
        for stage in "${stages[@]}"; do
            if grep -q "  - $stage" .gitlab-ci.yml; then
                print_status "SUCCESS" "Stage '$stage' found"
            else
                print_status "ERROR" "Stage '$stage' not found"
                gitlab_ci_ok=false
            fi
        done
    else
        print_status "ERROR" "No pipeline stages defined"
        gitlab_ci_ok=false
    fi
    
    # Check for required jobs
    required_jobs=("prepare_frontend_dependencies" "prepare_backend_dependencies" "test_frontend" "test_backend" "build_docker_image")
    for job in "${required_jobs[@]}"; do
        if grep -q "$job:" .gitlab-ci.yml; then
            print_status "SUCCESS" "Job '$job' found"
        else
            print_status "ERROR" "Job '$job' not found"
            gitlab_ci_ok=false
        fi
    done
    
    # Check for Docker configuration
    if grep -q "docker:" .gitlab-ci.yml; then
        print_status "SUCCESS" "Docker configuration found"
    else
        print_status "WARNING" "Docker configuration not found"
    fi
    
else
    print_status "ERROR" "GitLab CI/CD configuration file not found"
    gitlab_ci_ok=false
fi

echo ""

# ============================================================================
# Validate Dockerfile
# ============================================================================

echo "🐳 Validating Dockerfile..."
echo "---------------------------"

dockerfile_ok=true

if [ -f "Dockerfile" ]; then
    # Check for multi-stage build
    if grep -q "FROM.*AS" Dockerfile; then
        print_status "SUCCESS" "Multi-stage build detected"
    else
        print_status "WARNING" "Multi-stage build not detected"
    fi
    
    # Check for required stages
    required_stages=("frontend-builder" "backend-builder" "frontend-runtime" "backend-runtime")
    for stage in "${required_stages[@]}"; do
        if grep -q "AS $stage" Dockerfile; then
            print_status "SUCCESS" "Docker stage '$stage' found"
        else
            print_status "ERROR" "Docker stage '$stage' not found"
            dockerfile_ok=false
        fi
    done
    
    # Check for health checks
    if grep -q "HEALTHCHECK" Dockerfile; then
        print_status "SUCCESS" "Health checks configured"
    else
        print_status "WARNING" "No health checks found"
    fi
    
    # Check for security best practices
    if grep -q "USER" Dockerfile; then
        print_status "SUCCESS" "Non-root user configured"
    else
        print_status "WARNING" "Running as root user (security risk)"
    fi
    
else
    print_status "ERROR" "Dockerfile not found"
    dockerfile_ok=false
fi

echo ""

# ============================================================================
# Validate Dependencies
# ============================================================================

echo "📦 Validating Dependencies..."
echo "-----------------------------"

deps_ok=true

# Check backend dependencies
if [ -f "backend/requirements.txt" ]; then
    print_status "SUCCESS" "Backend requirements.txt found"
    
    # Check for essential packages
    essential_packages=("fastapi" "uvicorn" "python-dotenv")
    for package in "${essential_packages[@]}"; do
        if grep -q "$package" backend/requirements.txt; then
            print_status "SUCCESS" "Essential package '$package' found"
        else
            print_status "WARNING" "Essential package '$package' not found"
        fi
    done
else
    print_status "ERROR" "Backend requirements.txt not found"
    deps_ok=false
fi

# Check frontend dependencies
if [ -f "frontend/package.json" ]; then
    print_status "SUCCESS" "Frontend package.json found"
    
    # Check for essential packages
    if grep -q "next\|react\|typescript" frontend/package.json; then
        print_status "SUCCESS" "Frontend framework dependencies found"
    else
        print_status "WARNING" "Frontend framework dependencies not clearly identified"
    fi
else
    print_status "ERROR" "Frontend package.json not found"
    deps_ok=false
fi

echo ""

# ============================================================================
# Test Docker Build (Optional)
# ============================================================================

echo "🏗️  Testing Docker Build (Optional)..."
echo "--------------------------------------"

if [ "$1" = "--build-test" ] && [ "$tools_ok" = true ] && [ "$dockerfile_ok" = true ]; then
    print_status "INFO" "Starting Docker build test..."
    
    if docker build --target backend-runtime -t persian-chatbot-test . > /tmp/docker-build.log 2>&1; then
        print_status "SUCCESS" "Docker build test passed"
        # Clean up test image
        docker rmi persian-chatbot-test >/dev/null 2>&1 || true
    else
        print_status "ERROR" "Docker build test failed - check /tmp/docker-build.log"
    fi
else
    print_status "INFO" "Docker build test skipped (use --build-test to enable)"
fi

echo ""

# ============================================================================
# Environment Configuration Check
# ============================================================================

echo "🌍 Checking Environment Configuration..."
echo "---------------------------------------"

env_ok=true

if [ -f ".env.example" ]; then
    print_status "SUCCESS" "Environment example file found"
    
    # Check for important environment variables
    important_vars=("NODE_ENV" "PYTHON_ENV" "DATABASE_URL" "REDIS_URL")
    for var in "${important_vars[@]}"; do
        if grep -q "$var" .env.example; then
            print_status "SUCCESS" "Environment variable '$var' documented"
        else
            print_status "WARNING" "Environment variable '$var' not documented"
        fi
    done
else
    print_status "ERROR" "Environment example file not found"
    env_ok=false
fi

if [ -f ".env" ]; then
    print_status "WARNING" ".env file found - ensure it's not committed to git"
else
    print_status "INFO" ".env file not found - copy from .env.example for local development"
fi

echo ""

# ============================================================================
# Summary
# ============================================================================

echo "📊 Validation Summary"
echo "===================="

overall_status=true

if [ "$tools_ok" = true ]; then
    print_status "SUCCESS" "Required tools check passed"
else
    print_status "ERROR" "Required tools check failed"
    overall_status=false
fi

if [ "$structure_ok" = true ]; then
    print_status "SUCCESS" "Project structure check passed"
else
    print_status "ERROR" "Project structure check failed"
    overall_status=false
fi

if [ "$gitlab_ci_ok" = true ]; then
    print_status "SUCCESS" "GitLab CI/CD configuration check passed"
else
    print_status "ERROR" "GitLab CI/CD configuration check failed"
    overall_status=false
fi

if [ "$dockerfile_ok" = true ]; then
    print_status "SUCCESS" "Dockerfile validation passed"
else
    print_status "ERROR" "Dockerfile validation failed"
    overall_status=false
fi

if [ "$deps_ok" = true ]; then
    print_status "SUCCESS" "Dependencies validation passed"
else
    print_status "ERROR" "Dependencies validation failed"
    overall_status=false
fi

if [ "$env_ok" = true ]; then
    print_status "SUCCESS" "Environment configuration check passed"
else
    print_status "WARNING" "Environment configuration check had issues"
fi

echo ""

if [ "$overall_status" = true ]; then
    print_status "SUCCESS" "Overall validation PASSED - Pipeline ready for use!"
    echo ""
    print_status "INFO" "Next steps:"
    echo "   1. Configure GitLab CI/CD variables"
    echo "   2. Copy .env.example to .env and configure"
    echo "   3. Push to GitLab to trigger the pipeline"
    echo "   4. Monitor the pipeline execution"
    exit 0
else
    print_status "ERROR" "Overall validation FAILED - Please fix the issues above"
    echo ""
    print_status "INFO" "Common fixes:"
    echo "   1. Install missing tools (Docker, Python, Node.js)"
    echo "   2. Check file paths and structure"
    echo "   3. Review GitLab CI/CD configuration"
    echo "   4. Validate Dockerfile syntax"
    exit 1
fi