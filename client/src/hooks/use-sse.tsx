import { useEffect, useRef, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface SSEMessage {
  type: string;
  order?: any;
  timestamp: string;
}

interface SSEHookOptions {
  endpoint: string;
  onMessage?: (message: SSEMessage) => void;
  onNewOrder?: (order: any) => void;
  onOrderStatusUpdate?: (order: any) => void;
  onPaymentStatusUpdate?: (order: any) => void;
  autoReconnect?: boolean;
}

export function useSSE({
  endpoint,
  onMessage,
  onNewOrder,
  onOrderStatusUpdate,
  onPaymentStatusUpdate,
  autoReconnect = true
}: SSEHookOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    console.log(`Establishing SSE connection to ${endpoint}`);
    const eventSource = new EventSource(endpoint, {
      withCredentials: true
    });

    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('SSE connection opened');
      setIsConnected(true);
      setConnectionError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const message: SSEMessage = JSON.parse(event.data);
        console.log('SSE message received:', message);
        
        // Call general message handler
        if (onMessage) {
          onMessage(message);
        }

        // Handle specific message types
        switch (message.type) {
          case 'connected':
            console.log('SSE connection confirmed');
            break;
          
          case 'new_order':
            console.log('New order received via SSE:', message.order);
            if (onNewOrder && message.order) {
              onNewOrder(message.order);
              // Show toast notification for cafe managers
              toast({
                title: "New Order Received!",
                description: `Order #${message.order.id} from ${message.order.user.first_name} ${message.order.user.last_name}`,
                duration: 5000,
              });
            }
            break;
          
          case 'order_status_update':
            console.log('Order status update received via SSE:', message.order);
            if (onOrderStatusUpdate && message.order) {
              onOrderStatusUpdate(message.order);
              // Show toast notification for users
              toast({
                title: "Order Status Updated",
                description: `Your order #${message.order.id} is now ${message.order.status}`,
                duration: 4000,
              });
            }
            break;
          
          case 'payment_status_update':
            console.log('Payment status update received via SSE:', message.order);
            if (onPaymentStatusUpdate && message.order) {
              onPaymentStatusUpdate(message.order);
              // Show toast notification for users
              toast({
                title: "Payment Status Updated",
                description: `Payment for order #${message.order.id} is ${message.order.payment_status}`,
                duration: 4000,
              });
            }
            break;
          
          default:
            console.log('Unknown SSE message type:', message.type);
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      setIsConnected(false);
      setConnectionError('Connection lost');
      
      eventSource.close();
      
      // Auto-reconnect after 3 seconds if enabled
      if (autoReconnect) {
        console.log('Attempting to reconnect SSE in 3 seconds...');
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      }
    };
  }, [endpoint, onMessage, onNewOrder, onOrderStatusUpdate, onPaymentStatusUpdate, autoReconnect, toast]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('Closing SSE connection');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionError(null);
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      connect();
    }, 100);
  }, [connect, disconnect]);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    connectionError,
    reconnect,
    disconnect
  };
}