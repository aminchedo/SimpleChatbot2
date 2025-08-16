'use client';

interface TypingIndicatorProps {
  status: string;
}

export default function TypingIndicator({ status }: TypingIndicatorProps) {
  return (
    <div className="flex items-center justify-center space-x-2 p-4">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
      <p className="text-gray-400 ml-2">{status}</p>
    </div>
  );
}
