'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { usePersianChatbot } from '@/hooks/usePersianChatbot';

interface ChatMessage {
  id: string;
  user: string;
  bot: string;
  timestamp: Date;
  emotion: string;
}

interface VoiceOnlyRecorderProps {
  onConversationUpdate: (conversation: ChatMessage[]) => void;
  onRecordingChange?: (isRecording: boolean) => void;
}

export default function VoiceOnlyRecorder({ onConversationUpdate, onRecordingChange }: VoiceOnlyRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [lastTranscription, setLastTranscription] = useState('');
  const [botResponse, setBotResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const recordingTimeoutRef = useRef<number | null>(null);

  // Initialize browser-based services
  const { conversation, isProcessing, processMessage } = usePersianChatbot({
    onNewMessage: (message) => {
      setLastTranscription(message.user);
      setBotResponse(message.bot);
      onConversationUpdate(conversation);
    }
  });

  const { speak, isSpeaking, isSupported: ttsSupported } = useSpeechSynthesis({
    onStart: () => console.log('🔊 TTS started'),
    onEnd: () => {
      console.log('🔇 TTS ended');
      // Auto-start recording after bot finishes speaking
      setTimeout(() => {
        if (!isRecording && !isProcessing) {
          handleStartRecording();
        }
      }, 1000);
    },
    onError: (errorMsg) => {
      console.error('TTS Error:', errorMsg);
      setError(errorMsg);
    }
  });

  const { isListening, isSupported: sttSupported, startListening, stopListening, abortListening } = useSpeechRecognition({
    onResult: async (transcript, confidence) => {
      console.log('📝 Transcript received:', transcript, 'Confidence:', confidence);
      setIsRecording(false);
      onRecordingChange?.(false);
      if (recordingTimeoutRef.current) {
        window.clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
      
      if (confidence > 0.3) { // Minimum confidence threshold
        try {
          const message = await processMessage(transcript);
          
          // Speak the bot response if not muted
          if (!isMuted && message.bot) {
            speak(message.bot);
          }
        } catch (error) {
          console.error('Error processing message:', error);
          setError('خطا در پردازش پیام');
        }
      } else {
        setError('کیفیت تشخیص صدا پایین است. دوباره تلاش کنید.');
      }
    },
    onError: (errorMsg) => {
      console.error('STT Error:', errorMsg);
      setIsRecording(false);
      onRecordingChange?.(false);
      if (recordingTimeoutRef.current) {
        window.clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
      setError(errorMsg);
    }
  });

  // Update connection status based on browser API support
  useEffect(() => {
    if (sttSupported && ttsSupported) {
      setConnectionStatus('connected');
      setError(null);
    } else {
      setConnectionStatus('disconnected');
      if (!sttSupported) {
        setError('مرورگر شما از تشخیص گفتار پشتیبانی نمی‌کند');
      } else if (!ttsSupported) {
        setError('مرورگر شما از تبدیل متن به گفتار پشتیبانی نمی‌کند');
      }
    }
  }, [sttSupported, ttsSupported]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleStartRecording = useCallback(() => {
    if (!sttSupported || isProcessing || isSpeaking) return;
    
    setError(null);
    setIsRecording(true);
    startListening();
    onRecordingChange?.(true);
    // Safety timeout to auto-stop after 10s
    if (recordingTimeoutRef.current) {
      window.clearTimeout(recordingTimeoutRef.current);
    }
    recordingTimeoutRef.current = window.setTimeout(() => {
      if (isListening) {
        stopListening();
      } else {
        abortListening();
      }
      setIsRecording(false);
      onRecordingChange?.(false);
    }, 10000);
  }, [sttSupported, isProcessing, isSpeaking, startListening, stopListening, abortListening, isListening, onRecordingChange]);

  const handleStopRecording = useCallback(() => {
    if (isListening) {
      stopListening();
    }
    setIsRecording(false);
    onRecordingChange?.(false);
    if (recordingTimeoutRef.current) {
      window.clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
  }, [isListening, stopListening, onRecordingChange]);

  const handleRecordToggle = useCallback(() => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  }, [isRecording, handleStartRecording, handleStopRecording]);

  const getStatusText = () => {
    if (!sttSupported || !ttsSupported) return '🔴 مرورگر پشتیبانی نمی‌کند';
    if (error) return `❌ ${error}`;
    if (isProcessing) return '🧠 در حال پردازش...';
    if (isRecording) return '🎤 در حال ضبط صدا (نگه دارید و صحبت کنید)';
    if (isSpeaking) return '🔊 ربات در حال صحبت...';
    return '👂 آماده شنیدن... دکمه را نگه دارید و صحبت کنید';
  };

  const getStatusColor = () => {
    if (!sttSupported || !ttsSupported || error) return 'text-red-400';
    if (isProcessing) return 'text-blue-400';
    if (isRecording) return 'text-green-400';
    if (isSpeaking) return 'text-purple-400';
    return 'text-gray-300';
  };

  const isSystemReady = sttSupported && ttsSupported && !error;

  return (
    <div className="flex flex-col items-center space-y-8 p-8">
      {/* Connection Status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex items-center space-x-2 text-sm ${
          connectionStatus === 'connected' && isSystemReady ? 'text-green-400' : 'text-red-400'
        }`}
      >
        {connectionStatus === 'connected' && isSystemReady ? (
          <Wifi size={16} />
        ) : (
          <WifiOff size={16} />
        )}
        <span className="persian-text">
          {connectionStatus === 'connected' && isSystemReady ? 'آماده استفاده' : 'سیستم آماده نیست'}
        </span>
      </motion.div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center space-x-2 bg-red-500/20 border border-red-400 rounded-lg px-4 py-2"
          >
            <AlertCircle size={16} className="text-red-400" />
            <span className="text-red-300 text-sm persian-text">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conversation Display */}
      <AnimatePresence>
        {(lastTranscription || botResponse) && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="glass-effect rounded-3xl p-6 max-w-2xl w-full persian-text"
          >
            {lastTranscription && (
              <div className="mb-4">
                <p className="text-sm text-blue-300 mb-1">شما گفتید:</p>
                <p className="text-white text-lg">{lastTranscription}</p>
              </div>
            )}
            
            {botResponse && (
              <div>
                <p className="text-sm text-purple-300 mb-1">ربات گفت:</p>
                <p className="text-white text-lg">{botResponse}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Record Button */}
      <div className="relative">
        <motion.button
          onPointerDown={handleStartRecording}
          onPointerUp={handleStopRecording}
          onPointerLeave={isRecording ? handleStopRecording : undefined}
          disabled={!isSystemReady || isProcessing}
          className={`relative w-32 h-32 rounded-full border-4 transition-all duration-300 ${
            isRecording 
              ? 'bg-red-500 border-red-300 shadow-lg shadow-red-500/50' 
              : isProcessing
              ? 'bg-blue-500 border-blue-300 shadow-lg shadow-blue-500/50'
              : isSpeaking
              ? 'bg-purple-500 border-purple-300 shadow-lg shadow-purple-500/50'
              : isSystemReady
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-300 hover:shadow-lg hover:shadow-green-500/50'
              : 'bg-gray-500 border-gray-400 cursor-not-allowed'
          }`}
          whileHover={isSystemReady ? { scale: 1.05 } : {}}
          whileTap={isSystemReady ? { scale: 0.95 } : {}}
          animate={isRecording ? {
            scale: [1, 1.1, 1],
            transition: { duration: 1, repeat: Infinity }
          } : isProcessing ? {
            rotate: [0, 360],
            transition: { duration: 2, repeat: Infinity, ease: "linear" }
          } : {}}
        >
          {isProcessing ? (
            <div className="w-12 h-12 text-white mx-auto flex items-center justify-center text-2xl">🧠</div>
          ) : isSpeaking ? (
            <Volume2 className="w-12 h-12 text-white mx-auto" />
          ) : isRecording ? (
            <MicOff className="w-12 h-12 text-white mx-auto" />
          ) : (
            <Mic className="w-12 h-12 text-white mx-auto" />
          )}
          
          {/* Pulse Animation */}
          {(isRecording || isSpeaking) && (
            <motion.div
              className={`absolute inset-0 rounded-full border-4 ${
                isRecording ? 'border-red-400' : 'border-purple-400'
              }`}
              animate={{
                scale: [1, 1.5, 2],
                opacity: [1, 0.5, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
            />
          )}
        </motion.button>
      </div>

      {/* Status Text */}
      <motion.div
        className="text-center"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <p className={`text-xl font-medium ${getStatusColor()} persian-text`}>
          {getStatusText()}
        </p>
        
        {conversation.length > 0 && (
          <p className="text-gray-400 mt-2 persian-text">
            مکالمه: {conversation.length} پیام
          </p>
        )}
      </motion.div>

      {/* Mute Toggle */}
      <motion.button
        onClick={() => setIsMuted(!isMuted)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-full border ${
          isMuted 
            ? 'bg-red-500/20 border-red-400 text-red-300'
            : 'bg-green-500/20 border-green-400 text-green-300'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        <span className="text-sm persian-text">
          {isMuted ? 'صدا خاموش' : 'صدا روشن'}
        </span>
      </motion.button>

      {/* Browser Support Info */}
      {(!sttSupported || !ttsSupported) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center bg-yellow-500/20 border border-yellow-400 rounded-lg p-4 max-w-md"
        >
          <p className="text-yellow-300 text-sm persian-text mb-2">
            ⚠️ برای استفاده کامل از این ربات، از مرورگرهای زیر استفاده کنید:
          </p>
          <p className="text-yellow-200 text-xs">
            Chrome, Edge, Safari (جدید), Firefox
          </p>
        </motion.div>
      )}
    </div>
  );
}