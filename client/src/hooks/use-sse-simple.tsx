import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { playNotificationSound } from '@/lib/audio-notifications';

interface SSEOptions {
  endpoint: string;
  onNewOrder?: (order: any) => void;
  onOrderStatusUpdate?: (order: any) => void;
  onPaymentStatusUpdate?: (order: any) => void;
  disabled?: boolean;
}

export function useSSESimple({ endpoint, onNewOrder, onOrderStatusUpdate, onPaymentStatusUpdate, disabled }: SSEOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (disabled) {
      // Ensure any previous connection is closed if we get disabled
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null as any;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }
    const connectSSE = () => {
      // Clean up any existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      
      const eventSource = new EventSource(endpoint, {
        withCredentials: true
      });

      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          switch (message.type) {
            case 'order.new':
              if (onNewOrder && message.data) {
                // Play audio notification for new orders
                playNotificationSound();
                
                onNewOrder(message.data);
                toast({
                  title: "NEW CAFE ORDER!",
                  description: `Order #${message.data.id} from ${message.data.user?.first_name} ${message.data.user?.last_name} - PKR ${message.data.total_amount}`,
                  duration: 15000,
                  variant: "destructive",
                });
              }
              break;
            
            case 'order.update':
              if (onOrderStatusUpdate && message.data) {
                onOrderStatusUpdate(message.data);
                toast({
                  title: "Order Updated",
                  description: `Order #${message.data.id} is now ${message.data.status}`,
                  duration: 4000,
                });
              }
              break;
            
            case 'heartbeat':
              // Heartbeat - no action needed
              break;
          }
        } catch (error) {
          console.error('❌ Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ SSE connection error:', error);
        
        // Attempt to reconnect after 3 seconds
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log('🔄 SSE connection closed, attempting to reconnect in 3 seconds...');
          reconnectTimeoutRef.current = setTimeout(() => {
            connectSSE();
          }, 3000);
        }
      };
    };

    // Initial connection
    connectSSE();

    return () => {
      console.log('🔌 Cleaning up SSE connection');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [endpoint, disabled]); // Depend on endpoint and disabled flag

  return { eventSource: eventSourceRef.current };
}