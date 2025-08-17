from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import base64
import json
from datetime import datetime
import logging
from services.audio_processor import VoiceProcessor
from services.ai_models import AIModels
from websocket.connection_manager import ConnectionManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Persian AI Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://yourapp.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
voice_processor = VoiceProcessor()
ai_models = AIModels()
connection_manager = ConnectionManager()

@app.on_event("startup")
async def startup_event():
    logger.info("Starting Persian AI Chatbot API...")
    await ai_models.load_models()
    logger.info("API ready!")

@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await connection_manager.connect(websocket)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data["type"] == "audio":
                try:
                    # Decode audio
                    audio_data = base64.b64decode(data["data"])
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
                    
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket)

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)