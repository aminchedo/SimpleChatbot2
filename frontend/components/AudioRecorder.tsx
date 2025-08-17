import React, { useState, useRef, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

interface AudioRecorderProps {
  onTranscriptReceived: (transcript: string) => void;
  onErrorOccurred: (error: string) => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onTranscriptReceived,
  onErrorOccurred
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Fix: Remove connectionError from destructuring
  const { sendMessage, isConnected, connectionStatus } = useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || 
         (process.env.NODE_ENV === 'production' 
           ? '' // Disable WebSocket in production if not configured
           : 'ws://localhost:3001'),
    onMessage: (data) => {
      if (data.type === 'transcript') {
        onTranscriptReceived(data.text);
      } else if (data.type === 'error') {
        onErrorOccurred(data.message);
      }
    }
  });

  // Handle connection status changes
  useEffect(() => {
    if (connectionStatus === 'error') {
      setRecordingError('اتصال با سرور قطع شده است');
      onErrorOccurred('Connection error occurred');
    } else if (connectionStatus === 'disconnected') {
      setRecordingError('اتصال برقرار نیست');
    } else if (connectionStatus === 'connected') {
      setRecordingError(null);
    }
  }, [connectionStatus, onErrorOccurred]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      
      // Set up audio analysis for visual feedback
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        
        // Convert to base64 and send via WebSocket
        const reader = new FileReader();
        reader.onload = () => {
          const base64Audio = (reader.result as string).split(',')[1];
          if (isConnected) {
            sendMessage({
              type: 'audio',
              data: base64Audio,
              mimeType: 'audio/webm'
            });
          } else {
            onErrorOccurred('اتصال برقرار نیست');
          }
        };
        reader.readAsDataURL(audioBlob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingError(null);
      
      // Start audio level monitoring
      monitorAudioLevel();
      
    } catch (error) {
      console.error('Error starting recording:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطا در شروع ضبط صدا';
      setRecordingError(errorMessage);
      onErrorOccurred(errorMessage);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
      
      // Clean up
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  };

  const monitorAudioLevel = () => {
    if (!analyserRef.current || !isRecording) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateLevel = () => {
      if (!analyserRef.current || !isRecording) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      setAudioLevel(average / 255);
      
      if (isRecording) {
        requestAnimationFrame(updateLevel);
      }
    };
    
    updateLevel();
  };

  // Connection status display
  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'متصل';
      case 'connecting':
        return 'در حال اتصال...';
      case 'disconnected':
        return 'قطع ارتباط';
      case 'error':
        return 'خطا در اتصال';
      default:
        return 'نامشخص';
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-500';
      case 'connecting':
        return 'text-yellow-500';
      case 'disconnected':
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-6">
      {/* Connection Status */}
      <div className={`text-sm font-medium ${getConnectionStatusColor()}`}>
        وضعیت اتصال: {getConnectionStatusText()}
      </div>

      {/* Recording Button */}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={connectionStatus !== 'connected'}
        className={`
          w-20 h-20 rounded-full border-4 transition-all duration-200
          ${isRecording 
            ? 'bg-red-500 border-red-600 hover:bg-red-600' 
            : 'bg-blue-500 border-blue-600 hover:bg-blue-600 disabled:bg-gray-400 disabled:border-gray-500'
          }
          ${connectionStatus !== 'connected' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className="text-white text-sm font-bold">
          {isRecording ? 'توقف' : 'ضبط'}
        </div>
      </button>

      {/* Audio Level Indicator */}
      {isRecording && (
        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 transition-all duration-100"
            style={{ width: `${audioLevel * 100}%` }}
          />
        </div>
      )}

      {/* Error Display */}
      {recordingError && (
        <div className="text-red-500 text-sm text-center max-w-xs">
          {recordingError}
        </div>
      )}
    </div>
  );
};