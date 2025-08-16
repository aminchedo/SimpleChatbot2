'use client';
// NOTE: You need to run `npm install framer-motion` for the animations to work.
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import TypingIndicator from '@/components/TypingIndicator';

type Message = {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
};

type Status = 'idle' | 'listening' | 'thinking' | 'replying';

const statusMessages: { [key in Status]: string } = {
  idle: 'Click the mic to start',
  listening: 'Listening...',
  thinking: 'Thinking...',
  replying: 'Replying...',
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const { text, isListening, startListening, stopListening, hasRecognitionSupport } = useSpeechRecognition();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isListening) {
      setStatus('listening');
    } else {
      if (text) {
        setStatus('thinking');
      } else {
        setStatus('idle');
      }
    }
  }, [isListening, text]);

  const playAudio = (base64Audio: string) => {
    return new Promise<void>((resolve) => {
      const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
      audio.play();
      audio.onended = () => resolve();
    });
  };

  // Effect to handle sending text to the backend and receiving the response
  useEffect(() => {
    const processRequest = async () => {
      if (status === 'thinking' && text) {
        // Add user message to chat
        const userMessage: Message = {
          id: Date.now(),
          text,
          sender: 'user',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, userMessage]);

        try {
          // Send text to backend API
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
          });

          if (!response.ok) {
            throw new Error('Failed to get response from server.');
          }

          const data = await response.json();

          setStatus('replying');
          const botMessage: Message = {
            id: Date.now(),
            text: data.text,
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages(prev => [...prev, botMessage]);

          await playAudio(data.audio);

          setStatus('idle');

        } catch (error) {
          console.error("Error processing chat request:", error);
          const errorMessage: Message = {
            id: Date.now(),
            text: "Sorry, I couldn't respond right now.",
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages(prev => [...prev, errorMessage]);
          setStatus('idle');
        }
      }
    };
    processRequest();
  }, [status, text]);

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-4">
      <div className="w-full max-w-2xl flex flex-col h-[90vh] bg-gray-800 rounded-2xl shadow-lg">
        {/* Chat history */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && status === 'idle' ? (
             <p className="text-center text-gray-400">Your conversation will appear here.</p>
          ) : (
            <AnimatePresence>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`px-4 py-2 rounded-lg max-w-xs lg:max-w-md ${msg.sender === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}>
                    <p>{msg.text}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 px-1">{msg.timestamp}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          <AnimatePresence>
            {status !== 'idle' && status !== 'thinking' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <TypingIndicator status={statusMessages[status]} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Microphone button */}
        <div className="p-6 flex justify-center items-center border-t border-gray-700">
          {!hasRecognitionSupport ? (
            <p className="text-red-500">Speech recognition is not supported by your browser.</p>
          ) : (
            <motion.button
              onClick={handleMicClick}
              disabled={status !== 'idle' && status !== 'listening'}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all
                ${isListening ? 'bg-red-500' : 'bg-blue-500 hover:bg-blue-600'}
                disabled:bg-gray-600 disabled:cursor-not-allowed`
              }
              whileHover={{ scale: status === 'idle' ? 1.1 : 1 }}
              whileTap={{ scale: 0.9 }}
              animate={status === 'idle' ? { scale: [1, 1.05, 1] } : {}}
              transition={status === 'idle' ? { duration: 1.5, repeat: Infinity } : {}}
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v2a3 3 0 01-3 3z" />
              </svg>
            </motion.button>
          )}
        </div>
      </div>
    </main>
  );
}
