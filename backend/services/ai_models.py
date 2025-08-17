import asyncio
import logging
from typing import Dict, List
from .huggingface_service import HuggingFaceService

logger = logging.getLogger(__name__)

class AIModels:
    """
    AI Models service that uses Hugging Face models for intelligent conversations
    Maintains compatibility with existing interface while leveraging advanced models
    """
    def __init__(self):
        self.hf_service = HuggingFaceService()
        self.conversation_history = []
        self.models_ready = False
        
    async def load_models(self):
        """Load AI models using Hugging Face service"""
        try:
            logger.info("Loading Hugging Face AI models...")
            await self.hf_service.initialize()
            self.models_ready = True
            logger.info("AI models loaded successfully!")
        except Exception as e:
            logger.error(f"Failed to load AI models: {e}")
            # Continue with limited functionality
            self.models_ready = False
        
    def is_ready(self) -> bool:
        """Check if models are ready"""
        return self.models_ready and self.hf_service.is_ready()
        
    async def understand_intent(self, text: str) -> Dict:
        """Understand user intent from text using Hugging Face models"""
        try:
            if self.models_ready:
                return await self.hf_service.understand_intent(text)
            else:
                # Fallback to basic rule-based system
                return await self._fallback_intent(text)
        except Exception as e:
            logger.error(f"Intent understanding failed: {e}")
            return await self._fallback_intent(text)
    
    async def _fallback_intent(self, text: str) -> Dict:
        """Fallback intent detection when models aren't available"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ['سلام', 'درود', 'صبح بخیر', 'عصر بخیر', 'hello', 'hi']):
            return {"intent": "greeting", "confidence": 0.9}
        elif any(word in text_lower for word in ['هوا', 'آب و هوا', 'بارون', 'آفتاب', 'weather']):
            return {"intent": "weather_inquiry", "confidence": 0.8}
        elif any(word in text_lower for word in ['کمک', 'راهنمایی', 'لطف', 'help']):
            return {"intent": "request_help", "confidence": 0.85}
        elif any(word in text_lower for word in ['ممنون', 'متشکر', 'سپاس', 'thanks']):
            return {"intent": "thanks", "confidence": 0.9}
        elif any(word in text_lower for word in ['خداحافظ', 'بای', 'فعلاً', 'goodbye', 'bye']):
            return {"intent": "goodbye", "confidence": 0.9}
        else:
            return {"intent": "general_conversation", "confidence": 0.5}
            
    async def generate_response(self, intent_data: Dict, user_text: str = "") -> str:
        """Generate appropriate response based on intent using Hugging Face models"""
        try:
            # Store conversation for context
            if user_text:
                self.conversation_history.append(user_text)
                # Keep only last 10 messages for context
                if len(self.conversation_history) > 10:
                    self.conversation_history = self.conversation_history[-10:]
            
            if self.models_ready:
                response = await self.hf_service.generate_response(intent_data, user_text)
                
                # Store AI response in history too
                if response:
                    self.conversation_history.append(response)
                
                return response
            else:
                # Fallback to basic responses
                return await self._fallback_response(intent_data)
                
        except Exception as e:
            logger.error(f"Response generation failed: {e}")
            return await self._fallback_response(intent_data)
    
    async def _fallback_response(self, intent_data: Dict) -> str:
        """Fallback response generation when models aren't available"""
        intent = intent_data.get("intent", "general_conversation")
        
        fallback_responses = {
            "greeting": "سلام! چطور می‌تونم کمکتون کنم؟",
            "weather_inquiry": "متاسفانه اطلاعات هواشناسی ندارم، ولی امیدوارم هوا براتون مناسب باشه!",
            "request_help": "البته! خوشحال می‌شم کمکتون کنم.",
            "thanks": "خواهش می‌کنم! خوشحالم که تونستم کمک کنم.",
            "goodbye": "خداحافظ! مراقب خودتون باشید.",
            "general_conversation": "جالبه! بیشتر توضیح بدید."
        }
        
        return fallback_responses.get(intent, "متوجه نشدم. می‌تونید دوباره بگید؟")
    
    async def get_model_info(self) -> Dict:
        """Get information about loaded models"""
        if self.models_ready:
            return await self.hf_service.get_model_info()
        else:
            return {
                "models_loaded": False,
                "status": "fallback_mode",
                "message": "Using basic rule-based responses"
            }