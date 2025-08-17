import logging
import sys
from datetime import datetime
import json
import os
from typing import Dict, Any, Optional

class StructuredLogger:
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self.setup_logging()
    
    def setup_logging(self):
        # Create logs directory
        os.makedirs("logs", exist_ok=True)
        
        # Clear existing handlers
        self.logger.handlers.clear()
        
        # Configure formatters
        json_formatter = JsonFormatter()
        console_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        
        # File handler
        log_file = os.getenv("LOG_FILE_PATH", f"logs/app_{datetime.now().strftime('%Y%m%d')}.log")
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(json_formatter)
        file_handler.setLevel(logging.INFO)
        
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(console_formatter)
        console_handler.setLevel(logging.INFO)
        
        # Configure logger
        log_level = os.getenv("LOG_LEVEL", "INFO").upper()
        self.logger.setLevel(getattr(logging, log_level, logging.INFO))
        self.logger.addHandler(file_handler)
        self.logger.addHandler(console_handler)
        
        # Prevent duplicate logs
        self.logger.propagate = False
    
    def log_api_request(self, method: str, endpoint: str, status_code: int, response_time: float, client_ip: str = None):
        """Log API request with structured data"""
        self.logger.info("API request", extra={
            "event_type": "api_request",
            "method": method,
            "endpoint": endpoint,
            "status_code": status_code,
            "response_time": response_time,
            "client_ip": client_ip
        })
    
    def log_websocket_event(self, event_type: str, client_id: str, data: Optional[Dict] = None):
        """Log WebSocket events"""
        self.logger.info("WebSocket event", extra={
            "event_type": "websocket",
            "ws_event": event_type,
            "client_id": client_id,
            "data": data
        })
    
    def log_audio_processing(self, client_id: str, audio_size: int, processing_time: float, success: bool, error: str = None):
        """Log audio processing events"""
        self.logger.info("Audio processing", extra={
            "event_type": "audio_processing",
            "client_id": client_id,
            "audio_size": audio_size,
            "processing_time": processing_time,
            "success": success,
            "error": error
        })
    
    def log_ai_inference(self, model_name: str, input_length: int, output_length: int, inference_time: float, client_id: str = None):
        """Log AI model inference"""
        self.logger.info("AI inference", extra={
            "event_type": "ai_inference",
            "model_name": model_name,
            "input_length": input_length,
            "output_length": output_length,
            "inference_time": inference_time,
            "client_id": client_id
        })
    
    def log_error(self, error_type: str, error_message: str, client_id: str = None, additional_data: Dict = None):
        """Log errors with structured data"""
        self.logger.error("Application error", extra={
            "event_type": "error",
            "error_type": error_type,
            "error_message": error_message,
            "client_id": client_id,
            "additional_data": additional_data or {}
        })
    
    def log_security_event(self, event_type: str, client_ip: str, details: str, severity: str = "medium"):
        """Log security-related events"""
        self.logger.warning("Security event", extra={
            "event_type": "security",
            "security_event": event_type,
            "client_ip": client_ip,
            "details": details,
            "severity": severity
        })

class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        
        # Add extra fields from the record
        for key, value in record.__dict__.items():
            if key not in ['name', 'msg', 'args', 'levelname', 'levelno', 
                          'pathname', 'filename', 'module', 'lineno', 
                          'funcName', 'created', 'msecs', 'relativeCreated', 
                          'thread', 'threadName', 'processName', 'process', 
                          'getMessage', 'exc_info', 'exc_text', 'stack_info', 
                          'message']:
                log_entry[key] = value
        
        # Handle exceptions
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        
        return json.dumps(log_entry, ensure_ascii=False, default=str)

class RequestLoggingMiddleware:
    """Middleware to log all HTTP requests"""
    
    def __init__(self, logger: StructuredLogger):
        self.logger = logger
    
    async def __call__(self, request, call_next):
        start_time = datetime.now()
        
        response = await call_next(request)
        
        process_time = (datetime.now() - start_time).total_seconds()
        
        self.logger.log_api_request(
            method=request.method,
            endpoint=str(request.url),
            status_code=response.status_code,
            response_time=process_time,
            client_ip=request.client.host
        )
        
        return response

# Global logger instance
app_logger = StructuredLogger("persian_chatbot")

# Convenience functions
def log_info(message: str, **kwargs):
    app_logger.logger.info(message, extra=kwargs)

def log_error(message: str, **kwargs):
    app_logger.logger.error(message, extra=kwargs)

def log_warning(message: str, **kwargs):
    app_logger.logger.warning(message, extra=kwargs)

def log_debug(message: str, **kwargs):
    app_logger.logger.debug(message, extra=kwargs)