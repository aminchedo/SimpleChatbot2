'use client';
import { motion } from 'framer-motion';
import { Volume2, User, Bot } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: number;
  audio?: string;
}

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.type === 'user';

  const playAudio = () => {
    if (message.audio) {
      const audio = new Audio(`data:audio/wav;base64,${message.audio}`);
      audio.play();
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <motion.div
        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
            : 'glass-effect text-white'
        }`}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        {/* Message Header */}
        <div className="flex items-center mb-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
            isUser ? 'bg-white/20' : 'bg-purple-500/20'
          }`}>
            {isUser ? <User size={14} /> : <Bot size={14} />}
          </div>
          <span className="text-xs opacity-75 persian-text">
            {isUser ? 'شما' : 'دستیار هوشمند'}
          </span>
        </div>

        {/* Message Content */}
        <p className="text-sm leading-relaxed persian-text">{message.content}</p>

        {/* Audio Controls */}
        {message.audio && (
          <motion.button
            onClick={playAudio}
            className="mt-2 flex items-center space-x-1 text-xs opacity-75 hover:opacity-100 transition-opacity"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Volume2 size={12} />
            <span className="persian-text">پخش صدا</span>
          </motion.button>
        )}

        {/* Timestamp */}
        <div className="text-xs opacity-50 mt-2 text-left">
          {new Date(message.timestamp).toLocaleTimeString('fa-IR')}
        </div>
      </motion.div>
    </div>
  );
}