'use client';

import { useState, useEffect, useRef } from 'react';

// Define the shape of the hook's return value
interface SpeechRecognitionHook {
  text: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  hasRecognitionSupport: boolean;
}

// The hook itself
export function useSpeechRecognition(): SpeechRecognitionHook {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  // Use a ref to hold the recognition object
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if the browser supports the Web Speech API
    if (typeof window === 'undefined' || (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window))) {
      console.warn("Speech recognition not supported by this browser.");
      return;
    }

    // Get the correct SpeechRecognition class
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'fa-IR'; // Set to Persian

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      // Update the state with the final transcript
      // Or you can update with interim as well if you want live feedback
      setText(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
      setIsListening(false);
      // We don't reset text here, the component using the hook should decide when to clear it.
    };

    recognitionRef.current = recognition;

    // Cleanup function to stop recognition if the component unmounts
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []); // Empty dependency array ensures this runs only once

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setText(''); // Clear previous text
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const hasRecognitionSupport = typeof window !== 'undefined' && (('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window));

  return { text, isListening, startListening, stopListening, hasRecognitionSupport };
}
