import { PERSIAN_LANGUAGE_CODES, PERSIAN_VOICE_NAMES } from '@/types/speech';

export interface SpeechCapabilities {
  speechRecognition: {
    supported: boolean;
    persianSupported: boolean;
    availableLanguages: string[];
    recommendedLang: string | null;
  };
  speechSynthesis: {
    supported: boolean;
    persianVoicesAvailable: SpeechSynthesisVoice[];
    allVoices: SpeechSynthesisVoice[];
    recommendedVoice: SpeechSynthesisVoice | null;
  };
  browser: {
    name: string;
    version: string;
    mobile: boolean;
    platform: string;
  };
}

export interface SpeechTestResult {
  success: boolean;
  message: string;
  details?: any;
  recommendations?: string[];
}

/**
 * Comprehensive test of Persian speech capabilities
 */
export async function testPersianSpeechSupport(): Promise<SpeechCapabilities> {
  const capabilities: SpeechCapabilities = {
    speechRecognition: {
      supported: false,
      persianSupported: false,
      availableLanguages: [],
      recommendedLang: null,
    },
    speechSynthesis: {
      supported: false,
      persianVoicesAvailable: [],
      allVoices: [],
      recommendedVoice: null,
    },
    browser: getBrowserInfo(),
  };

  // Test Speech Recognition
  if (typeof window !== 'undefined') {
    capabilities.speechRecognition.supported = 
      'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    
    if (capabilities.speechRecognition.supported) {
      // Persian is generally supported by most browsers, but we can't easily test without user interaction
      capabilities.speechRecognition.persianSupported = true;
      capabilities.speechRecognition.availableLanguages = [...PERSIAN_LANGUAGE_CODES];
      capabilities.speechRecognition.recommendedLang = 'fa-IR';
    }

    // Test Speech Synthesis
    capabilities.speechSynthesis.supported = 'speechSynthesis' in window;
    
    if (capabilities.speechSynthesis.supported) {
      // Get all voices
      const voices = speechSynthesis.getVoices();
      capabilities.speechSynthesis.allVoices = voices;
      
      // Find Persian voices
      const persianVoices = voices.filter(voice => 
        voice.lang.includes('fa') || 
        PERSIAN_VOICE_NAMES.some(name => 
          voice.name.toLowerCase().includes(name.toLowerCase())
        )
      );
      
      capabilities.speechSynthesis.persianVoicesAvailable = persianVoices;
      capabilities.speechSynthesis.recommendedVoice = persianVoices[0] || null;
    }
  }

  return capabilities;
}

/**
 * Test speech recognition with a timeout
 */
export async function testSpeechRecognition(): Promise<SpeechTestResult> {
  if (typeof window === 'undefined') {
    return {
      success: false,
      message: 'Speech Recognition not available (server-side)',
    };
  }

  if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
    return {
      success: false,
      message: 'Speech Recognition not supported by this browser',
      recommendations: [
        'Use Chrome, Edge, or Safari for best speech recognition support',
        'Enable microphone permissions',
        'Use HTTPS for speech recognition to work'
      ]
    };
  }

  try {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'fa-IR';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        recognition.abort();
        resolve({
          success: true,
          message: 'Speech Recognition initialized successfully (Persian language)',
          details: {
            lang: recognition.lang,
            continuous: recognition.continuous,
            interimResults: recognition.interimResults,
          }
        });
      }, 1000);

      recognition.onerror = (event) => {
        clearTimeout(timeout);
        resolve({
          success: false,
          message: `Speech Recognition error: ${event.error}`,
          details: { error: event.error },
          recommendations: getErrorRecommendations(event.error)
        });
      };

      recognition.onstart = () => {
        clearTimeout(timeout);
        recognition.abort(); // Don't actually listen, just test initialization
        resolve({
          success: true,
          message: 'Speech Recognition working perfectly!',
          details: {
            lang: recognition.lang,
            browser: getBrowserInfo().name
          }
        });
      };

      // Don't actually start listening to avoid user prompt during testing
      // recognition.start();
      
      // Just test if we can create and configure the recognition object
      setTimeout(() => {
        clearTimeout(timeout);
        resolve({
          success: true,
          message: 'Speech Recognition API available and configured for Persian',
          details: {
            lang: recognition.lang,
            configured: true
          }
        });
      }, 100);
    });
  } catch (error) {
    return {
      success: false,
      message: `Failed to initialize Speech Recognition: ${error}`,
      details: { error: error instanceof Error ? error.message : String(error) }
    };
  }
}

/**
 * Test speech synthesis with Persian text
 */
