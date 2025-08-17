import os
import asyncio
import logging
from typing import Dict, List, Optional, Any
import json
import random
import requests
from datetime import datetime

logger = logging.getLogger(__name__)

class HuggingFaceService:
    """
    FREE Hugging Face service for AI model operations
    Uses completely free models and inference endpoints without requiring API keys
    """
    
    def __init__(self):
        # Optional token for better rate limits (but not required)
        self.hf_token = os.getenv('HUGGINGFACE_API_KEY', None)
        
        # Free Hugging Face Inference API endpoints
        self.inference_endpoints = {
            'text_generation': 'https://api-inference.huggingface.co/models/gpt2',
            'persian_generation': 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
            'sentiment': 'https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest',
            'intent_classification': 'https://api-inference.huggingface.co/models/facebook/bart-large-mnli'
        }
        
        self.models_loaded = True  # Always ready for free operation
        
        # Intent labels for zero-shot classification
        self.intent_labels = [
            "greeting", "question", "request_help", "thanks", "goodbye", 
            "weather_inquiry", "general_conversation", "complaint", "compliment"
        ]
        
        # Enhanced Persian responses with more variety
        self.persian_responses = {
            "greeting": [
                "سلام! چطور می‌تونم کمکتون کنم؟",
                "درود! امیدوارم حالتون خوب باشه.",
                "سلام عزیز! چه خبر؟",
                "سلام و احترام! خوش آمدید.",
                "درود بر شما! چطور می‌تونم مفید باشم؟"
            ],
            "question": [
                "سوال جالبی پرسیدید! بذارید فکر کنم...",
                "این سوال خیلی مهمه. چی دوست دارید بدونید؟",
                "سوالتون رو متوجه شدم. کمی توضیح بدم:",
                "سوال خوبی بود! اینطور فکر می‌کنم:",
                "جالبه که این رو پرسیدید. نظر من اینه:"
            ],
            "request_help": [
                "البته! خوشحال می‌شم کمکتون کنم.",
                "حتماً! بگید چطور می‌تونم مفید باشم.",
                "کمک کردن خوشحالم می‌کنه. چی نیاز دارید؟",
                "با کمال میل! چه کاری براتون انجام بدم؟",
                "آماده کمکم! بفرمایید چی می‌خواید."
            ],
            "thanks": [
                "خواهش می‌کنم! خوشحالم که تونستم کمک کنم.",
                "قابل نداره! هر وقت نیاز داشتید بگید.",
                "ممنون از لطفتون!",
                "خیلی خوشحالم که مفید بودم!",
                "وظیفه‌م بود! موفق باشید."
            ],
            "goodbye": [
                "خداحافظ! مراقب خودتون باشید.",
                "بای بای! امیدوارم روز خوبی داشته باشید.",
                "تا بعد! موفق باشید.",
                "خداحافظ عزیز! سلامت باشید.",
                "فعلاً! امیدوارم دوباره صحبت کنیم."
            ],
            "weather_inquiry": [
                "متاسفانه اطلاعات هواشناسی آنلاین ندارم، ولی امیدوارم هوا براتون مناسب باشه!",
                "هوا چطوره بیرون؟ امیدوارم آفتابی و دلپذیر باشه.",
                "برای اطلاعات دقیق هوا بهتره از منابع معتبر استفاده کنید.",
                "امیدوارم هوا خوب باشه! من متاسفانه دسترسی به اطلاعات هواشناسی ندارم.",
                "هوا که خوب باشه همه چیز بهتر میشه! چطوره امروز؟"
            ],
            "general_conversation": [
                "جالبه! بیشتر توضیح بدید.",
                "متوجه شدم. چیز دیگه‌ای هم هست؟",
                "خیلی جالب بود! ادامه بدید.",
                "این موضوع جذابه! نظرتون چیه؟",
                "باحال بود! چیز دیگه‌ای می‌خواید بگید؟"
            ],
            "complaint": [
                "متوجه نارضایتی شما هستم. چطور می‌تونم کمک کنم؟",
                "ببخشید که این اتفاق افتاده. بگید چکار کنم.",
                "نارضایتی شما برام مهمه. راه حلی پیدا می‌کنیم.",
                "واقعاً متاسفم. چطور می‌تونم جبران کنم؟",
                "درک می‌کنم که ناراحتید. بذارید کمکتون کنم."
            ],
            "compliment": [
                "خیلی ممنون از لطفتون! خوشحالم.",
                "واقعاً ممنونم! انگیزه می‌ده.",
                "لطف دارید! خوشحال می‌شم بیشتر کمکتون کنم.",
                "چقدر مهربونید! ممنون از حرف قشنگتون.",
                "دست شما درد نکنه! خیلی خوشحالم."
            ]
        }

    async def initialize(self):
        """Initialize service - always succeeds for free operation"""
        try:
            logger.info("Initializing FREE Hugging Face service...")
            
            # Test free API connectivity (optional)
            await self._test_connectivity()
            
            self.models_loaded = True
            logger.info("FREE Hugging Face service initialized successfully!")
            
        except Exception as e:
            logger.warning(f"API connectivity test failed, using offline mode: {e}")
            self.models_loaded = True  # Still work in offline mode

    async def _test_connectivity(self):
        """Test if free Hugging Face API is accessible"""
        try:
            headers = {}
            if self.hf_token:
                headers['Authorization'] = f'Bearer {self.hf_token}'
            
            # Test with a simple request
            response = requests.get(
                'https://api-inference.huggingface.co/models/gpt2',
                headers=headers,
                timeout=5
            )
            
            if response.status_code == 200:
                logger.info("Hugging Face API is accessible")
            else:
                logger.warning(f"Hugging Face API returned status: {response.status_code}")
                
        except Exception as e:
            logger.warning(f"Cannot reach Hugging Face API: {e}")

    async def understand_intent(self, text: str) -> Dict[str, Any]:
        """Analyze text to understand user intent using free methods"""
        try:
            # Try free API first
            if self.hf_token:
                result = await self._free_intent_classification(text)
                if result:
                    return result
            
            # Fallback to rule-based (always works)
            return await self._rule_based_intent(text)
            
        except Exception as e:
            logger.error(f"Intent understanding failed: {e}")
            return await self._rule_based_intent(text)

    async def _free_intent_classification(self, text: str) -> Optional[Dict[str, Any]]:
        """Use free Hugging Face API for intent classification"""
        try:
            headers = {'Authorization': f'Bearer {self.hf_token}'}
            
            payload = {
                "inputs": text,
                "parameters": {
                    "candidate_labels": self.intent_labels
                }
            }
            
            response = requests.post(
                self.inference_endpoints['intent_classification'],
                headers=headers,
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "intent": result['labels'][0],
                    "confidence": result['scores'][0],
                    "all_scores": dict(zip(result['labels'], result['scores']))
                }
                
        except Exception as e:
            logger.warning(f"Free API intent classification failed: {e}")
            
        return None

    async def _rule_based_intent(self, text: str) -> Dict[str, Any]:
        """Enhanced rule-based intent detection for Persian and English"""
        text_lower = text.lower()
        
        # Greeting patterns
        greeting_patterns = [
            'سلام', 'درود', 'hello', 'hi', 'صبح بخیر', 'عصر بخیر', 
            'شب بخیر', 'سلام علیکم', 'احوال', 'چطوری', 'how are you'
        ]
        
        # Thanks patterns  
        thanks_patterns = [
            'ممنون', 'متشکر', 'thanks', 'thank you', 'سپاس', 'مرسی',
            'دست شما درد نکنه', 'خیلی ممنون'
        ]
        
        # Goodbye patterns
        goodbye_patterns = [
            'خداحافظ', 'بای', 'goodbye', 'bye', 'فعلاً', 'تا بعد',
            'خدانگهدار', 'سلامت باشید'
        ]
        
        # Help patterns
        help_patterns = [
            'کمک', 'help', 'راهنمایی', 'لطف', 'می‌تونی', 'can you',
            'چطور', 'how to', 'بگو', 'tell me'
        ]
        
        # Weather patterns
        weather_patterns = [
            'هوا', 'weather', 'آب و هوا', 'بارون', 'باران', 'rain',
            'آفتاب', 'sun', 'برف', 'snow', 'سرد', 'cold', 'گرم', 'hot'
        ]
        
        # Question patterns
        question_patterns = [
            '?', 'چرا', 'چگونه', 'چطور', 'کی', 'کجا', 'چی', 'چه',
            'why', 'how', 'when', 'where', 'what', 'which'
        ]
        
        # Check patterns
        if any(word in text_lower for word in greeting_patterns):
            return {"intent": "greeting", "confidence": 0.9}
        elif any(word in text_lower for word in thanks_patterns):
            return {"intent": "thanks", "confidence": 0.9}
        elif any(word in text_lower for word in goodbye_patterns):
            return {"intent": "goodbye", "confidence": 0.9}
        elif any(word in text_lower for word in help_patterns):
            return {"intent": "request_help", "confidence": 0.8}
        elif any(word in text_lower for word in weather_patterns):
            return {"intent": "weather_inquiry", "confidence": 0.8}
        elif any(word in text_lower for word in question_patterns):
            return {"intent": "question", "confidence": 0.7}
        else:
            return {"intent": "general_conversation", "confidence": 0.5}

    async def generate_response(self, intent_data: Dict[str, Any], user_text: str = "") -> str:
        """Generate appropriate response using free methods"""
        try:
            intent = intent_data.get("intent", "general_conversation")
            confidence = intent_data.get("confidence", 0.5)
            
            # For high confidence intents, use Persian templates
            if confidence > 0.6 and intent in self.persian_responses:
                responses = self.persian_responses[intent]
                base_response = random.choice(responses)
                
                # Add contextual variations
                base_response = await self._add_context_to_response(base_response, user_text, intent)
                
                return base_response
            
            # Try free API for creative responses
            if self.hf_token and user_text and len(user_text.strip()) > 5:
                api_response = await self._free_text_generation(user_text)
                if api_response and len(api_response.strip()) > 10:
                    return api_response
            
            # Final fallback to Persian templates
            return random.choice(self.persian_responses["general_conversation"])
            
        except Exception as e:
            logger.error(f"Response generation failed: {e}")
            return "ببخشید، متوجه نشدم. می‌تونید دوباره بگید؟"

    async def _add_context_to_response(self, base_response: str, user_text: str, intent: str) -> str:
        """Add contextual information to responses"""
        try:
            # Add time-based greetings
            if intent == "greeting":
                hour = datetime.now().hour
                if 5 <= hour < 12:
                    base_response += " صبحتون بخیر!"
                elif 12 <= hour < 17:
                    base_response += " ظهرتون بخیر!"
                elif 17 <= hour < 20:
                    base_response += " عصرتون بخیر!"
                else:
                    base_response += " شبتون بخیر!"
            
            # Add encouragement for questions
            elif intent == "question" and user_text:
                if "چطور" in user_text or "how" in user_text.lower():
                    base_response += " سعی می‌کنم راهنماییتون کنم."
                elif "چرا" in user_text or "why" in user_text.lower():
                    base_response += " دلایل مختلفی می‌تونه داشته باشه."
            
            return base_response
            
        except:
            return base_response

    async def _free_text_generation(self, text: str) -> Optional[str]:
        """Use free Hugging Face API for text generation"""
        try:
            headers = {'Authorization': f'Bearer {self.hf_token}'}
            
            # Create a conversational prompt
            prompt = f"Human: {text}\nAssistant:"
            
            payload = {
                "inputs": prompt,
                "parameters": {
                    "max_new_tokens": 50,
                    "temperature": 0.7,
                    "do_sample": True,
                    "top_p": 0.9
                }
            }
            
            response = requests.post(
                self.inference_endpoints['persian_generation'],
                headers=headers,
                json=payload,
                timeout=15
            )
            
            if response.status_code == 200:
                result = response.json()
                if isinstance(result, list) and len(result) > 0:
                    generated_text = result[0].get('generated_text', '')
                    # Extract only the assistant's response
                    if "Assistant:" in generated_text:
                        assistant_response = generated_text.split("Assistant:")[-1].strip()
                        if len(assistant_response) > 5 and len(assistant_response) < 200:
                            return assistant_response
                            
        except Exception as e:
            logger.warning(f"Free API text generation failed: {e}")
            
        return None

    def is_ready(self) -> bool:
        """Always ready for free operation"""
        return True

    async def get_model_info(self) -> Dict[str, Any]:
        """Get information about the free service"""
        return {
            "models_loaded": True,
            "service_type": "FREE Hugging Face Service",
            "api_token_provided": bool(self.hf_token),
            "available_endpoints": list(self.inference_endpoints.keys()),
            "supported_languages": ["Persian (fa)", "English (en)"],
            "features": [
                "Rule-based intent detection",
                "Persian response templates", 
                "Free API integration (optional)",
                "Contextual responses",
                "No API key required"
            ]
        }