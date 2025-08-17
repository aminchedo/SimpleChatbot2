import os
from fastapi import FastAPI, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import uvicorn
import asyncio
import base64
import json
from datetime import datetime
import uuid

# Load environment variables
load_dotenv()

# Import middleware and utilities
from middleware.security import setup_security_middleware
from middleware.validation import audio_validator, text_validator, websocket_validator
from utils.logger import app_logger

# Import existing services
try:
    from websocket.connection_manager import ConnectionManager
    from services.ai_models import AIModels
    from services.audio_processor import VoiceProcessor
except ImportError as e:
    app_logger.log_error("import_error", f"Failed to import services: {e}")
    # Create placeholder services for development
    class ConnectionManager:
        def __init__(self):
            self.connections = {}
        async def connect(self, websocket: WebSocket):
            client_id = str(uuid.uuid4())
            self.connections[client_id] = websocket
            return client_id
        def disconnect(self, client_id: str):
            if client_id in self.connections:
                del self.connections[client_id]
        async def send_personal_message(self, message: dict, websocket: WebSocket):
            await websocket.send_json(message)
    
    class AIModels:
        def __init__(self):
            pass
        async def load_models(self):
            app_logger.log_info("AI models loaded (placeholder)")
        def is_ready(self):
            return True
        async def understand_intent(self, text: str):
            return {"intent": "chat", "confidence": 0.8}
        async def generate_response(self, intent_data: dict, user_text: str = ""):
            return "سلام! چطور می‌توانم کمکتان کنم؟"
    
    class VoiceProcessor:
        def __init__(self):
            pass
        def is_ready(self):
            return True
        async def process_voice_input(self, audio_data: bytes):
            return {
                "success": True,
                "text": "سلام",
                "emotion": "neutral",
                "confidence": 0.8,
                "engine_used": "placeholder",
                "process_time": 0.1
            }
        async def generate_voice_response(self, text: str, emotion: str = "neutral"):
            return b"fake_audio_data"

# Initialize FastAPI app
app = FastAPI(
    title="Persian AI Chatbot API",
    description="Real-time Persian voice chatbot with AI capabilities",
    version="1.0.0",
    docs_url="/docs" if os.getenv("DEBUG", "false").lower() == "true" else None,
    redoc_url="/redoc" if os.getenv("DEBUG", "false").lower() == "true" else None
)

# Setup security middleware
app = setup_security_middleware(app)

# Initialize services
connection_manager = ConnectionManager()
ai_models = AIModels()
voice_processor = VoiceProcessor()

@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    app_logger.log_info("Starting Persian AI Chatbot API...")
    
    try:
        # Load AI models
        await ai_models.load_models()
        app_logger.log_info("AI models loaded successfully")
        
        # Log startup information
        app_logger.log_info("API startup completed", extra={
            "event_type": "startup",
            "environment": os.getenv("ENVIRONMENT", "development"),
            "debug_mode": os.getenv("DEBUG", "false").lower() == "true"
        })
        
    except Exception as e:
        app_logger.log_error("startup_error", f"Failed to start application: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event"""
    app_logger.log_info("Shutting down Persian AI Chatbot API...")

# Health check endpoints
@app.get("/health")
async def health_check():
    """Basic health check"""
    return {
        "status": "healthy",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/ready")
async def readiness_check():
    """Production readiness check"""
    checks = {
        "environment_loaded": bool(os.getenv("SECRET_KEY")),
        "ai_service": ai_models.is_ready() if hasattr(ai_models, 'is_ready') else True,
        "audio_service": voice_processor.is_ready() if hasattr(voice_processor, 'is_ready') else True,
        "websocket_connections": websocket_validator.get_active_count()
    }
    
    all_ready = all(checks.values()) if isinstance(checks["websocket_connections"], int) else all([v for k, v in checks.items() if k != "websocket_connections"])
    
    return JSONResponse(
        status_code=200 if all_ready else 503,
        content={
            "ready": all_ready,
            "checks": checks,
            "timestamp": datetime.now().isoformat()
        }
    )

@app.get("/metrics")
async def metrics():
    """Basic metrics endpoint"""
    return {
        "active_websocket_connections": websocket_validator.get_active_count(),
        "uptime": datetime.now().isoformat(),
        "environment": os.getenv("ENVIRONMENT", "development")
    }

# WebSocket endpoint with enhanced security and logging
@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    client_id = str(uuid.uuid4())
    
    try:
        # Validate connection limits
        websocket_validator.validate_connection_limit(client_id)
        
        # Accept connection
        await websocket.accept()
        client_id = await connection_manager.connect(websocket)
        websocket_validator.add_connection(client_id)
        
        app_logger.log_websocket_event("connected", client_id)
        
        while True:
            try:
                # Receive data with timeout
                data = await asyncio.wait_for(websocket.receive_json(), timeout=30.0)
                
                if data.get("type") == "ping":
                    await websocket.send_json({"type": "pong", "timestamp": datetime.now().isoformat()})
                    continue
                
                if data.get("type") == "audio":
                    await handle_audio_message(websocket, data, client_id)
                elif data.get("type") == "text":
                    await handle_text_message(websocket, data, client_id)
                else:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Unsupported message type",
                        "timestamp": datetime.now().isoformat()
                    })
                
            except asyncio.TimeoutError:
                app_logger.log_websocket_event("timeout", client_id)
                await websocket.send_json({
                    "type": "timeout",
                    "message": "Connection timeout",
                    "timestamp": datetime.now().isoformat()
                })
                break
                
            except json.JSONDecodeError:
                app_logger.log_websocket_event("invalid_json", client_id)
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON format",
                    "timestamp": datetime.now().isoformat()
                })
                
    except WebSocketDisconnect:
        app_logger.log_websocket_event("disconnected", client_id)
    except Exception as e:
        app_logger.log_error("websocket_error", str(e), client_id)
    finally:
        connection_manager.disconnect(client_id)
        websocket_validator.remove_connection(client_id)

