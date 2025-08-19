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
      recognition.interimResults = true; // Enable interim results for better feedback
      recognition.lang = lang;
      recognition.maxAlternatives = 3; // Get more alternatives for better accuracy

      recognition.onstart = () => {
        console.log('🎤 Speech recognition started');
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const result = event.results[event.results.length - 1];
        
        // Only process final results to avoid multiple triggers
        if (result.isFinal) {
          // Try multiple alternatives to get the best one
          let bestTranscript = '';
          let bestConfidence = 0;
          
          for (let i = 0; i < Math.min(result.length, 3); i++) {
            const alternative = result[i];
            const confidence = alternative.confidence || 0.5; // Fallback confidence
            
            if (confidence > bestConfidence) {
              bestTranscript = alternative.transcript;
              bestConfidence = confidence;
            }
          }
          
          console.log('🗣️ Persian speech recognized:', bestTranscript, 'Confidence:', bestConfidence);
          onResult(bestTranscript.trim(), bestConfidence);
        }
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
      console.log('🛑 Stopping speech recognition immediately...');
      recognitionRef.current.stop();
      setIsListening(false); // Immediately update state
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