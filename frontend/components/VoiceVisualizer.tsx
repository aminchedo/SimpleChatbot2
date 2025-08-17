'use client';
import { motion } from 'framer-motion';

interface VoiceVisualizerProps {
  isActive: boolean;
}

export default function VoiceVisualizer({ isActive }: VoiceVisualizerProps) {
  const bars = Array.from({ length: 20 }, (_, i) => i);

  return (
    <div className="flex items-center justify-center space-x-1 h-20">
      {bars.map((bar) => (
        <motion.div
          key={bar}
          className="bg-gradient-to-t from-purple-500 to-pink-500 w-2 rounded-full"
          animate={isActive ? {
            height: [10, Math.random() * 60 + 20, 10],
            opacity: [0.5, 1, 0.5],
          } : {
            height: 10,
            opacity: 0.3,
          }}
          transition={{
            duration: 0.5 + Math.random() * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}