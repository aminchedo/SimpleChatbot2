'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatInterface from '@/components/ChatInterface';
import AudioRecorder from '@/components/AudioRecorder';
import VoiceVisualizer from '@/components/VoiceVisualizer';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: number;
  audio?: string;
}

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-50">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/10"
              style={{
                width: Math.random() * 4 + 1,
                height: Math.random() * 4 + 1,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col h-screen">
        {/* Header */}
        <motion.header 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="p-6 text-center"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 gradient-text persian-text">
            هوش مصنوعی فارسی
          </h1>
          <p className="text-xl text-purple-200 persian-text">با من فارسی صحبت کنید</p>
        </motion.header>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4">
          <ChatInterface 
            messages={messages}
            isProcessing={isProcessing}
          />
          
          {/* Voice Visualizer */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="my-8"
              >
                <VoiceVisualizer isActive={isRecording} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Audio Recorder */}
          <div className="sticky bottom-0 pb-6">
            <AudioRecorder 
              onRecordingChange={setIsRecording}
              onMessage={(msg) => setMessages(prev => [...prev, msg])}
              onProcessingChange={setIsProcessing}
            />
          </div>
        </div>
      </div>
    </div>
  );
}