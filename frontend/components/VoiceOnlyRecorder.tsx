'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, Wifi, WifiOff } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useWebSocket } from '@/hooks/useWebSocket';

interface VoiceOnlyRecorderProps {
  onConversationUpdate: (conversation: any[]) => void;
}

export default function VoiceOnlyRecorder({ onConversationUpdate }: VoiceOnlyRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [conversation, setConversation] = useState<any[]>([]);
  const [lastTranscription, setLastTranscription] = useState('');
  const [botResponse, setBotResponse] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const { startRecording, stopRecording } = useAudioRecorder({
    onDataAvailable: setAudioBlob,
  });

  const { sendMessage, isConnected } = useWebSocket({
    url: process.env.NODE_ENV === 'production' 
      ? 'wss://your-backend.railway.app/ws/chat'
      : 'ws://localhost:8000/ws/chat',
    onMessage: async (data) => {
      if (data.type === 'message') {
        setLastTranscription(data.user_message);
        setBotResponse(data.bot_message);
        
        // Play audio response
        if (data.audio && !isMuted) {
          await playAudioResponse(data.audio);
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

  // Auto-send audio when recording stops
  useEffect(() => {
    if (audioBlob && !isRecording) {
      handleSendAudio(audioBlob);
      setAudioBlob(null);
    }
  }, [audioBlob, isRecording]);

  const handleRecordToggle = useCallback(async () => {
    if (isProcessing) return;
    
    if (isRecording) {
      await stopRecording();
      setIsRecording(false);
      setIsProcessing(true);
    } else {
      // Stop any playing audio
      if (currentAudio) {
        currentAudio.pause();
        setIsPlaying(false);
      }
      
      await startRecording();
      setIsRecording(true);
    }
  }, [isRecording, isProcessing, startRecording, stopRecording, currentAudio]);

  const handleSendAudio = useCallback(async (audioBlob: Blob) => {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    sendMessage({
      type: 'audio',
      data: base64Audio,
      timestamp: Date.now()
    });
  }, [sendMessage]);

  const playAudioResponse = useCallback(async (base64Audio: string) => {
    try {
      const audioData = atob(base64Audio);
      const audioBlob = new Blob([new Uint8Array([...audioData].map(c => c.charCodeAt(0)))], {
        type: 'audio/wav'
      });
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      setCurrentAudio(audio);
      setIsPlaying(true);
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
      
    } catch (error) {
      console.error('Audio playback error:', error);
      setIsPlaying(false);
    }
  }, []);

  // Auto-start recording after bot finishes speaking
  useEffect(() => {
    if (!isPlaying && !isProcessing && !isRecording && conversation.length > 0) {
      // Wait a moment then auto-record
      const timer = setTimeout(() => {
        if (!isRecording && !isProcessing && isConnected) {
          handleRecordToggle();
        }
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isPlaying, isProcessing, isRecording, conversation.length, isConnected]);

  const getStatusText = () => {
    if (!isConnected) return '🔴 اتصال قطع شده';
    if (isProcessing) return '🧠 در حال پردازش...';
    if (isRecording) return '🎤 در حال ضبط صدا...';
    if (isPlaying) return '🔊 ربات در حال صحبت...';
    return '👂 گوش می‌دهم... کلیک کنید';
  };

  const getStatusColor = () => {
    if (!isConnected) return 'text-red-400';
    if (isProcessing) return 'text-blue-400';
    if (isRecording) return 'text-green-400';
    if (isPlaying) return 'text-purple-400';
    return 'text-gray-300';
  };

  return (
    <div className="flex flex-col items-center space-y-8 p-8">
      {/* Connection Status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex items-center space-x-2 text-sm ${
          isConnected ? 'text-green-400' : 'text-red-400'
        }`}
      >
        {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
        <span className="persian-text">
          {isConnected ? 'متصل به سرور' : 'قطع ارتباط'}
        </span>
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
          disabled={!isConnected || isProcessing}
          className={`relative w-32 h-32 rounded-full border-4 transition-all duration-300 ${
            isRecording 
              ? 'bg-red-500 border-red-300 shadow-lg shadow-red-500/50' 
              : isProcessing
              ? 'bg-blue-500 border-blue-300 shadow-lg shadow-blue-500/50'
              : isPlaying
              ? 'bg-purple-500 border-purple-300 shadow-lg shadow-purple-500/50'
              : isConnected
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-300 hover:shadow-lg hover:shadow-green-500/50'
              : 'bg-gray-500 border-gray-400 cursor-not-allowed'
          }`}
          whileHover={isConnected ? { scale: 1.05 } : {}}
          whileTap={isConnected ? { scale: 0.95 } : {}}
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
          ) : isPlaying ? (
            <Volume2 className="w-12 h-12 text-white mx-auto" />
          ) : isRecording ? (
            <MicOff className="w-12 h-12 text-white mx-auto" />
          ) : (
            <Mic className="w-12 h-12 text-white mx-auto" />
          )}
          
          {/* Pulse Animation */}
          {(isRecording || isPlaying) && (
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
    </div>
  );
}