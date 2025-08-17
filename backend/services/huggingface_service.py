import os
import asyncio
import logging
from typing import Dict, List, Optional, Any
from transformers import (
    AutoTokenizer, AutoModelForCausalLM, AutoModelForSequenceClassification,
    pipeline, Pipeline
)
import torch
from huggingface_hub import login
import json

logger = logging.getLogger(__name__)

class HuggingFaceService:
    """
    Comprehensive Hugging Face service for AI model operations
    Uses free, open-source models for various NLP tasks
    """
    
    def __init__(self):
        self.hf_token = os.getenv('HUGGINGFACE_API_KEY')
        self.cache_dir = os.getenv('HF_CACHE_DIR', './models_cache')
        
        # Model configurations for free models
        self.model_configs = {
            'text_generation': {
                'model_name': 'microsoft/DialoGPT-medium',
                'task': 'text-generation'
            },
            'conversational': {
                'model_name': 'microsoft/DialoGPT-small',
                'task': 'conversational'
            },
            'sentiment': {
                'model_name': 'cardiffnlp/twitter-roberta-base-sentiment-latest',
                'task': 'sentiment-analysis'
            },
            'intent_classification': {
                'model_name': 'facebook/bart-large-mnli',
                'task': 'zero-shot-classification'
            },
            'multilingual_translation': {
                'model_name': 'Helsinki-NLP/opus-mt-en-fa',
                'task': 'translation'
            },
            'persian_generation': {
                'model_name': 'HooshvareLab/bert-fa-base-uncased',
                'task': 'fill-mask'
            }
        }
        
        # Pipeline storage
        self.pipelines: Dict[str, Pipeline] = {}
        self.models_loaded = False
        
        # Intent labels for zero-shot classification
        self.intent_labels = [
            "greeting", "question", "request_help", "thanks", "goodbye", 
            "weather_inquiry", "general_conversation", "complaint", "compliment"
        ]
        
        # Response templates for different intents (Persian)
        self.persian_responses = {
            "greeting": [
                "سلام! چطور می‌تونم کمکتون کنم؟",
                "درود! امیدوارم حالتون خوب باشه.",
                "سلام عزیز! چه خبر؟"
            ],
            "question": [
                "سوال جالبی پرسیدید! بذارید فکر کنم...",
                "این سوال خیلی مهمه. چی دوست دارید بدونید؟",
                "سوالتون رو متوجه شدم. کمی توضیح بدم:"
            ],
            "request_help": [
                "البته! خوشحال می‌شم کمکتون کنم.",
                "حتماً! بگید چطور می‌تونم مفید باشم.",
                "کمک کردن خوشحالم می‌کنه. چی نیاز دارید؟"
            ],
            "thanks": [
                "خواهش می‌کنم! خوشحالم که تونستم کمک کنم.",
                "قابل نداره! هر وقت نیاز داشتید بگید.",
                "ممنون از لطفتون!"
            ],
            "goodbye": [
                "خداحافظ! مراقب خودتون باشید.",
                "بای بای! امیدوارم روز خوبی داشته باشید.",
                "تا بعد! موفق باشید."
            ],
            "weather_inquiry": [
                "متاسفانه اطلاعات هواشناسی آنلاین ندارم، ولی امیدوارم هوا براتون مناسب باشه!",
                "هوا چطوره بیرون؟ امیدوارم آفتابی و دلپذیر باشه.",
                "برای اطلاعات دقیق هوا بهتره از منابع معتبر استفاده کنید."
            ],
            "general_conversation": [
                "جالبه! بیشتر توضیح بدید.",
                "متوجه شدم. چیز دیگه‌ای هم هست؟",
                "خیلی جالب بود! ادامه بدید."
            ],
            "complaint": [
                "متوجه نارضایتی شما هستم. چطور می‌تونم کمک کنم؟",
                "ببخشید که این اتفاق افتاده. بگید چکار کنم.",
                "نارضایتی شما برام مهمه. راه حلی پیدا می‌کنیم."
            ],
            "compliment": [
                "خیلی ممنون از لطفتون! خوشحالم.",
                "واقعاً ممنونم! انگیزه می‌ده.",
                "لطف دارید! خوشحال می‌شم بیشتر کمکتون کنم."
            ]
        }

    async def initialize(self):
        """Initialize Hugging Face service and load models"""
        try:
            logger.info("Initializing Hugging Face service...")
            
            # Login to Hugging Face if token is provided
            if self.hf_token:
                login(token=self.hf_token)
                logger.info("Logged into Hugging Face Hub")
            
            # Create cache directory
            os.makedirs(self.cache_dir, exist_ok=True)
            
            # Load models asynchronously
            await self._load_models()
            
            self.models_loaded = True
            logger.info("Hugging Face service initialized successfully!")
            
        except Exception as e:
            logger.error(f"Failed to initialize Hugging Face service: {e}")
            raise

    async def _load_models(self):
        """Load all required models"""
        try:
            logger.info("Loading Hugging Face models...")
            
            # Load conversational model for chat
            self.pipelines['conversational'] = pipeline(
                "conversational",
                model="microsoft/DialoGPT-small",
                cache_dir=self.cache_dir,
                device=0 if torch.cuda.is_available() else -1
            )
            
            # Load sentiment analysis model
            self.pipelines['sentiment'] = pipeline(
                "sentiment-analysis",
                model="cardiffnlp/twitter-roberta-base-sentiment-latest",
                device=0 if torch.cuda.is_available() else -1
            )
            
            # Load zero-shot classification for intent detection
            self.pipelines['intent'] = pipeline(
                "zero-shot-classification",
                model="facebook/bart-large-mnli",
                device=0 if torch.cuda.is_available() else -1
            )
            
            # Load text generation model
            self.pipelines['text_generation'] = pipeline(
                "text-generation",
                model="gpt2",
                device=0 if torch.cuda.is_available() else -1
            )
            
            logger.info("All models loaded successfully!")
            
        except Exception as e:
            logger.error(f"Failed to load models: {e}")
            # Fallback to basic models if advanced ones fail
            await self._load_fallback_models()

    async def _load_fallback_models(self):
        """Load basic fallback models if main models fail"""
        try:
            logger.info("Loading fallback models...")
            
            # Basic sentiment analysis
            self.pipelines['sentiment'] = pipeline(
                "sentiment-analysis",
                model="distilbert-base-uncased-finetuned-sst-2-english"
            )
            
            # Basic text generation
            self.pipelines['text_generation'] = pipeline(
                "text-generation",
                model="distilgpt2"
            )
            
            logger.info("Fallback models loaded successfully!")
            
        except Exception as e:
            logger.error(f"Failed to load fallback models: {e}")

    async def understand_intent(self, text: str) -> Dict[str, Any]:
        """Analyze text to understand user intent using zero-shot classification"""
        try:
            if 'intent' not in self.pipelines:
                # Fallback to rule-based intent detection
                return await self._rule_based_intent(text)
            
            # Use zero-shot classification for intent detection
            result = self.pipelines['intent'](text, self.intent_labels)
            
            return {
                "intent": result['labels'][0],
                "confidence": result['scores'][0],
                "all_scores": dict(zip(result['labels'], result['scores']))
            }
            
        except Exception as e:
            logger.error(f"Intent understanding failed: {e}")
            return await self._rule_based_intent(text)

    async def _rule_based_intent(self, text: str) -> Dict[str, Any]:
        """Fallback rule-based intent detection"""
        text_lower = text.lower()
        
        # Persian and English keywords
        if any(word in text_lower for word in ['سلام', 'درود', 'hello', 'hi', 'صبح بخیر']):
            return {"intent": "greeting", "confidence": 0.9}
        elif any(word in text_lower for word in ['ممنون', 'متشکر', 'thanks', 'thank you']):
            return {"intent": "thanks", "confidence": 0.9}
        elif any(word in text_lower for word in ['خداحافظ', 'بای', 'goodbye', 'bye']):
            return {"intent": "goodbye", "confidence": 0.9}
        elif any(word in text_lower for word in ['کمک', 'help', 'راهنمایی']):
            return {"intent": "request_help", "confidence": 0.8}
        elif any(word in text_lower for word in ['هوا', 'weather', 'آب و هوا']):
            return {"intent": "weather_inquiry", "confidence": 0.8}
        elif '?' in text or 'چرا' in text_lower or 'چگونه' in text_lower or 'why' in text_lower:
            return {"intent": "question", "confidence": 0.7}
        else:
            return {"intent": "general_conversation", "confidence": 0.5}

    async def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment of the input text"""
        try:
            if 'sentiment' not in self.pipelines:
                return {"sentiment": "neutral", "confidence": 0.5}
            
            result = self.pipelines['sentiment'](text)
            return {
                "sentiment": result[0]['label'].lower(),
                "confidence": result[0]['score']
            }
            
        except Exception as e:
            logger.error(f"Sentiment analysis failed: {e}")
            return {"sentiment": "neutral", "confidence": 0.5}

    async def generate_response(self, intent_data: Dict[str, Any], user_text: str = "") -> str:
        """Generate appropriate response based on intent and context"""
        try:
            intent = intent_data.get("intent", "general_conversation")
            confidence = intent_data.get("confidence", 0.5)
            
            # Get sentiment for emotional context
            sentiment_data = await self.analyze_sentiment(user_text)
            sentiment = sentiment_data.get("sentiment", "neutral")
            
            # Use Persian responses for high confidence intents
            if confidence > 0.6 and intent in self.persian_responses:
                responses = self.persian_responses[intent]
                import random
                base_response = random.choice(responses)
                
                # Modify response based on sentiment
                if sentiment == "negative" and intent == "greeting":
                    base_response = "سلام عزیز! امیدوارم حالتون بهتر بشه."
                elif sentiment == "positive" and intent == "greeting":
                    base_response += " انرژی مثبتتون عالیه!"
                
                return base_response
            
            # For lower confidence or unknown intents, try generative model
            if 'text_generation' in self.pipelines and user_text:
                try:
                    generated = self.pipelines['text_generation'](
                        user_text,
                        max_length=50,
                        num_return_sequences=1,
                        temperature=0.7,
                        pad_token_id=50256
                    )
                    return generated[0]['generated_text']
                except:
                    pass
            
            # Final fallback
            import random
            return random.choice(self.persian_responses["general_conversation"])
            
        except Exception as e:
            logger.error(f"Response generation failed: {e}")
            return "ببخشید، متوجه نشدم. می‌تونید دوباره بگید؟"

    async def generate_conversational_response(self, conversation_history: List[str]) -> str:
        """Generate response using conversational model"""
        try:
            if 'conversational' not in self.pipelines:
                return await self.generate_response({"intent": "general_conversation"})
            
            # Use the last few messages for context
            context = " ".join(conversation_history[-3:]) if conversation_history else ""
            
            result = self.pipelines['conversational'](context)
            return result.generated_responses[-1] if result.generated_responses else "متوجه نشدم."
            
        except Exception as e:
            logger.error(f"Conversational response failed: {e}")
            return "ببخشید، مشکلی پیش اومده. دوباره امتحان کنید."

    def is_ready(self) -> bool:
        """Check if the service is ready to use"""
        return self.models_loaded

    async def get_model_info(self) -> Dict[str, Any]:
        """Get information about loaded models"""
        return {
            "models_loaded": self.models_loaded,
            "available_pipelines": list(self.pipelines.keys()),
            "cache_directory": self.cache_dir,
            "device": "cuda" if torch.cuda.is_available() else "cpu",
            "model_configs": self.model_configs
        }