import { useState, useEffect, useRef, useCallback } from 'react';

interface UseWebSocketProps {
  url: string;
  onMessage: (data: any) => void;
  maxRetries?: number;
  retryInterval?: number;
}

export function useWebSocket({ 
  url, 
  onMessage, 
  maxRetries = 5, 
  retryInterval = 3000 
}: UseWebSocketProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    // Don't attempt connection if URL contains placeholder or if max retries exceeded
    if (url.includes('your-backend.railway.app') || retryCount >= maxRetries) {
      console.warn('WebSocket connection disabled: Backend not configured or max retries exceeded');
      setConnectionError('Backend service not available');
      return;
    }

    try {
      console.log(`Attempting WebSocket connection to: ${url} (attempt ${retryCount + 1}/${maxRetries})`);
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setRetryCount(0);
        setConnectionError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        setIsConnected(false);
        
        // Only attempt to reconnect if we haven't exceeded max retries
        if (retryCount < maxRetries) {
          setRetryCount(prev => prev + 1);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, retryInterval);
        } else {
          setConnectionError('Failed to connect after maximum retries');
          console.error('Max WebSocket reconnection attempts exceeded');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setIsConnected(false);
      setConnectionError('Failed to create WebSocket connection');
    }
  }, [url, onMessage, retryCount, maxRetries, retryInterval]);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    } else {
      console.warn('WebSocket is not connected - message not sent');
      return false;
    }
  }, []);

  const resetConnection = useCallback(() => {
    setRetryCount(0);
    setConnectionError(null);
    if (wsRef.current) {
      wsRef.current.close();
    }
    connect();
  }, [connect]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected,
    sendMessage,
    connectionError,
    retryCount,
    resetConnection,
  };
}