import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface SSEOptions {
  endpoint: string;
  onNewOrder?: (order: any) => void;
  onOrderStatusUpdate?: (order: any) => void;
  onPaymentStatusUpdate?: (order: any) => void;
}

export function useSSESimple({ endpoint, onNewOrder, onOrderStatusUpdate, onPaymentStatusUpdate }: SSEOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    console.log(`🔌 Setting up SSE connection to ${endpoint}`);
    
    const eventSource = new EventSource(endpoint, {
      withCredentials: true
    });

    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('✅ SSE connection opened successfully');
    };

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('📨 SSE message received:', message);

        switch (message.type) {
          case 'connected':
            console.log('🤝 SSE connection confirmed');
            break;
          
          case 'new_order':
            console.log('🔔 NEW ORDER NOTIFICATION!', message.order);
            if (onNewOrder && message.order) {
              onNewOrder(message.order);
              toast({
                title: "🔔 New Order!",
                description: `Order #${message.order.id} from ${message.order.user?.first_name} ${message.order.user?.last_name}`,
                duration: 6000,
              });
            }
            break;
          
          case 'order_status_update':
            console.log('📋 Order status update:', message.order);
            if (onOrderStatusUpdate && message.order) {
              onOrderStatusUpdate(message.order);
              toast({
                title: "Order Updated",
                description: `Order #${message.order.id} is now ${message.order.status}`,
                duration: 4000,
              });
            }
            break;
          
          case 'payment_status_update':
            console.log('💳 Payment status update:', message.order);
            if (onPaymentStatusUpdate && message.order) {
              onPaymentStatusUpdate(message.order);
              toast({
                title: "Payment Updated", 
                description: `Payment for order #${message.order.id} is ${message.order.payment_status}`,
                duration: 4000,
              });
            }
            break;
        }
      } catch (error) {
        console.error('❌ Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('❌ SSE connection error:', error);
    };

    return () => {
      console.log('🔌 Cleaning up SSE connection');
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [endpoint]); // Only depend on endpoint, not the callback functions

  return {
    isConnected: eventSourceRef.current?.readyState === EventSource.OPEN
  };
}