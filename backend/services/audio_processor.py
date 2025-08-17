import asyncio
import speech_recognition as sr
import torch
import librosa
import numpy as np
from transformers import AutoProcessor, AutoModelForSpeechSeq2Seq, pipeline
import tempfile
import wave
import logging
from typing import Optional, List, Dict
import time
import io
import soundfile as sf

logger = logging.getLogger(__name__)

class MultiEngineSTT:
    def __init__(self):
        self.engines = {}
        self.performance_scores = {}
        self.load_stt_engines()
        
    def load_stt_engines(self):
        """Load multiple STT engines for Persian"""
        try:
            # 1. Whisper (Primary for Persian)
            logger.info("Loading Whisper model...")
            import whisper
            self.engines['whisper'] = whisper.load_model("base")
            self.performance_scores['whisper'] = 0.95  # High score for Persian
            
            # 2. SpeechRecognition with Google (Fallback)
            logger.info("Loading Google Speech Recognition...")
            self.engines['google_sr'] = sr.Recognizer()
            self.performance_scores['google_sr'] = 0.80
            
            logger.info("STT engines loaded successfully!")
            
        except Exception as e:
            logger.error(f"Error loading STT engines: {e}")

    async def transcribe_with_best_engine(self, audio_data: bytes) -> Dict:
        """Try multiple STT engines and return best result"""
        results = []
        
        # Convert audio to proper format
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
            temp_file.write(audio_data)
            temp_file.flush()
            
            # Try each engine
            for engine_name, score in sorted(self.performance_scores.items(), 
                                           key=lambda x: x[1], reverse=True):
                try:
                    start_time = time.time()
                    
                    if engine_name == 'whisper':
                        result = await self._whisper_transcribe(temp_file.name)
                    elif engine_name == 'google_sr':
                        result = await self._google_sr_transcribe(temp_file.name)
                    else:
                        continue
                        
                    process_time = time.time() - start_time
                    
                    if result and len(result.strip()) > 0:
                        results.append({
                            'engine': engine_name,
                            'text': result,
                            'confidence': score,
                            'process_time': process_time
                        })
                        
                        # If we got a good result quickly, use it
                        if score > 0.9 and process_time < 2.0:
                            break
                            
                except Exception as e:
                    logger.warning(f"Engine {engine_name} failed: {e}")
                    continue
        
        # Return best result
        if results:
            best_result = max(results, key=lambda x: x['confidence'])
            logger.info(f"Best STT: {best_result['engine']} - {best_result['text']}")
            return best_result
        else:
            return {
                'engine': 'fallback',
                'text': 'متاسفانه نتوانستم صدای شما را تشخیص دهم',
                'confidence': 0.0,
                'process_time': 0.0
            }

    async def _whisper_transcribe(self, audio_file: str) -> str:
        """Whisper transcription"""
        try:
            # Load audio
            audio, sr_rate = librosa.load(audio_file, sr=16000)
            
            # Process with Whisper
            result = self.engines['whisper'].transcribe(
                audio,
                language='fa',  # Persian
                task='transcribe',
                temperature=0.0,  # Deterministic
                compression_ratio_threshold=2.4,
                logprob_threshold=-1.0,
                no_speech_threshold=0.6
            )
            
            return result["text"].strip()
            
        except Exception as e:
            logger.error(f"Whisper error: {e}")
            return ""

    async def _google_sr_transcribe(self, audio_file: str) -> str:
        """Google Speech Recognition"""
        try:
            with sr.AudioFile(audio_file) as source:
                audio = self.engines['google_sr'].record(source)
                
            # Try Persian first, then fallback
            try:
                return self.engines['google_sr'].recognize_google(audio, language="fa-IR")
            except:
                return self.engines['google_sr'].recognize_google(audio, language="en-US")
                
        except Exception as e:
            logger.error(f"Google SR error: {e}")
            return ""

class MultiEngineTTS:
    def __init__(self):
        self.engines = {}
        self.load_tts_engines()
        
    def load_tts_engines(self):
        """Load multiple TTS engines for Persian"""
        try:
            # 1. gTTS (Google) - Most reliable
            logger.info("Loading Google TTS...")
            from gtts import gTTS
            self.engines['gtts'] = gTTS
            
            logger.info("TTS engines loaded successfully!")
            
        except Exception as e:
            logger.error(f"Error loading TTS engines: {e}")

    async def synthesize_with_best_engine(self, text: str, emotion: str = "neutral") -> bytes:
        """Generate speech with emotion-appropriate voice"""
        try:
            # Try gTTS first (most reliable for Persian)
            try:
                return await self._gtts_synthesize(text)
            except Exception as e:
                logger.error(f"gTTS failed: {e}")
                pass
                
            # Ultimate fallback - silence
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
            logger.error(f"gTTS synthesis error: {e}")
            return self._generate_silence(1.0)

    def _generate_silence(self, duration: float) -> bytes:
        """Generate silence as fallback"""
        try:
            import wave
            import io
            
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
        except:
            return b""

class VoiceProcessor:
    def __init__(self):
        self.stt = MultiEngineSTT()
        self.tts = MultiEngineTTS()
        self.emotion_analyzer = self._load_emotion_analyzer()
        
    def _load_emotion_analyzer(self):
        """Load Persian emotion detection model"""
        try:
            # Simple rule-based emotion detection for now
            return None
        except:
            return None

    async def process_voice_input(self, audio_data: bytes) -> Dict:
        """Complete voice processing pipeline"""
        start_time = time.time()
        
        # Step 1: Speech to Text
        stt_result = await self.stt.transcribe_with_best_engine(audio_data)
        
        if not stt_result['text'] or stt_result['confidence'] < 0.1:
            error_audio = await self.tts.synthesize_with_best_engine(
                "متاسفانه نتوانستم صدای شما را درست تشخیص دهم. لطفاً دوباره تلاش کنید."
            )
            return {
                'success': False,
                'message': 'نتوانستم صدای شما را تشخیص دهم',
                'audio': error_audio
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
            # Simple rule-based emotion detection
            text_lower = text.lower()
            
            if any(word in text_lower for word in ['خوشحال', 'عالی', 'فوق‌العاده', 'خوب']):
                return 'happy'
            elif any(word in text_lower for word in ['ناراحت', 'غمگین', 'بد', 'مشکل']):
                return 'sad'
            elif any(word in text_lower for word in ['عصبانی', 'خشمگین', 'کلافه']):
                return 'angry'
            else:
                return 'neutral'
        except:
            return 'neutral'

    async def generate_voice_response(self, text: str, emotion: str = "neutral") -> bytes:
        """Generate emotional voice response"""
        return await self.tts.synthesize_with_best_engine(text, emotion)