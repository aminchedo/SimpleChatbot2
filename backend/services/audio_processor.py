import asyncio
import logging
import numpy as np
import tempfile
import time
from typing import Optional, List, Dict
import io
import wave

logger = logging.getLogger(__name__)

class MultiEngineSTT:
    def __init__(self):
        self.engines = {}
        self.performance_scores = {}
        self.load_stt_engines()
        
    def load_stt_engines(self):
        """Load multiple STT engines for Persian"""
        try:
            # Mock STT for development - replace with actual engines
            logger.info("Loading Mock STT engines...")
            self.engines['mock'] = True
            self.performance_scores['mock'] = 0.85
            
            logger.info("STT engines loaded successfully!")
            
        except Exception as e:
            logger.error(f"Error loading STT engines: {e}")

    async def transcribe_with_best_engine(self, audio_data: bytes) -> Dict:
        """Try multiple STT engines and return best result"""
        try:
            # Mock transcription for development
            mock_responses = [
                "سلام، چطور هستید؟",
                "امروز هوا چطور است؟",
                "لطفاً کمکم کنید",
                "ممنون از شما",
                "خداحافظ"
            ]
            
            import random
            mock_text = random.choice(mock_responses)
            
            return {
                'engine': 'mock',
                'text': mock_text,
                'confidence': 0.85,
                'process_time': 0.5
            }
            
        except Exception as e:
            logger.error(f"STT error: {e}")
            return {
                'engine': 'fallback',
                'text': 'متاسفانه نتوانستم صدای شما را تشخیص دهم',
                'confidence': 0.0,
                'process_time': 0.0
            }

class MultiEngineTTS:
    def __init__(self):
        self.engines = {}
        self.load_tts_engines()
        
    def load_tts_engines(self):
        """Load multiple TTS engines for Persian"""
        try:
            logger.info("Loading TTS engines...")
            
            # Try to load gTTS
            try:
                from gtts import gTTS
                self.engines['gtts'] = gTTS
                logger.info("Google TTS loaded successfully!")
            except ImportError:
                logger.warning("gTTS not available, using mock TTS")
                self.engines['mock'] = True
            
        except Exception as e:
            logger.error(f"Error loading TTS engines: {e}")
            self.engines['mock'] = True

    async def synthesize_with_best_engine(self, text: str, emotion: str = "neutral") -> bytes:
        """Generate speech with emotion-appropriate voice"""
        try:
            # Try gTTS if available
            if 'gtts' in self.engines:
                return await self._gtts_synthesize(text)
            else:
                # Mock TTS - generate silence
                return self._generate_silence(2.0)
                
        except Exception as e:
            logger.error(f"TTS error: {e}")
            return self._generate_silence(1.0)

    async def _gtts_synthesize(self, text: str) -> bytes:
        """Google TTS synthesis"""
        try:
            from gtts import gTTS
            import io
            
            tts = gTTS(text=text, lang='fa', slow=False)
            buffer = io.BytesIO()
            tts.write_to_fp(buffer)
            buffer.seek(0)
            return buffer.read()
        except Exception as e:
            logger.error(f"gTTS error: {e}")
            return self._generate_silence(2.0)

    def _generate_silence(self, duration: float) -> bytes:
        """Generate silence as fallback"""
        try:
            sample_rate = 22050
            frames = int(sample_rate * duration)
            audio_data = np.zeros(frames, dtype=np.int16)
            
            buffer = io.BytesIO()
            with wave.open(buffer, 'wb') as wav_file:
                wav_file.setnchannels(1)
                wav_file.setsampwidth(2)
                wav_file.setframerate(sample_rate)
                wav_file.writeframes(audio_data.tobytes())
            
            buffer.seek(0)
            return buffer.read()
        except Exception as e:
            logger.error(f"Silence generation error: {e}")
            return b''

class VoiceProcessor:
    def __init__(self):
        self.stt = MultiEngineSTT()
        self.tts = MultiEngineTTS()
        
    async def process_voice_input(self, audio_data: bytes) -> Dict:
        """Complete voice processing pipeline"""
        start_time = time.time()
        
        # Step 1: Speech to Text
        stt_result = await self.stt.transcribe_with_best_engine(audio_data)
        
        if not stt_result['text'] or stt_result['confidence'] < 0.1:
            return {
                'success': False,
                'message': 'نتوانستم صدای شما را تشخیص دهم',
                'audio': await self.tts.synthesize_with_best_engine(
                    "متاسفانه نتوانستم صدای شما را درست تشخیص دهم. لطفاً دوباره تلاش کنید.",
                    "sad"
                )
            }
        
        # Step 2: Emotion Analysis
        emotion = await self._analyze_emotion(stt_result['text'])
        
        process_time = time.time() - start_time
        logger.info(f"Voice processing completed in {process_time:.2f}s")
        
        return {
            'success': True,
            'text': stt_result['text'],
            'emotion': emotion,
            'engine_used': stt_result['engine'],
            'confidence': stt_result['confidence'],
            'process_time': process_time
        }

    async def _analyze_emotion(self, text: str) -> str:
        """Analyze emotion from text"""
        try:
            # Simple rule-based emotion detection for Persian
            positive_words = ['خوب', 'عالی', 'خوشحال', 'ممنون', 'سپاس']
            negative_words = ['بد', 'ناراحت', 'غمگین', 'متاسف', 'خسته']
            
            text_lower = text.lower()
            
            if any(word in text_lower for word in positive_words):
                return 'happy'
            elif any(word in text_lower for word in negative_words):
                return 'sad'
            else:
                return 'neutral'
        except:
            return 'neutral'

    async def generate_voice_response(self, text: str, emotion: str = "neutral") -> bytes:
        """Generate emotional voice response"""
        return await self.tts.synthesize_with_best_engine(text, emotion)