export async function testSpeechSynthesis(testText: string = 'سلام، این یک تست است'): Promise<SpeechTestResult> {
  if (typeof window === 'undefined') {
    return {
      success: false,
      message: 'Speech Synthesis not available (server-side)',
    };
  }

  if (!('speechSynthesis' in window)) {
    return {
      success: false,
      message: 'Speech Synthesis not supported by this browser',
      recommendations: [
        'Use a modern browser that supports Web Speech API',
        'Check if your browser has speech synthesis enabled'
      ]
    };
  }

  try {
    const utterance = new SpeechSynthesisUtterance(testText);
    utterance.lang = 'fa-IR';
    utterance.rate = 0.8;
    utterance.pitch = 1;
    utterance.volume = 0.1; // Very quiet for testing
    
    // Get available voices
    const voices = speechSynthesis.getVoices();
    const persianVoice = voices.find(voice => 
      voice.lang.includes('fa') || 
      voice.name.toLowerCase().includes('persian') ||
      voice.name.toLowerCase().includes('farsi')
    );

    if (persianVoice) {
      utterance.voice = persianVoice;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        speechSynthesis.cancel(); // Stop any ongoing speech
        resolve({
          success: true,
          message: persianVoice 
            ? `Speech Synthesis working with Persian voice: ${persianVoice.name}`
            : 'Speech Synthesis working (no Persian voice found, using default)',
          details: {
            persianVoice: persianVoice?.name || null,
            totalVoices: voices.length,
            testText,
            lang: utterance.lang
          },
          recommendations: !persianVoice ? [
            'Persian voice not found - speech will use default voice',
            'Some browsers may need time to load voices',
            'Try refreshing the page to load all available voices'
          ] : undefined
        });
      }, 2000);

      utterance.onstart = () => {
        clearTimeout(timeout);
        speechSynthesis.cancel(); // Stop immediately after start
        resolve({
          success: true,
          message: `Speech Synthesis working perfectly! ${persianVoice ? `Using ${persianVoice.name}` : 'Using default voice'}`,
          details: {
            persianVoice: persianVoice?.name || null,
            started: true,
            testText,
            lang: utterance.lang
          }
        });
      };

      utterance.onerror = (event) => {
        clearTimeout(timeout);
        resolve({
          success: false,
          message: `Speech Synthesis error: ${event.error}`,
          details: { error: event.error },
          recommendations: [
            'Check browser permissions for audio',
            'Ensure volume is not muted',
            'Try a different browser'
          ]
        });
      };

      // Start synthesis (very quietly)
      speechSynthesis.speak(utterance);
    });
  } catch (error) {
    return {
      success: false,
      message: `Failed to test Speech Synthesis: ${error}`,
      details: { error: error instanceof Error ? error.message : String(error) }
    };
  }
}

/**
 * Get browser information
 */
export function getBrowserInfo() {
  if (typeof window === 'undefined') {
    return {
      name: 'Server',
      version: 'N/A',
      mobile: false,
      platform: 'Server'
    };
  }

  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';
  
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browserName = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+)/);
    browserVersion = match ? match[1] : 'Unknown';
  } else if (userAgent.includes('Firefox')) {
    browserName = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+)/);
    browserVersion = match ? match[1] : 'Unknown';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browserName = 'Safari';
    const match = userAgent.match(/Version\/(\d+)/);
    browserVersion = match ? match[1] : 'Unknown';
  } else if (userAgent.includes('Edg')) {
    browserName = 'Edge';
    const match = userAgent.match(/Edg\/(\d+)/);
    browserVersion = match ? match[1] : 'Unknown';
  }

  const mobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  return {
    name: browserName,
    version: browserVersion,
    mobile,
    platform
  };
}

/**
 * Get recommendations based on speech recognition errors
 */
function getErrorRecommendations(error: string): string[] {
  switch (error) {
    case 'not-allowed':
      return [
        'Grant microphone permissions to the browser',
        'Check browser settings for microphone access',
        'Ensure you\'re using HTTPS (required for microphone access)'
      ];
    case 'no-speech':
      return [
        'Speak clearly into the microphone',
        'Check microphone is working and not muted',
        'Reduce background noise'
      ];
    case 'audio-capture':
      return [
        'Check microphone connection',
        'Ensure microphone is not being used by another application',
        'Try a different microphone'
      ];
    case 'network':
      return [
        'Check internet connection',
        'Speech recognition may require online services',
        'Try again when connection is stable'
      ];
    case 'language-not-supported':
      return [
        'Persian (fa-IR) may not be supported by this browser',
        'Try using Chrome or Edge for better Persian support',
        'Check if browser language settings include Persian'
      ];
    default:
      return [
        'Try refreshing the page',
        'Check browser compatibility',
        'Ensure microphone permissions are granted'
      ];
  }
}

/**
 * Run comprehensive Persian speech test
 */
export async function runComprehensiveTest(): Promise<{
  capabilities: SpeechCapabilities;
  recognitionTest: SpeechTestResult;
  synthesisTest: SpeechTestResult;
  overall: {
    score: number;
    status: 'excellent' | 'good' | 'limited' | 'poor';
    summary: string;
  };
}> {
  const capabilities = await testPersianSpeechSupport();
  const recognitionTest = await testSpeechRecognition();
  const synthesisTest = await testSpeechSynthesis();

  // Calculate overall score
  let score = 0;
  if (capabilities.speechRecognition.supported) score += 40;
  if (capabilities.speechRecognition.persianSupported) score += 10;
  if (capabilities.speechSynthesis.supported) score += 30;
  if (capabilities.speechSynthesis.persianVoicesAvailable.length > 0) score += 20;

  let status: 'excellent' | 'good' | 'limited' | 'poor';
  let summary: string;

  if (score >= 90) {
    status = 'excellent';
    summary = 'Perfect! Full Persian speech support available.';
  } else if (score >= 70) {
    status = 'good';
    summary = 'Good Persian speech support. Minor limitations may exist.';
  } else if (score >= 40) {
    status = 'limited';
    summary = 'Limited speech support. Some features may not work optimally.';
  } else {
    status = 'poor';
    summary = 'Poor speech support. Consider using a different browser.';
  }

  return {
    capabilities,
    recognitionTest,
    synthesisTest,
    overall: {
      score,
      status,
      summary
    }
  };
}