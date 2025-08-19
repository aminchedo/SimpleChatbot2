'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceOnlyRecorder from '@/components/VoiceOnlyRecorder';
import VoiceVisualizer from '@/components/VoiceVisualizer';

interface ChatMessage {
  id: string;
  user: string;
  bot: string;
  timestamp: Date;
  emotion: string;
}

export default function VoiceOnlyChat() {
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
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
          
          <p className="text-lg text-purple-300 mb-4">
            🎤 Web Speech API • 🧠 Client-Side AI • 🔊 Browser TTS • ⚡ No Backend Required
          </p>

          {/* New Features Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="inline-flex items-center bg-green-500/20 border border-green-400 rounded-full px-4 py-2 mb-4"
          >
            <span className="text-green-300 text-sm font-medium">
              ✨ بدون نیاز به سرور - کاملاً رایگان!
            </span>
          </motion.div>
        </motion.header>

        {/* Voice Visualizer */}
        <div className="mb-8">
          <VoiceVisualizer isActive={isActive} />
        </div>

        {/* Voice Recorder */}
        <VoiceOnlyRecorder 
          onConversationUpdate={(conv: ChatMessage[]) => {
            setConversation(conv);
          }}
          onRecordingChange={(recording: boolean) => {
            setIsActive(recording);
          }}
        />

        {/* Features Info */}
        <motion.div
          className="text-center mt-8 max-w-4xl mx-auto px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <div className="text-2xl mb-2">🎤</div>
              <h3 className="text-white font-semibold mb-1">تشخیص گفتار</h3>
              <p className="text-purple-200 text-xs">Web Speech API</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <div className="text-2xl mb-2">🧠</div>
              <h3 className="text-white font-semibold mb-1">هوش مصنوعی</h3>
              <p className="text-purple-200 text-xs">Client-Side Processing</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <div className="text-2xl mb-2">🔊</div>
              <h3 className="text-white font-semibold mb-1">تبدیل متن به گفتار</h3>
              <p className="text-purple-200 text-xs">Browser TTS</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="text-white font-semibold mb-1">سرعت بالا</h3>
              <p className="text-purple-200 text-xs">No Server Needed</p>
            </div>
          </div>
        </motion.div>

        {/* Footer Info */}
        <motion.footer 
          className="text-center mt-12 text-purple-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <p className="text-sm">
            🌟 کاملاً رایگان • 🔒 حفظ حریم خصوصی • 🚀 بدون محدودیت استفاده
          </p>
          <p className="text-xs mt-2 text-purple-300">
            برای بهترین تجربه از Chrome, Edge, Safari یا Firefox استفاده کنید
          </p>
        </motion.footer>
      </div>
    </div>
  );
}