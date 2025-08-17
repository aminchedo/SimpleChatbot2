import asyncio
import logging
import numpy as np
import tempfile
import time
from typing import Optional, List, Dict
import io
import wave
import base64

logger = logging.getLogger(__name__)

class MultiEngineSTT:
    def __init__(self):
        self.engines = {}
        self.performance_scores = {}
        self.load_stt_engines()
        
    def load_stt_engines(self):
        """Load multiple STT engines for Persian"""
        try:
            # Try to load speech recognition
            try:
                import speech_recognition as sr
                self.engines['google'] = sr.Recognizer()
                self.performance_scores['google'] = 0.85
                logger.info("Google Speech Recognition loaded successfully!")
            except ImportError:
                logger.warning("speech_recognition not available")
            
            # Fallback to mock for development
            if not self.engines:
                logger.info("Loading Mock STT engines...")
                self.engines['mock'] = True
                self.performance_scores['mock'] = 0.85
            
            logger.info("STT engines loaded successfully!")
            
        except Exception as e:
            logger.error(f"Error loading STT engines: {e}")

    async def transcribe_with_best_engine(self, audio_data: bytes) -> Dict:
        """Try multiple STT engines and return best result"""
        try:
            # Try Google STT if available
            if 'google' in self.engines:
                return await self._google_stt_transcribe(audio_data)
            else:
                # Mock transcription for development
                mock_responses = [
                    "سلام، چطور هستید؟",
                    "امروز هوا چطور است؟",
                    "لطفاً کمکم کنید",
                    "ممنون از شما",
                    "خداحافظ",
                    "چه خبر؟",
                    "حال شما چطور است؟",
                    "می‌توانید کمکم کنید؟"
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

    async def _google_stt_transcribe(self, audio_data: bytes) -> Dict:
        """Google STT transcription for Persian"""
        try:
            import speech_recognition as sr
            
            # Convert audio data to AudioFile
            with tempfile.NamedTemporaryFile(suffix='.wav') as tmp_file:
                tmp_file.write(audio_data)
                tmp_file.flush()
                
                with sr.AudioFile(tmp_file.name) as source:
                    audio = self.engines['google'].record(source)
                
                # Recognize speech in Persian
                text = self.engines['google'].recognize_google(audio, language='fa-IR')
                
                return {
                    'engine': 'google',
                    'text': text,
                    'confidence': 0.9,
                    'process_time': 0.8
                }
        except Exception as e:
            logger.error(f"Google STT error: {e}")
            return {
                'engine': 'fallback',
                'text': 'نتوانستم صدا را تشخیص دهم',
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
                logger.warning("gTTS not available, install with: pip install gTTS")
            
            # Try to load edge-tts for better Persian support
            try:
                import edge_tts
                self.engines['edge_tts'] = edge_tts
                logger.info("Edge TTS loaded successfully!")
            except ImportError:
                logger.warning("edge-tts not available, install with: pip install edge-tts")
            
            # Fallback to mock
            if not self.engines:
                logger.warning("No TTS engines available, using mock TTS")
                self.engines['mock'] = True
            
        except Exception as e:
            logger.error(f"Error loading TTS engines: {e}")
            self.engines['mock'] = True

    async def synthesize_with_best_engine(self, text: str, emotion: str = "neutral") -> bytes:
        """Generate speech with emotion-appropriate voice"""
        try:
            # Try Edge TTS first (better Persian support)
            if 'edge_tts' in self.engines:
                return await self._edge_tts_synthesize(text, emotion)
            # Try gTTS
            elif 'gtts' in self.engines:
                return await self._gtts_synthesize(text)
            else:
                # Mock TTS - generate silence
                return self._generate_silence(2.0)
                
        except Exception as e:
            logger.error(f"TTS error: {e}")
            return self._generate_silence(1.0)

    async def _edge_tts_synthesize(self, text: str, emotion: str = "neutral") -> bytes:
        """Edge TTS synthesis with Persian voice"""
        try:
            import edge_tts
            
            # Choose voice based on emotion
            voice_map = {
                "happy": "fa-IR-DilaraNeural",
                "sad": "fa-IR-FaridNeural", 
                "neutral": "fa-IR-DilaraNeural",
                "excited": "fa-IR-DilaraNeural"
            }
            
            voice = voice_map.get(emotion, "fa-IR-DilaraNeural")
            
            communicate = edge_tts.Communicate(text, voice)
            audio_data = b""
            
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_data += chunk["data"]
            
            return audio_data
            
        except Exception as e:
            logger.error(f"Edge TTS error: {e}")
            return await self._gtts_synthesize(text)

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
        
    def is_ready(self) -> bool:
        """Check if voice processor is ready"""
        return len(self.stt.engines) > 0 and len(self.tts.engines) > 0
        
    async def process_voice_input(self, audio_data: bytes) -> Dict:
        """Complete voice processing pipeline"""
        start_time = time.time()
        
        try:
            # Validate audio data
            if not audio_data or len(audio_data) < 1000:
                return {
                    'success': False,
                    'message': 'فایل صوتی خیلی کوتاه است',
                    'audio': await self.tts.synthesize_with_best_engine(
                        "فایل صوتی شما خیلی کوتاه است. لطفاً دوباره تلاش کنید.",
                        "neutral"
                    )
                }
            
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
            
        except Exception as e:
            logger.error(f"Voice processing error: {e}")
            return {
                'success': False,
                'message': 'خطا در پردازش صدا',
                'audio': await self.tts.synthesize_with_best_engine(
                    "خطایی در پردازش صدای شما رخ داده است. لطفاً دوباره تلاش کنید.",
                    "neutral"
                )
            }

    async def _analyze_emotion(self, text: str) -> str:
        """Analyze emotion from Persian text"""
        try:
            # Enhanced Persian emotion detection
            positive_words = ['خوب', 'عالی', 'خوشحال', 'ممنون', 'سپاس', 'شاد', 'راضی', 'خوشبخت']
            negative_words = ['بد', 'ناراحت', 'غمگین', 'متاسف', 'خسته', 'عصبانی', 'نگران', 'ترسیده']
            excited_words = ['فوق‌العاده', 'بی‌نظیر', 'شگفت‌انگیز', 'رائع', 'عجیب', 'حیرت‌انگیز']
            
            text_lower = text.lower()
            
            if any(word in text_lower for word in excited_words):
                return 'excited'
            elif any(word in text_lower for word in positive_words):
                return 'happy'
            elif any(word in text_lower for word in negative_words):
                return 'sad'
            else:
                return 'neutral'
        except:
            return 'neutral'

    async def generate_voice_response(self, text: str, emotion: str = "neutral") -> bytes:
        """Generate emotional voice response"""
        try:
            return await self.tts.synthesize_with_best_engine(text, emotion)
        except Exception as e:
            logger.error(f"Voice generation error: {e}")
            return self.tts._generate_silence(1.0)