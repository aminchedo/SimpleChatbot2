from fastapi import HTTPException, status
from typing import Any, Optional
import os
import json
import logging

logger = logging.getLogger(__name__)

class AudioValidator:
    def __init__(self):
        self.max_size_mb = int(os.getenv("MAX_AUDIO_SIZE_MB", "10"))
        self.max_size_bytes = self.max_size_mb * 1024 * 1024
        
        # Parse supported formats from environment
        supported_formats_str = os.getenv("SUPPORTED_AUDIO_FORMATS", '["webm","wav","mp3","ogg"]')
        try:
            self.allowed_formats = json.loads(supported_formats_str)
        except json.JSONDecodeError:
            logger.error("Invalid SUPPORTED_AUDIO_FORMATS format, using default")
            self.allowed_formats = ["webm", "wav", "mp3", "ogg"]
    
    def validate_audio_size(self, audio_data: bytes) -> bool:
        """Validate audio file size"""
        if len(audio_data) > self.max_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Audio file too large. Max size: {self.max_size_mb}MB"
            )
        return True
    
    def validate_audio_format(self, filename: str) -> bool:
        """Validate audio file format"""
        if not filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Filename is required"
            )
        
        file_extension = filename.lower().split('.')[-1] if '.' in filename else filename.lower()
        if file_extension not in self.allowed_formats:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported audio format '{file_extension}'. Allowed: {self.allowed_formats}"
            )
        return True
    
    def validate_audio_content(self, audio_data: bytes, filename: Optional[str] = None) -> bool:
        """Validate both size and format"""
        if filename:
            self.validate_audio_format(filename)
        self.validate_audio_size(audio_data)
        return True

class TextValidator:
    def __init__(self):
        self.max_length = int(os.getenv("MAX_TEXT_LENGTH", "1000"))
        self.min_length = int(os.getenv("MIN_TEXT_LENGTH", "1"))
    
    def validate_text_input(self, text: str, max_length: Optional[int] = None) -> bool:
        """Validate text input"""
        if not text or not text.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text input cannot be empty"
            )
        
        # Use provided max_length or default
        max_len = max_length or self.max_length
        
        if len(text) > max_len:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Text too long. Max length: {max_len} characters"
            )
        
        if len(text) < self.min_length:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Text too short. Min length: {self.min_length} characters"
            )
        
        return True
    
    def validate_language_input(self, text: str) -> bool:
        """Basic Persian/Farsi text validation"""
        # Check if text contains Persian characters
        persian_chars = any('\u0600' <= char <= '\u06FF' or '\uFB50' <= char <= '\uFDFF' for char in text)
        english_chars = any('a' <= char.lower() <= 'z' for char in text)
        
        # Allow mixed Persian/English text
        if not (persian_chars or english_chars):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text must contain Persian or English characters"
            )
        
        return True

class WebSocketValidator:
    def __init__(self):
        self.max_connections = int(os.getenv("MAX_WEBSOCKET_CONNECTIONS", "100"))
        self.active_connections = set()
    
    def validate_connection_limit(self, client_id: str) -> bool:
        """Validate WebSocket connection limits"""
        if len(self.active_connections) >= self.max_connections:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Maximum WebSocket connections reached"
            )
        return True
    
    def add_connection(self, client_id: str):
        """Add a new WebSocket connection"""
        self.active_connections.add(client_id)
    
    def remove_connection(self, client_id: str):
        """Remove a WebSocket connection"""
        self.active_connections.discard(client_id)
    
    def get_active_count(self) -> int:
        """Get count of active connections"""
        return len(self.active_connections)

# Global validator instances
audio_validator = AudioValidator()
text_validator = TextValidator()
websocket_validator = WebSocketValidator()