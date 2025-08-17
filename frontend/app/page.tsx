'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import VoiceOnlyRecorder from '@/components/VoiceOnlyRecorder';
import VoiceVisualizer from '@/components/VoiceVisualizer';

export default function VoiceOnlyChat() {
  const [conversation, setConversation] = useState<Array<{
    id: number;
    user: string;
    bot: string;
    timestamp: Date;
    emotion: string;
  }>>([]);
  const [isActive, setIsActive] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-30">
          {[...Array(100)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/10"
              style={{
                width: Math.random() * 6 + 2,
                height: Math.random() * 6 + 2,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -50, 0],
                opacity: [0.2, 1, 0.2],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: Math.random() * 4 + 3,
                repeat: Infinity,
                delay: Math.random() * 3,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col h-screen justify-center">
        {/* Header */}
        <motion.header 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-12"
        >
          <motion.h1 
            className="text-5xl md:text-7xl font-bold text-white mb-4 persian-text"
            animate={{
              backgroundPosition: ['0%', '100%'],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            style={{
              background: 'linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7)',
              backgroundSize: '200% 100%',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            🗣️ ربات گفتگوی فارسی
          </motion.h1>
          
          <motion.p 
            className="text-2xl text-purple-200 mb-2 persian-text"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            با من صحبت کنید - فقط با صدا!
          </motion.p>
          
          <p className="text-lg text-purple-300">
            🎤 Real-time Voice • 🧠 AI Persian • 🔊 Natural Speech
          </p>
        </motion.header>

        {/* Voice Visualizer */}
        <div className="mb-8">
          <VoiceVisualizer isActive={isActive} />
        </div>

        {/* Voice Recorder */}
        <VoiceOnlyRecorder 
          onConversationUpdate={(conv) => {
            setConversation(conv);
            setIsActive(conv.length > 0);
          }}
        />
        
        {/* Debug conversation count (hidden) */}
        <div className="hidden">{conversation.length}</div>

        {/* Footer Info */}
        <motion.footer 
          className="text-center mt-12 text-purple-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p className="text-sm">
            🔧 Multi-Engine STT • 🎯 BERT Emotion • 🗣️ Natural TTS • ⚡ Real-time
          </p>
        </motion.footer>
      </div>
    </div>
  );
}