import torch
import torchaudio
import whisper
import tempfile
import numpy as np
import logging
from typing import Union
import asyncio
import concurrent.futures

logger = logging.getLogger(__name__)

class AudioProcessor:
    def __init__(self):
        self.whisper_model = None
        self.executor = concurrent.futures.ThreadPoolExecutor(max_workers=2)
        
    async def load_models(self):
        """Load Whisper model asynchronously"""
        try:
            logger.info("Loading Whisper model...")
            loop = asyncio.get_event_loop()
            self.whisper_model = await loop.run_in_executor(
                self.executor, 
                whisper.load_model, 
                "base"
            )
            logger.info("Whisper model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading Whisper model: {e}")
            raise
        
    async def preprocess_audio(self, audio_data: bytes) -> np.ndarray:
        """Advanced audio preprocessing"""
        try:
            with tempfile.NamedTemporaryFile(suffix='.webm') as input_file:
                input_file.write(audio_data)
                input_file.flush()
                
                # Load audio with torchaudio
                waveform, sample_rate = torchaudio.load(input_file.name)
                
                # Convert to mono if stereo
                if waveform.shape[0] > 1:
                    waveform = torch.mean(waveform, dim=0, keepdim=True)
                
                # Resample to 16kHz if needed
                if sample_rate != 16000:
                    resampler = torchaudio.transforms.Resample(sample_rate, 16000)
                    waveform = resampler(waveform)
                
                # Normalize audio
                waveform = waveform / torch.max(torch.abs(waveform))
                
                return waveform.numpy().flatten()
                
        except Exception as e:
            logger.error(f"Error preprocessing audio: {e}")
            # Return original data as fallback
            return np.frombuffer(audio_data, dtype=np.float32)
    
    async def transcribe_audio(self, audio_array: np.ndarray) -> str:
        """High-quality Persian transcription with Whisper"""
        try:
            if self.whisper_model is None:
                await self.load_models()
            
            logger.info("Starting transcription...")
            
            # Run transcription in executor to avoid blocking
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                self.executor,
                self._transcribe_sync,
                audio_array
            )
            
            transcription = result["text"].strip()
            logger.info(f"Transcription completed: {transcription[:100]}...")
            
            return transcription if transcription else "متاسفانه نتوانستم صدای شما را تشخیص دهم."
            
        except Exception as e:
            logger.error(f"Error transcribing audio: {e}")
            return "خطا در تشخیص گفتار. لطفاً دوباره تلاش کنید."
    
    def _transcribe_sync(self, audio_array: np.ndarray) -> dict:
        """Synchronous transcription method"""
        return self.whisper_model.transcribe(
            audio_array,
            language='fa',  # Persian
            task='transcribe',
            temperature=0.0,  # Deterministic
            compression_ratio_threshold=2.4,
            logprob_threshold=-1.0,
            no_speech_threshold=0.6
        )