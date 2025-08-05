import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { WebSocketMessage } from "@/lib/types";
import { WEBSOCKET_MESSAGE_TYPES } from "@/lib/constants";

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const {
    onMessage,
    onConnect,
    onDisconnect,
    reconnectAttempts = 3, // Reduced from 5 to 3 to prevent connection churn
    reconnectInterval = 10000, // Increased from 3s to 10s to reduce server load
  } = options;

  const connect = () => {
    if (!user) return;

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}`;
      console.log(`🔌 Attempting WebSocket connection to: ${wsUrl}`);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
        
        // Authenticate the connection
        const authMessage = {
          type: WEBSOCKET_MESSAGE_TYPES.AUTHENTICATE,
          userId: user.id,
        };
        console.log('🔐 Sending authentication:', authMessage);
        ws.send(JSON.stringify(authMessage));

        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', message);
          onMessage?.(message);
        } catch (error) {
          console.error("❌ Failed to parse WebSocket message:", error);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        onDisconnect?.();

        // Attempt to reconnect if we haven't exceeded the limit
        if (reconnectAttemptsRef.current < reconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else {
          setConnectionError("Failed to maintain connection after multiple attempts");
        }
      };

      ws.onerror = (error) => {
        console.error('💥 WebSocket error:', error);
        setConnectionError("WebSocket connection error");
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      setConnectionError("Failed to establish connection");
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected");
    }
  };

  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user]);

  return {
    isConnected,
    connectionError,
    sendMessage,
    connect,
    disconnect,
  };
}
