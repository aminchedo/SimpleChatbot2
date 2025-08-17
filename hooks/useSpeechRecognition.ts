import { useState, useRef, useCallback, useEffect } from 'react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface UseSpeechRecognitionProps {
  onResult: (transcript: string, confidence: number) => void;
  onError: (error: string) => void;
  continuous?: boolean;
  lang?: string;
}

export function useSpeechRecognition({
  onResult,
  onError,
  continuous = false,
  lang = 'fa-IR'
}: UseSpeechRecognitionProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if Speech Recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      
      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = false;
      recognition.lang = lang;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('🎤 Speech recognition started');
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const result = event.results[event.results.length - 1];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;
        
        console.log('🗣️ Persian speech recognized:', transcript, 'Confidence:', confidence);
        onResult(transcript, confidence);
      };

      recognition.onerror = (event: any) => {
        console.error('❌ Speech recognition error:', event.error);
        setIsListening(false);
        
        let errorMessage = 'خطا در تشخیص گفتار';
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'صدایی شنیده نشد. لطفاً دوباره تلاش کنید.';
            break;
          case 'audio-capture':
            errorMessage = 'خطا در دسترسی به میکروفون';
            break;
          case 'not-allowed':
            errorMessage = 'دسترسی به میکروفون مجاز نیست';
            break;
          case 'network':
            errorMessage = 'خطا در اتصال شبکه';
            break;
        }
        
        onError(errorMessage);
      };

      recognition.onend = () => {
        console.log('🔇 Speech recognition ended');
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      console.error('❌ Speech Recognition not supported in this browser');
      onError('مرورگر شما از تشخیص گفتار پشتیبانی نمی‌کند');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onResult, onError, continuous, lang]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        onError('خطا در شروع تشخیص گفتار');
      }
    }
  }, [isListening, onError]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const abortListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      setIsListening(false);
    }
  }, []);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    abortListening
  };
}