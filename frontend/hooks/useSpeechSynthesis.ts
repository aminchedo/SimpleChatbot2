import { useState, useRef, useCallback, useEffect } from 'react';

interface UseSpeechSynthesisProps {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export function useSpeechSynthesis({
  onStart,
  onEnd,
  onError,
  lang = 'fa-IR',
  rate = 0.8,
  pitch = 1,
  volume = 1
}: UseSpeechSynthesisProps = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [persianVoice, setPersianVoice] = useState<SpeechSynthesisVoice | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Check if Speech Synthesis is supported
    if ('speechSynthesis' in window) {
      setIsSupported(true);
      
      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        // Find Persian voice
        const persianVoices = availableVoices.filter(voice => 
          voice.lang.includes('fa') || 
          voice.lang.includes('persian') ||
          voice.name.toLowerCase().includes('persian') ||
          voice.name.toLowerCase().includes('farsi')
        );
        
        if (persianVoices.length > 0) {
          setPersianVoice(persianVoices[0]);
          console.log('🗣️ Persian voice found:', persianVoices[0].name);
        } else {
          // Fallback to any available voice
          const fallbackVoice = availableVoices.find(voice => 
            voice.lang.includes('en') || voice.default
          );
          if (fallbackVoice) {
            setPersianVoice(fallbackVoice);
            console.log('⚠️ No Persian voice found, using fallback:', fallbackVoice.name);
          }
        }
      };

      // Load voices immediately if available
      loadVoices();
      
      // Also listen for voices changed event (some browsers load voices async)
      speechSynthesis.addEventListener('voiceschanged', loadVoices);
      
      return () => {
        speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      };
    } else {
      setIsSupported(false);
      console.error('❌ Speech Synthesis not supported in this browser');
      onError?.('مرورگر شما از تبدیل متن به گفتار پشتیبانی نمی‌کند');
    }
  }, [onError]);

  const speak = useCallback((text: string, options?: {
    rate?: number;
    pitch?: number;
    volume?: number;
    voice?: SpeechSynthesisVoice;
  }) => {
    if (!isSupported) {
      onError?.('تبدیل متن به گفتار پشتیبانی نمی‌شود');
      return;
    }

    if (!text.trim()) {
      onError?.('متن خالی است');
      return;
    }

    // Stop any ongoing speech
    if (isSpeaking) {
      speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice
    const selectedVoice = options?.voice || persianVoice;
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Set language
    utterance.lang = lang;
    
    // Set speech parameters
    utterance.rate = options?.rate ?? rate;
    utterance.pitch = options?.pitch ?? pitch;
    utterance.volume = options?.volume ?? volume;

    utterance.onstart = () => {
      console.log('🔊 Speech synthesis started');
      setIsSpeaking(true);
      onStart?.();
    };

    utterance.onend = () => {
      console.log('🔇 Speech synthesis ended');
      setIsSpeaking(false);
      onEnd?.();
    };

    utterance.onerror = (event) => {
      console.error('❌ Speech synthesis error:', event.error);
      setIsSpeaking(false);
      
      let errorMessage = 'خطا در تولید گفتار';
      switch (event.error) {
        case 'network':
          errorMessage = 'خطا در اتصال شبکه';
          break;
        case 'synthesis-failed':
          errorMessage = 'خطا در تولید گفتار';
          break;
        case 'synthesis-unavailable':
          errorMessage = 'سرویس تولید گفتار در دسترس نیست';
          break;
      }
      
      onError?.(errorMessage);
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  }, [isSupported, isSpeaking, persianVoice, lang, rate, pitch, volume, onStart, onEnd, onError]);

  const stop = useCallback(() => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const pause = useCallback(() => {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
    }
  }, []);

  // Get available Persian voices
  const getPersianVoices = useCallback(() => {
    return voices.filter(voice => 
      voice.lang.includes('fa') || 
      voice.lang.includes('persian') ||
      voice.name.toLowerCase().includes('persian') ||
      voice.name.toLowerCase().includes('farsi')
    );
  }, [voices]);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isSupported,
    voices,
    persianVoice,
    getPersianVoices
  };
}