async def handle_audio_message(websocket: WebSocket, data: dict, client_id: str):
    """Handle audio message processing"""
    start_time = datetime.now()
    
    try:
        # Decode and validate audio
        audio_data = base64.b64decode(data["data"])
        audio_validator.validate_audio_size(audio_data)
        
        app_logger.log_audio_processing(client_id, len(audio_data), 0, True)
        
        # Process voice input
        voice_result = await voice_processor.process_voice_input(audio_data)
        
        if not voice_result.get('success', False):
            error_response = {
                "type": "error",
                "message": voice_result.get('message', 'Voice processing failed'),
                "timestamp": datetime.now().isoformat()
            }
            await connection_manager.send_personal_message(error_response, websocket)
            return
        
        # Validate extracted text
        extracted_text = voice_result.get('text', '')
        if extracted_text:
            text_validator.validate_text_input(extracted_text)
            text_validator.validate_language_input(extracted_text)
        
        # Process with AI
        intent_data = await ai_models.understand_intent(extracted_text)
        intent_data['emotion'] = voice_result.get('emotion', 'neutral')
        
        response_text = await ai_models.generate_response(intent_data, extracted_text)
        
        # Generate voice response
        response_audio = await voice_processor.generate_voice_response(
            response_text, 
            voice_result.get('emotion', 'neutral')
        )
        
        # Send response
        processing_time = (datetime.now() - start_time).total_seconds()
        response = {
            "type": "message",
            "user_message": extracted_text,
            "bot_message": response_text,
            "audio": base64.b64encode(response_audio).decode(),
            "timestamp": datetime.now().isoformat(),
            "emotion": voice_result.get('emotion', 'neutral'),
            "confidence": voice_result.get('confidence', 0.0),
            "engine_used": voice_result.get('engine_used', 'unknown'),
            "process_time": processing_time
        }
        
        await connection_manager.send_personal_message(response, websocket)
        
        app_logger.log_audio_processing(client_id, len(audio_data), processing_time, True)
        
    except Exception as e:
        processing_time = (datetime.now() - start_time).total_seconds()
        app_logger.log_audio_processing(client_id, len(audio_data) if 'audio_data' in locals() else 0, processing_time, False, str(e))
        
        error_audio = await voice_processor.generate_voice_response(
            "متاسفانه خطایی رخ داد. لطفاً دوباره تلاش کنید.", 
            "sad"
        )
        
        error_response = {
            "type": "error",
            "message": "خطا در پردازش صدا",
            "audio": base64.b64encode(error_audio).decode(),
            "timestamp": datetime.now().isoformat()
        }
        await connection_manager.send_personal_message(error_response, websocket)

async def handle_text_message(websocket: WebSocket, data: dict, client_id: str):
    """Handle text message processing"""
    start_time = datetime.now()
    
    try:
        text_input = data.get("text", "")
        text_validator.validate_text_input(text_input)
        text_validator.validate_language_input(text_input)
        
        # Process with AI
        intent_data = await ai_models.understand_intent(text_input)
        response_text = await ai_models.generate_response(intent_data, text_input)
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        response = {
            "type": "text_response",
            "user_message": text_input,
            "bot_message": response_text,
            "timestamp": datetime.now().isoformat(),
            "process_time": processing_time
        }
        
        await connection_manager.send_personal_message(response, websocket)
        
        app_logger.log_ai_inference("text_model", len(text_input), len(response_text), processing_time, client_id)
        
    except Exception as e:
        app_logger.log_error("text_processing_error", str(e), client_id)
        
        error_response = {
            "type": "error",
            "message": "خطا در پردازش متن",
            "timestamp": datetime.now().isoformat()
        }
        await connection_manager.send_personal_message(error_response, websocket)

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    app_logger.log_error("http_exception", exc.detail, additional_data={"status_code": exc.status_code})
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.detail,
            "status_code": exc.status_code,
            "timestamp": datetime.now().isoformat()
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    app_logger.log_error("general_exception", str(exc))
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "message": "Internal server error",
            "status_code": 500,
            "timestamp": datetime.now().isoformat()
        }
    )

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "false").lower() == "true"
    
    app_logger.log_info(f"Starting server on {host}:{port} (debug={debug})")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info" if not debug else "debug",
        access_log=True
    )