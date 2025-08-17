from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import asyncio
import base64
import json
import logging
from datetime import datetime
from typing import Dict, List
import uvicorn
from services.audio_processor import VoiceProcessor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Persian AI Chatbot API",
    description="Advanced Persian AI Chatbot with Audio Processing",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://your-app.vercel.app",
        "https://*.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global services (will be initialized on startup)
audio_processor = None
ai_models = None
voice_processor = None
connection_manager = None

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"Client disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        try:
            await websocket.send_text(json.dumps(message, ensure_ascii=False))
        except Exception as e:
            logger.error(f"Error sending message: {e}")

# Mock AI Services (replace with actual implementations)
class MockAudioProcessor:
    async def preprocess_audio(self, audio_data: bytes) -> bytes:
        logger.info("Processing audio...")
        await asyncio.sleep(1)  # Simulate processing
        return audio_data

    async def transcribe_audio(self, audio_data: bytes) -> str:
        logger.info("Transcribing audio...")
        await asyncio.sleep(2)  # Simulate transcription
        return "سلام، چطور می‌توانم کمکتان کنم؟"

class MockAIModels:
    async def load_models(self):
        logger.info("Loading AI models...")
        await asyncio.sleep(2)  # Simulate model loading

    async def understand_intent(self, text: str) -> dict:
        return {
            "intent": "greeting",
            "confidence": 0.95,
            "entities": []
        }

    async def generate_response(self, intent_data: dict) -> str:
        responses = [
            "سلام! خوشحالم که با شما صحبت می‌کنم.",
            "چطور می‌توانم به شما کمک کنم؟",
            "امروز چه کاری برایتان انجام دهم؟",
            "من اینجا هستم تا به شما کمک کنم.",
        ]
        import random
        return random.choice(responses)

    async def synthesize_speech(self, text: str) -> bytes:
        logger.info(f"Synthesizing speech for: {text[:50]}...")
        await asyncio.sleep(1)  # Simulate TTS
        return b"mock_audio_data"

@app.on_event("startup")
async def startup_event():
    global audio_processor, ai_models, connection_manager
    
    logger.info("Starting up Persian AI Chatbot API...")
    
    # Initialize services
    audio_processor = MockAudioProcessor()
    ai_models = MockAIModels()
    voice_processor = VoiceProcessor()
    connection_manager = ConnectionManager()
    
    # Load AI models
    await ai_models.load_models()
    
    logger.info("Startup complete!")

@app.get("/")
async def root():
    return {
        "message": "Persian AI Chatbot API",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "audio_processor": audio_processor is not None,
            "ai_models": ai_models is not None,
            "websocket": connection_manager is not None
        }
    }

@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await connection_manager.connect(websocket)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            logger.info(f"Received message type: {message_data.get('type')}")
            
            if message_data["type"] == "audio":
                try:
                    # Decode audio
                    audio_data = base64.b64decode(message_data["data"])
                    logger.info(f"Received audio: {len(audio_data)} bytes")
                    
                    # REAL-TIME VOICE PROCESSING
                    voice_result = await voice_processor.process_voice_input(audio_data)
                    
                    if not voice_result['success']:
                        error_response = {
                            "type": "message",
                            "user_message": "",
                            "bot_message": voice_result['message'],
                            "audio": base64.b64encode(voice_result['audio']).decode(),
                            "timestamp": datetime.now().isoformat(),
                            "emotion": "sad"
                        }
                        await connection_manager.send_personal_message(error_response, websocket)
                        continue
                    
                    # Understand intent using existing AI models
                    intent_data = await ai_models.understand_intent(voice_result['text'])
                    intent_data['emotion'] = voice_result['emotion']
                    
                    # Generate response
                    response_text = await ai_models.generate_response(intent_data)
                    
                    # Generate emotional voice response
                    response_audio = await voice_processor.generate_voice_response(
                        response_text, 
                        voice_result['emotion']
                    )
                    
                    # Send complete voice response
                    response = {
                        "type": "message",
                        "user_message": voice_result['text'],
                        "bot_message": response_text,
                        "audio": base64.b64encode(response_audio).decode(),
                        "timestamp": datetime.now().isoformat(),
                        "emotion": voice_result['emotion'],
                        "confidence": voice_result['confidence'],
                        "engine_used": voice_result['engine_used'],
                        "process_time": voice_result['process_time']
                    }
                    
                    await connection_manager.send_personal_message(response, websocket)
                    
                    logger.info(f"Voice conversation: '{voice_result['text']}' -> '{response_text}' [{voice_result['emotion']}]")
                    
                except Exception as e:
                    logger.error(f"Voice processing error: {e}")
                    error_audio = await voice_processor.generate_voice_response(
                        "متاسفانه خطایی رخ داد. لطفاً دوباره تلاش کنید."
                    )
                    
                    error_response = {
                        "type": "error",
                        "message": "خطا در پردازش صدا",
                        "audio": base64.b64encode(error_audio).decode(),
                        "timestamp": int(datetime.now().timestamp() * 1000)
                    }
                    await connection_manager.send_personal_message(error_response, websocket)
            
            elif message_data["type"] == "text":
                # Handle text messages
                try:
                    text = message_data["content"]
                    intent_data = await ai_models.understand_intent(text)
                    response_text = await ai_models.generate_response(intent_data)
                    
                    response = {
                        "type": "message",
                        "bot_message": {
                            "id": f"bot_{datetime.now().timestamp()}",
                            "type": "bot",
                            "content": response_text,
                            "timestamp": int(datetime.now().timestamp() * 1000)
                        }
                    }
                    
                    await connection_manager.send_personal_message(response, websocket)
                    
                except Exception as e:
                    logger.error(f"Error processing text: {e}")
                    error_response = {
                        "type": "error",
                        "message": "خطا در پردازش متن. لطفاً دوباره تلاش کنید.",
                        "timestamp": int(datetime.now().timestamp() * 1000)
                    }
                    await connection_manager.send_personal_message(error_response, websocket)
                    
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        connection_manager.disconnect(websocket)

@app.post("/api/upload-audio")
async def upload_audio(file: UploadFile = File(...)):
    """Upload audio file for processing"""
    try:
        audio_data = await file.read()
        
        # Process audio
        processed_audio = await audio_processor.preprocess_audio(audio_data)
        transcription = await audio_processor.transcribe_audio(processed_audio)
        
        return {
            "success": True,
            "transcription": transcription,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error processing uploaded audio: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
        )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )