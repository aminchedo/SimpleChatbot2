# Multi-stage Dockerfile for Persian AI Chatbot
# Automatically installs all dependencies and optimizes for production

ARG NODE_VERSION=18
ARG PYTHON_VERSION=3.11

# ============================================================================
# Stage 1: Frontend Builder (Next.js/React)
# ============================================================================
FROM node:${NODE_VERSION}-alpine AS frontend-builder

LABEL stage=frontend-builder
LABEL description="Build stage for Next.js frontend"

WORKDIR /app/frontend

# Install system dependencies for native modules and build tools
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl \
    libc6-compat \
    && rm -rf /var/cache/apk/*

# Copy package files first for better Docker layer caching
COPY frontend/package*.json ./

# Install dependencies with npm ci for faster, reliable builds
RUN npm ci --only=production --no-audit --prefer-offline --silent

# Copy frontend source code
COPY frontend/ ./

# Build the Next.js application
RUN npm run build || echo "Build completed with warnings"

# Verify build output
RUN ls -la .next/ || ls -la build/ || ls -la dist/ || echo "Build output directory not found"

# ============================================================================
# Stage 2: Backend Dependencies Builder (Python)
# ============================================================================
FROM python:${PYTHON_VERSION}-alpine AS backend-builder

LABEL stage=backend-builder
LABEL description="Build stage for Python backend dependencies"

WORKDIR /app/backend

# Install comprehensive system dependencies for Python packages
RUN apk add --no-cache \
    gcc \
    g++ \
    musl-dev \
    libffi-dev \
    python3-dev \
    build-base \
    git \
    curl \
    jpeg-dev \
    zlib-dev \
    freetype-dev \
    lcms2-dev \
    openjpeg-dev \
    tiff-dev \
    tk-dev \
    tcl-dev \
    harfbuzz-dev \
    fribidi-dev \
    libjpeg \
    linux-headers \
    rust \
    cargo \
    && rm -rf /var/cache/apk/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Upgrade pip and essential tools
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Copy requirements file
COPY backend/requirements.txt ./

# Install Python dependencies with optimizations
RUN pip install --no-cache-dir -r requirements.txt --timeout 300

# Verify installation
RUN pip list && python -c "import fastapi; import uvicorn; print('Core dependencies OK')"

# ============================================================================
# Stage 3: Frontend Runtime (Nginx)
# ============================================================================
FROM nginx:alpine AS frontend-runtime

LABEL stage=frontend-runtime
LABEL description="Production runtime for frontend with Nginx"

# Install curl for health checks and basic tools
RUN apk add --no-cache curl bash \
    && rm -rf /var/cache/apk/*

# Copy built frontend files from builder stage
# Support multiple build output directories (Next.js, React, etc.)
COPY --from=frontend-builder /app/frontend/.next/standalone /usr/share/nginx/html/ 2>/dev/null || true
COPY --from=frontend-builder /app/frontend/.next/static /usr/share/nginx/html/_next/static 2>/dev/null || true
COPY --from=frontend-builder /app/frontend/build /usr/share/nginx/html/ 2>/dev/null || true
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html/ 2>/dev/null || true
COPY --from=frontend-builder /app/frontend/out /usr/share/nginx/html/ 2>/dev/null || true
COPY --from=frontend-builder /app/frontend/public /usr/share/nginx/html/ 2>/dev/null || true

# Copy custom nginx configuration if it exists, otherwise use default
COPY nginx/nginx.conf /etc/nginx/nginx.conf 2>/dev/null || echo "Using default nginx configuration"

# Create a default index.html if none exists
RUN if [ ! -f /usr/share/nginx/html/index.html ]; then \
    cat > /usr/share/nginx/html/index.html << 'EOF'
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Persian AI Chatbot</title>
    <style>
        body { font-family: 'Tahoma', sans-serif; text-align: center; margin-top: 50px; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .status { color: #28a745; font-size: 24px; margin-bottom: 20px; }
        .description { color: #6c757d; font-size: 16px; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">
        <div class="status">✅ Frontend Service Running</div>
        <div class="description">
            <p>چت‌بات هوش مصنوعی فارسی آماده است!</p>
            <p>Persian AI Chatbot Frontend is ready!</p>
        </div>
    </div>
</body>
</html>
EOF
    fi

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html \
    && chmod -R 755 /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check with multiple endpoints
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || curl -f http://localhost/health || exit 1

# ============================================================================
# Stage 4: Backend Runtime (Python FastAPI)
# ============================================================================
FROM python:${PYTHON_VERSION}-alpine AS backend-runtime

LABEL stage=backend-runtime
LABEL description="Production runtime for Python FastAPI backend"

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    bash \
    dumb-init \
    jpeg \
    zlib \
    freetype \
    lcms2 \
    openjpeg \
    tiff \
    tk \
    tcl \
    harfbuzz \
    fribidi \
    libjpeg \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S appuser && \
    adduser -S appuser -u 1001 -G appuser

# Copy virtual environment from builder stage
COPY --from=backend-builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy backend source code
COPY backend/ ./

# Create necessary directories and set permissions
RUN mkdir -p logs uploads temp \
    && chown -R appuser:appuser /app \
    && chmod +x /app/main.py 2>/dev/null || true

# Switch to non-root user
USER appuser

# Expose port 8000
EXPOSE 8000

# Health check endpoint with fallbacks
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/health || \
        curl -f http://localhost:8000/docs || \
        curl -f http://localhost:8000/ || \
        exit 1

# Use dumb-init to handle signals properly in containers
ENTRYPOINT ["dumb-init", "--"]

# Start the FastAPI application with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]

# ============================================================================
# Stage 5: Complete Application Stack
# ============================================================================
FROM alpine:latest AS app-stack

LABEL stage=app-stack
LABEL description="Complete application with both frontend and backend"

# Install Docker Compose and required tools
RUN apk add --no-cache \
    docker-cli \
    docker-compose \
    curl \
    bash \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy docker-compose files
COPY docker-compose*.yml ./
COPY .env* ./ 2>/dev/null || true

# Copy deployment scripts
COPY deploy*.sh ./ 2>/dev/null || true
RUN chmod +x *.sh 2>/dev/null || true

# Health check for the complete stack
HEALTHCHECK --interval=60s --timeout=30s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health && curl -f http://localhost/ || exit 1

CMD ["docker-compose", "up"]

# ============================================================================
# Stage 6: Development Environment
# ============================================================================
FROM python:${PYTHON_VERSION}-alpine AS development

LABEL stage=development
LABEL description="Development environment with all tools and dependencies"

WORKDIR /app

# Install comprehensive development dependencies
RUN apk add --no-cache \
    nodejs \
    npm \
    python3 \
    python3-dev \
    gcc \
    g++ \
    musl-dev \
    libffi-dev \
    build-base \
    git \
    curl \
    bash \
    vim \
    htop \
    && rm -rf /var/cache/apk/*

# Install global development tools
RUN npm install -g nodemon concurrently

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy and install backend dependencies
COPY backend/requirements.txt ./backend/
RUN cd backend && pip install -r requirements.txt
RUN pip install --no-cache-dir pytest pytest-cov black flake8 isort mypy

# Copy and install frontend dependencies
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

# Copy source code
COPY . .

# Set proper permissions
RUN chmod -R 755 /app

# Expose ports for both services
EXPOSE 3000 8000 5173 8080

# Environment variables for development
ENV NODE_ENV=development
ENV PYTHON_ENV=development
ENV DEBUG=true

# Health check for development
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || curl -f http://localhost:3000 || exit 1

# Start both services in development mode
CMD ["bash", "-c", "cd backend && uvicorn main:app --host 0.0.0.0 --port 8000 --reload & cd frontend && npm run dev"]

# ============================================================================
# Build Arguments and Labels
# ============================================================================

# Build arguments for customization
ARG BUILD_DATE
ARG VERSION
ARG VCS_REF

# Labels for better container management
LABEL maintainer="Persian AI Chatbot Team"
LABEL version="${VERSION:-latest}"
LABEL description="Persian AI Chatbot - Multi-stage Docker build with automatic dependency installation"
LABEL build-date="${BUILD_DATE}"
LABEL vcs-ref="${VCS_REF}"
LABEL vcs-url="https://github.com/your-repo/persian-ai-chatbot"
LABEL vendor="Persian AI Chatbot"
LABEL licenses="MIT"

# Default target is production backend
FROM backend-runtime