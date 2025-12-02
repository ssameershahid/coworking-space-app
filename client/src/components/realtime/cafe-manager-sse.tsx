import { useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSSESimple } from "@/hooks/use-sse-simple";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { initializeAudioNotifications } from "@/lib/audio-notifications";

export function CafeManagerSSE() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Only active for cafe managers
  const isCafeManager = user?.role === "cafe_manager";

  useEffect(() => {
    if (!isCafeManager) return;
    // ensure audio element is ready
    initializeAudioNotifications();
    // mark global SSE active to avoid duplicate listeners on specific pages
    (window as any).__CK_GLOBAL_SSE_ACTIVE = true;
    return () => {
      (window as any).__CK_GLOBAL_SSE_ACTIVE = false;
    };
  }, [isCafeManager]);

  // CRITICAL FIX: Use useCallback to ensure stable callback references
  // This prevents closure issues where queryClient or toast could be stale
  const handleNewOrder = useCallback((order: any) => {
    console.log('🔔 CafeManagerSSE: New order received, triggering refetch for order #', order.id);
    // Force immediate refetch of cafe orders list (not just invalidate)
    queryClient.refetchQueries({ queryKey: ["/api/cafe/orders/all"] })
      .then(() => console.log('✅ CafeManagerSSE: Refetch completed'))
      .catch((err) => console.error('❌ CafeManagerSSE: Refetch failed:', err));
    toast({
      title: "🔔 NEW ORDER RECEIVED!",
      description: `Order #${order.id} • PKR ${order.total_amount}`,
      duration: 15000,
      variant: "destructive",
    });
  }, [queryClient, toast]);

  const handleOrderStatusUpdate = useCallback(() => {
    console.log('📋 CafeManagerSSE: Order status update, triggering refetch');
    queryClient.refetchQueries({ queryKey: ["/api/cafe/orders/all"] })
      .then(() => console.log('✅ CafeManagerSSE: Refetch completed'))
      .catch((err) => console.error('❌ CafeManagerSSE: Refetch failed:', err));
  }, [queryClient]);

  useSSESimple({
    endpoint: "/events",
    disabled: !isCafeManager,
    onNewOrder: handleNewOrder,
    onOrderStatusUpdate: handleOrderStatusUpdate,
  });

  return null;
}


