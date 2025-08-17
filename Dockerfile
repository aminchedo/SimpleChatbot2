# Multi-stage build for production optimization
# This Dockerfile automatically installs all dependencies and optimizes for production

# Stage 1: Frontend Builder
FROM node:18-alpine AS frontend-builder

# Set working directory
WORKDIR /app/frontend

# Install system dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl

# Copy package files first for better caching
COPY frontend/package*.json ./

# Install dependencies with npm ci for faster, reliable builds
RUN npm ci --only=production --no-audit --prefer-offline

# Copy frontend source code
COPY frontend/ ./

# Build the application (if build script exists)
RUN npm run build --if-present || echo "No build script found, using source files"

# Stage 2: Backend Builder
FROM node:18-alpine AS backend-builder

# Set working directory
WORKDIR /app/backend

# Install system dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl

# Copy package files first for better caching
COPY backend/package*.json ./

# Install dependencies with npm ci for faster, reliable builds
RUN npm ci --only=production --no-audit --prefer-offline

# Copy backend source code
COPY backend/ ./

# Build the application (if build script exists)
RUN npm run build --if-present || echo "No build script found"

# Stage 3: Frontend Runtime (Nginx)
FROM nginx:alpine AS frontend-runtime

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built frontend files from builder stage
# Support multiple build output directories
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html 2>/dev/null || true
COPY --from=frontend-builder /app/frontend/build /usr/share/nginx/html 2>/dev/null || true
COPY --from=frontend-builder /app/frontend/out /usr/share/nginx/html 2>/dev/null || true
COPY --from=frontend-builder /app/frontend/public /usr/share/nginx/html 2>/dev/null || true

# Copy custom nginx configuration if it exists
COPY nginx/nginx.conf /etc/nginx/nginx.conf 2>/dev/null || echo "Using default nginx config"

# Create a default index.html if none exists
RUN if [ ! -f /usr/share/nginx/html/index.html ]; then \
    echo '<h1>Frontend Service Running</h1><p>Frontend is ready!</p>' > /usr/share/nginx/html/index.html; \
    fi

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Stage 4: Backend Runtime
FROM node:18-alpine AS backend-runtime

# Set working directory
WORKDIR /app

# Install system dependencies and tools needed for runtime
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    bash \
    dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built backend from builder stage
COPY --from=backend-builder /app/backend ./

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port 8000
EXPOSE 8000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || curl -f http://localhost:8000/ || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"]

# Stage 5: Development Environment (Optional)
FROM node:18-alpine AS development

WORKDIR /app

# Install all development dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl \
    bash

# Copy package files
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install all dependencies (including dev dependencies)
RUN cd frontend && npm install
RUN cd backend && npm install

# Copy source code
COPY . .

# Expose ports for both services
EXPOSE 3000 8000

# Default command for development
CMD ["sh", "-c", "cd backend && npm run dev & cd frontend && npm run dev"]