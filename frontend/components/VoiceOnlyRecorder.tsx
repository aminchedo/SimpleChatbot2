'use client';
import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, Wifi, WifiOff } from 'lucide-react';
import { useWebSpeechAPI } from '@/hooks/useWebSpeechAPI';
import { useWebSocket } from '@/hooks/useWebSocket';

interface VoiceOnlyRecorderProps {
  onConversationUpdate: (conversation: any[]) => void;
}

export default function VoiceOnlyRecorder({ onConversationUpdate }: VoiceOnlyRecorderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [conversation, setConversation] = useState<any[]>([]);
  const [lastTranscription, setLastTranscription] = useState('');
  const [botResponse, setBotResponse] = useState('');
  
  // Initialize Web Speech API
  const { recognition, synthesis, isSupported: speechSupported } = useWebSpeechAPI({
    lang: 'fa-IR',
    continuous: false,
    interimResults: false
  });

  const { sendMessage, isConnected, connectionError } = useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || 
         (process.env.NODE_ENV === 'production' 
           ? '' // Disable WebSocket in production if not configured
           : 'ws://localhost:8000/ws/chat'),
    onMessage: async (data) => {
      if (data.type === 'message') {
        setLastTranscription(data.user_message);
        setBotResponse(data.bot_message);
        
        // Play audio response using Web Speech API
        if (data.bot_message && !isMuted && synthesis.isSupported) {
          synthesis.speak(data.bot_message, {
            rate: 0.8,
            pitch: 1,
            volume: 1
          });
        }
        
        // Update conversation
        const newTurn = {
          id: Date.now(),
          user: data.user_message,
          bot: data.bot_message,
          timestamp: new Date(),
          emotion: data.emotion || 'neutral'
        };
        
        setConversation(prev => [...prev, newTurn]);
        onConversationUpdate([...conversation, newTurn]);
        
        setIsProcessing(false);
      }
    }
  });

  // Handle speech recognition results
  useEffect(() => {
    if (recognition.transcript && !recognition.isListening) {
      handleSpeechRecognized(recognition.transcript);
      recognition.resetTranscript();
    }
  }, [recognition.transcript, recognition.isListening]);

  // Handle speech recognition errors
  useEffect(() => {
    if (recognition.error) {
      console.error('Speech recognition error:', recognition.error);
      setIsProcessing(false);
    }
  }, [recognition.error]);

  const handleSpeechRecognized = useCallback(async (transcript: string) => {
    if (!transcript.trim()) return;
    
    setIsProcessing(true);
    setLastTranscription(transcript);

    if (!isConnected) {
      // Demo mode - show a sample response
      const demoResponses = [
        { user: transcript, bot: "سلام! خوش آمدید. چطور می‌تونم کمکتون کنم؟" },
        { user: transcript, bot: "من یک ربات هوشمندم و همیشه آماده کمک به شما هستم!" },
        { user: transcript, bot: "متأسفانه سرویس آنلاین در دسترس نیست، اما می‌تونم به صورت آفلاین کمکتون کنم." }
      ];
      
      const randomResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)];
      
      setBotResponse(randomResponse.bot);
      
      // Speak the demo response
      if (!isMuted && synthesis.isSupported) {
        synthesis.speak(randomResponse.bot);
      }
      
      const newTurn = {
        id: Date.now(),
        user: transcript,
        bot: randomResponse.bot,
        timestamp: new Date(),
        emotion: 'neutral'
      };
      
      setConversation(prev => [...prev, newTurn]);
      onConversationUpdate([...conversation, newTurn]);
      setIsProcessing(false);
      return;
    }

    // Send to backend via WebSocket
    const success = sendMessage({
      type: 'text',
      text: transcript,
      timestamp: Date.now()
    });

    if (!success) {
      console.warn('Failed to send message - WebSocket not connected');
      setIsProcessing(false);
    }
  }, [sendMessage, isConnected, conversation, onConversationUpdate, isMuted, synthesis]);

  const handleRecordToggle = useCallback(async () => {
    if (isProcessing) return;
    
    if (recognition.isListening) {
      recognition.stopListening();
    } else {
      // Stop any playing speech
      if (synthesis.isSpeaking) {
        synthesis.cancel();
      }
      
      recognition.startListening();
    }
  }, [recognition, synthesis, isProcessing]);

  // Auto-start recording after bot finishes speaking
  useEffect(() => {
    if (!synthesis.isSpeaking && !isProcessing && !recognition.isListening && conversation.length > 0) {
      // Wait a moment then auto-record
      const timer = setTimeout(() => {
        if (!recognition.isListening && !isProcessing && isConnected && speechSupported) {
          handleRecordToggle();
        }
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [synthesis.isSpeaking, isProcessing, recognition.isListening, conversation.length, isConnected, speechSupported]);

  const getStatusText = () => {
    if (!speechSupported) return '🔴 مرورگر از تشخیص صدا پشتیبانی نمی‌کند';
    if (!isConnected) return '🔴 اتصال قطع شده';
    if (isProcessing) return '🧠 در حال پردازش...';
    if (recognition.isListening) return '🎤 در حال گوش دادن...';
    if (synthesis.isSpeaking) return '🔊 ربات در حال صحبت...';
    return '👂 آماده شنیدن - کلیک کنید';
  };

  const getStatusColor = () => {
    if (!speechSupported) return 'text-red-400';
    if (!isConnected) return 'text-red-400';
    if (isProcessing) return 'text-blue-400';
    if (recognition.isListening) return 'text-green-400';
    if (synthesis.isSpeaking) return 'text-purple-400';
    return 'text-gray-300';
  };

  return (
    <div className="flex flex-col items-center space-y-8 p-8">
      {/* Connection Status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex flex-col items-center space-y-2`}
      >
        <div className={`flex items-center space-x-2 text-sm ${
          isConnected ? 'text-green-400' : 'text-red-400'
        }`}>
          {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
          <span className="persian-text">
            {isConnected ? 'متصل به سرور' : 'قطع ارتباط'}
          </span>
        </div>
        
        {/* Speech API Support Status */}
        <div className={`flex items-center space-x-2 text-xs ${
          speechSupported ? 'text-green-400' : 'text-yellow-400'
        }`}>
          <span className="persian-text">
            {speechSupported ? '🎤 تشخیص صدا فعال' : '⚠️ تشخیص صدا در دسترس نیست'}
          </span>
        </div>
        
        {connectionError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-yellow-400 text-center persian-text max-w-md"
          >
            {connectionError === 'Backend service not available' 
              ? 'سرویس آنلاین در دسترس نیست - در حالت آفلاین' 
              : 'خطا در اتصال به سرور'}
          </motion.div>
        )}
      </motion.div>

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
                {recognition.confidence > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    اطمینان: {Math.round(recognition.confidence * 100)}%
                  </p>
                )}
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
          onClick={handleRecordToggle}
          disabled={isProcessing || !speechSupported}
          className={`relative w-32 h-32 rounded-full border-4 transition-all duration-300 ${
            !speechSupported
              ? 'bg-gray-500 border-gray-400 cursor-not-allowed'
              : recognition.isListening 
              ? 'bg-red-500 border-red-300 shadow-lg shadow-red-500/50' 
              : isProcessing
              ? 'bg-blue-500 border-blue-300 shadow-lg shadow-blue-500/50'
              : synthesis.isSpeaking
              ? 'bg-purple-500 border-purple-300 shadow-lg shadow-purple-500/50'
              : isConnected
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-300 hover:shadow-lg hover:shadow-green-500/50'
              : 'bg-gradient-to-r from-yellow-500 to-orange-500 border-yellow-300 hover:shadow-lg hover:shadow-yellow-500/50'
          }`}
          whileHover={speechSupported ? { scale: 1.05 } : {}}
          whileTap={speechSupported ? { scale: 0.95 } : {}}
          animate={recognition.isListening ? {
            scale: [1, 1.1, 1],
            transition: { duration: 1, repeat: Infinity }
          } : isProcessing ? {
            rotate: [0, 360],
            transition: { duration: 2, repeat: Infinity, ease: "linear" }
          } : {}}
        >
          {!speechSupported ? (
            <div className="w-12 h-12 text-white mx-auto flex items-center justify-center text-2xl">🚫</div>
          ) : isProcessing ? (
            <div className="w-12 h-12 text-white mx-auto flex items-center justify-center text-2xl">🧠</div>
          ) : synthesis.isSpeaking ? (
            <Volume2 className="w-12 h-12 text-white mx-auto" />
          ) : recognition.isListening ? (
            <MicOff className="w-12 h-12 text-white mx-auto" />
          ) : (
            <Mic className="w-12 h-12 text-white mx-auto" />
          )}
          
          {/* Pulse Animation */}
          {(recognition.isListening || synthesis.isSpeaking) && (
            <motion.div
              className={`absolute inset-0 rounded-full border-4 ${
                recognition.isListening ? 'border-red-400' : 'border-purple-400'
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
        
        {/* Voice Information */}
        {synthesis.persianVoice && (
          <p className="text-xs text-gray-500 mt-1">
            صدای فارسی: {synthesis.persianVoice.name}
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
    </div>
  );
}