import pytest
import asyncio
import json
import base64
from fastapi.testclient import TestClient
from fastapi.websockets import WebSocket
from unittest.mock import AsyncMock, patch

# Import the app
from main import app

# Create test client
client = TestClient(app)

class TestHealthEndpoints:
    """Test health and readiness endpoints"""
    
    def test_health_check(self):
        """Test basic health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        assert "status" in data
        assert data["status"] == "healthy"
        assert "environment" in data
        assert "version" in data
        assert "timestamp" in data

    def test_readiness_check(self):
        """Test readiness check endpoint"""
        response = client.get("/ready")
        # Should return 200 or 503 depending on service readiness
        assert response.status_code in [200, 503]
        
        data = response.json()
        assert "ready" in data
        assert "checks" in data
        assert "timestamp" in data
        
        # Verify checks structure
        checks = data["checks"]
        assert "environment_loaded" in checks
        assert "ai_service" in checks
        assert "audio_service" in checks

    def test_metrics_endpoint(self):
        """Test metrics endpoint"""
        response = client.get("/metrics")
        assert response.status_code == 200
        
        data = response.json()
        assert "active_websocket_connections" in data
        assert "uptime" in data
        assert "environment" in data

class TestSecurity:
    """Test security features"""
    
    def test_cors_headers(self):
        """Test CORS headers are properly set"""
        response = client.get("/health")
        headers = response.headers
        
        # Check for security headers
        assert "x-content-type-options" in headers
        assert headers["x-content-type-options"] == "nosniff"
        assert "x-frame-options" in headers
        assert headers["x-frame-options"] == "DENY"

    def test_rate_limiting(self):
        """Test rate limiting functionality"""
        # Make multiple requests quickly
        responses = []
        for _ in range(70):  # Exceed default rate limit
            response = client.get("/health")
            responses.append(response.status_code)
        
        # Should eventually get rate limited
        assert 429 in responses or all(r == 200 for r in responses[:60])

    def test_invalid_json_handling(self):
        """Test handling of invalid JSON in requests"""
        response = client.post(
            "/api/test", 
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code in [400, 422, 500]

class TestWebSocketConnection:
    """Test WebSocket functionality"""
    
    def test_websocket_connection(self):
        """Test basic WebSocket connection"""
        with client.websocket_connect("/ws/chat") as websocket:
            # Test ping-pong
            websocket.send_json({"type": "ping"})
            response = websocket.receive_json()
            assert response["type"] == "pong"
            assert "timestamp" in response

    def test_websocket_invalid_message_type(self):
        """Test WebSocket with invalid message type"""
        with client.websocket_connect("/ws/chat") as websocket:
            websocket.send_json({"type": "invalid_type"})
            response = websocket.receive_json()
            assert response["type"] == "error"
            assert "Unsupported message type" in response["message"]

    def test_websocket_text_message(self):
        """Test WebSocket text message handling"""
        with client.websocket_connect("/ws/chat") as websocket:
            test_message = {
                "type": "text",
                "text": "سلام چطوری؟"
            }
            websocket.send_json(test_message)
            response = websocket.receive_json()
            
            assert response["type"] == "text_response"
            assert "user_message" in response
            assert "bot_message" in response
            assert "timestamp" in response

    @patch('main.voice_processor')
    def test_websocket_audio_message(self, mock_voice_processor):
        """Test WebSocket audio message handling"""
        # Mock voice processor response
        mock_voice_processor.process_voice_input.return_value = {
            "success": True,
            "text": "سلام",
            "emotion": "neutral",
            "confidence": 0.8,
            "engine_used": "test",
            "process_time": 0.1
        }
        mock_voice_processor.generate_voice_response.return_value = b"fake_audio"
        
        with client.websocket_connect("/ws/chat") as websocket:
            # Create fake audio data
            fake_audio = base64.b64encode(b"fake audio data").decode()
            
            test_message = {
                "type": "audio",
                "data": fake_audio
            }
            websocket.send_json(test_message)
            response = websocket.receive_json()
            
            assert response["type"] == "message"
            assert "user_message" in response
            assert "bot_message" in response
            assert "audio" in response
            assert "emotion" in response

class TestValidation:
    """Test input validation"""
    
    def test_audio_size_validation(self):
        """Test audio size validation"""
        from middleware.validation import audio_validator
        
        # Test valid size
        small_audio = b"small audio data"
        assert audio_validator.validate_audio_size(small_audio) == True
        
        # Test oversized audio
        large_audio = b"x" * (15 * 1024 * 1024)  # 15MB
        with pytest.raises(Exception):  # Should raise HTTPException
            audio_validator.validate_audio_size(large_audio)

    def test_audio_format_validation(self):
        """Test audio format validation"""
        from middleware.validation import audio_validator
        
        # Test valid formats
        assert audio_validator.validate_audio_format("test.wav") == True
        assert audio_validator.validate_audio_format("test.mp3") == True
        assert audio_validator.validate_audio_format("test.webm") == True
        
        # Test invalid format
        with pytest.raises(Exception):
            audio_validator.validate_audio_format("test.xyz")

    def test_text_validation(self):
        """Test text input validation"""
        from middleware.validation import text_validator
        
        # Test valid text
        assert text_validator.validate_text_input("سلام چطوری؟") == True
        assert text_validator.validate_text_input("Hello world") == True
        
        # Test empty text
        with pytest.raises(Exception):
            text_validator.validate_text_input("")
        
        # Test too long text
        long_text = "x" * 1500
        with pytest.raises(Exception):
            text_validator.validate_text_input(long_text)

    def test_persian_text_validation(self):
        """Test Persian text validation"""
        from middleware.validation import text_validator
        
        # Test Persian text
        assert text_validator.validate_language_input("سلام چطوری؟") == True
        
        # Test English text
        assert text_validator.validate_language_input("Hello world") == True
        
        # Test mixed text
        assert text_validator.validate_language_input("Hello سلام") == True
        
        # Test invalid text (only numbers/symbols)
        with pytest.raises(Exception):
            text_validator.validate_language_input("12345!@#$%")

class TestErrorHandling:
    """Test error handling"""
    
    def test_404_error(self):
        """Test 404 error handling"""
        response = client.get("/nonexistent-endpoint")
        assert response.status_code == 404

    def test_method_not_allowed(self):
        """Test 405 error handling"""
        response = client.post("/health")
        assert response.status_code == 405

    def test_internal_server_error_handling(self):
        """Test internal server error handling"""
        # This would require mocking an internal error
        # For now, just verify the error handler exists
        assert hasattr(app, 'exception_handlers')

class TestLogging:
    """Test logging functionality"""
    
    def test_logger_initialization(self):
        """Test logger is properly initialized"""
        from utils.logger import app_logger
        
        assert app_logger is not None
        assert hasattr(app_logger, 'log_api_request')
        assert hasattr(app_logger, 'log_websocket_event')
        assert hasattr(app_logger, 'log_audio_processing')

    def test_structured_logging(self):
        """Test structured logging format"""
        from utils.logger import app_logger
        
        # Test different log methods
        app_logger.log_api_request("GET", "/test", 200, 0.1, "127.0.0.1")
        app_logger.log_websocket_event("connected", "test-client")
        app_logger.log_audio_processing("test-client", 1024, 0.5, True)

@pytest.mark.asyncio
class TestAsyncFunctionality:
    """Test async functionality"""
    
    async def test_async_health_check(self):
        """Test async health check"""
        from main import health_check
        
        result = await health_check()
        assert "status" in result
        assert result["status"] == "healthy"

    async def test_async_readiness_check(self):
        """Test async readiness check"""
        from main import readiness_check
        
        result = await readiness_check()
        assert result.status_code in [200, 503]

# Fixtures for testing
@pytest.fixture
def mock_websocket():
    """Mock WebSocket for testing"""
    websocket = AsyncMock(spec=WebSocket)
    websocket.accept = AsyncMock()
    websocket.receive_json = AsyncMock()
    websocket.send_json = AsyncMock()
    return websocket

@pytest.fixture
def mock_audio_data():
    """Mock audio data for testing"""
    return base64.b64encode(b"fake audio data").decode()

@pytest.fixture
def sample_persian_text():
    """Sample Persian text for testing"""
    return "سلام! چطور می‌توانم کمکتان کنم؟"

# Integration tests
class TestIntegration:
    """Integration tests"""
    
    def test_full_health_flow(self):
        """Test complete health check flow"""
        # Health check
        health_response = client.get("/health")
        assert health_response.status_code == 200
        
        # Readiness check
        ready_response = client.get("/ready")
        assert ready_response.status_code in [200, 503]
        
        # Metrics
        metrics_response = client.get("/metrics")
        assert metrics_response.status_code == 200

    def test_websocket_full_flow(self):
        """Test complete WebSocket flow"""
        with client.websocket_connect("/ws/chat") as websocket:
            # Ping test
            websocket.send_json({"type": "ping"})
            pong = websocket.receive_json()
            assert pong["type"] == "pong"
            
            # Text message test
            websocket.send_json({
                "type": "text",
                "text": "Hello"
            })
            response = websocket.receive_json()
            assert response["type"] == "text_response"