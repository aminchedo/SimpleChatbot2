'use client';
import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Send, Wifi, WifiOff } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useWebSocket } from '@/hooks/useWebSocket';

interface AudioRecorderProps {
  onRecordingChange: (recording: boolean) => void;
  onMessage: (message: any) => void;
  onProcessingChange: (processing: boolean) => void;
}

export default function AudioRecorder({ 
  onRecordingChange, 
  onMessage, 
  onProcessingChange 
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const { startRecording, stopRecording } = useAudioRecorder({
    onDataAvailable: setAudioBlob,
  });

  const { sendMessage, isConnected } = useWebSocket({
    url: process.env.NODE_ENV === 'production' 
      ? 'wss://your-backend.railway.app/ws/chat'
      : 'ws://localhost:8000/ws/chat',
    onMessage: (data) => {
      onMessage(data);
      onProcessingChange(false);
    }
  });

  const handleRecordToggle = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
      setIsRecording(false);
      onRecordingChange(false);
    } else {
      await startRecording();
      setIsRecording(true);
      onRecordingChange(true);
    }
  }, [isRecording, startRecording, stopRecording, onRecordingChange]);

  const handleSendAudio = useCallback(async () => {
    if (audioBlob) {
      onProcessingChange(true);
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      // Add user message immediately
      const userMessage = {
        id: Date.now().toString(),
        type: 'user' as const,
        content: 'پیام صوتی ارسال شد...',
        timestamp: Date.now()
      };
      onMessage(userMessage);
      
      // Send to backend
      sendMessage({
        type: 'audio',
        data: base64Audio,
        timestamp: Date.now()
      });
      
      setAudioBlob(null);
    }
  }, [audioBlob, sendMessage, onProcessingChange, onMessage]);

  return (
    <div className="flex flex-col items-center space-y-4">
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

      {/* Audio Preview */}
      {audioBlob && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-2xl p-4"
        >
          <audio 
            src={URL.createObjectURL(audioBlob)} 
            controls 
            className="w-full mb-3"
          />
          <button
            onClick={handleSendAudio}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-2 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <Send size={20} />
            <span className="persian-text">ارسال صدا</span>
          </button>
        </motion.div>
      )}

      {/* Record Button */}
      <motion.button
        onClick={handleRecordToggle}
        disabled={!isConnected}
        className={`relative w-20 h-20 rounded-full border-4 transition-all duration-300 ${
          isRecording 
            ? 'bg-red-500 border-red-300 shadow-lg shadow-red-500/50' 
            : isConnected
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 border-purple-300 hover:shadow-lg hover:shadow-purple-500/50'
            : 'bg-gray-500 border-gray-400 cursor-not-allowed'
        }`}
        whileHover={isConnected ? { scale: 1.05 } : {}}
        whileTap={isConnected ? { scale: 0.95 } : {}}
        animate={isRecording ? {
          scale: [1, 1.1, 1],
          transition: { duration: 1, repeat: Infinity }
        } : {}}
      >
        {isRecording ? (
          <MicOff className="w-8 h-8 text-white mx-auto" />
        ) : (
          <Mic className="w-8 h-8 text-white mx-auto" />
        )}
        
        {/* Pulse Animation */}
        {isRecording && (
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-red-400"
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

      {/* Status Text */}
      <motion.p 
        className="text-purple-200 text-center persian-text"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {!isConnected 
          ? '🔌 در حال اتصال به سرور...'
          : isRecording 
          ? '🎤 در حال ضبط...' 
          : '🎯 کلیک کنید تا شروع کنید'
        }
      </motion.p>
    </div>
  );
}