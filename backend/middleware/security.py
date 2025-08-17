from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import time
import os
from collections import defaultdict
from datetime import datetime, timedelta
import json
import logging

logger = logging.getLogger(__name__)

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: FastAPI, max_requests: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.requests = defaultdict(list)
    
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        now = datetime.now()
        
        # Clean old requests
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if now - req_time < timedelta(minutes=1)
        ]
        
        # Check rate limit
        if len(self.requests[client_ip]) >= self.max_requests:
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded"
            )
        
        # Add current request
        self.requests[client_ip].append(now)
        
        response = await call_next(request)
        return response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Only add HSTS in production with HTTPS
        if os.getenv("ENVIRONMENT") == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response

def setup_security_middleware(app: FastAPI):
    """Setup security middleware for production"""
    
    # Environment check
    is_production = os.getenv("ENVIRONMENT") == "production"
    
    # CORS Configuration
    allowed_origins_str = os.getenv("ALLOWED_ORIGINS", '["http://localhost:3000"]')
    try:
        allowed_origins = json.loads(allowed_origins_str)
    except json.JSONDecodeError:
        logger.error("Invalid ALLOWED_ORIGINS format, using default")
        allowed_origins = ["http://localhost:3000"]
    
    if is_production:
        # CRITICAL: Use actual production domains
        production_origins = [
            "https://your-frontend-domain.com",
            "https://www.your-frontend-domain.com"
        ]
        logger.info(f"Production mode: Using origins {production_origins}")
        allowed_origins = production_origins
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )
    
    # Security Headers Middleware
    app.add_middleware(SecurityHeadersMiddleware)
    
    # Trusted Host Middleware (Production)
    if is_production:
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=["your-api-domain.com", "www.your-api-domain.com"]
        )
    
    # Session Middleware
    secret_key = os.getenv("SECRET_KEY", "change-this-in-production")
    if secret_key == "change-this-in-production" and is_production:
        logger.error("CRITICAL: Default secret key detected in production!")
    
    app.add_middleware(
        SessionMiddleware,
        secret_key=secret_key,
        https_only=is_production,
        same_site="lax" if is_production else "none"
    )
    
    # Rate Limiting
    max_requests = int(os.getenv("MAX_REQUESTS_PER_MINUTE", "60"))
    app.add_middleware(RateLimitMiddleware, max_requests=max_requests)
    
    logger.info(f"Security middleware configured for {'production' if is_production else 'development'}")
    return app