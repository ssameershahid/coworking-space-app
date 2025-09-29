import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, Truck, Package, User, DollarSign, Calendar, TrendingUp, ShoppingCart, Receipt } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { useSSESimple } from "@/hooks/use-sse-simple";
import { formatPrice, formatPriceWithCurrency } from "@/lib/format-price";
import { 
  initializeAudioNotifications, 
  playNotificationSound
} from "@/lib/audio-notifications";




interface CafeOrder {
  id: number;
  user_id: number;
  total_amount: string;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivered' | 'cancelled' | 'deleted';
  billed_to: 'personal' | 'organization';
  org_id?: string;
  handled_by?: number;
  created_by?: number;
  payment_status?: 'paid' | 'unpaid';
  payment_updated_by?: number;
  payment_updated_at?: string;
  notes?: string;
  delivery_location?: string;
  site: string;
  created_at: string;
  updated_at?: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  organization?: {
    id: string;
    name: string;
  };
  items?: Array<{
    id: number;
    quantity: number;
    price: string;
    menu_item: {
      id: number;
      name: string;
      description: string;
    };
  }>;
}

const statusConfig = {
  pending: { label: "New Order", color: "bg-orange-100 text-orange-800", icon: Clock },
  accepted: { label: "Accepted", color: "bg-yellow-100 text-yellow-800", icon: CheckCircle },
  preparing: { label: "Preparing", color: "bg-blue-100 text-blue-800", icon: Package },
  ready: { label: "Ready", color: "bg-green-100 text-green-800", icon: CheckCircle },
  delivered: { label: "Delivered", color: "bg-gray-100 text-gray-800", icon: Truck },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: Clock },
  deleted: { label: "Deleted", color: "bg-red-200 text-red-900", icon: Clock }
};

export default function CafeManagerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<CafeOrder | null>(null);

  // Initialize audio notifications when component mounts
  useEffect(() => {
    if (user?.role === 'cafe_manager') {
      initializeAudioNotifications();
    }
  }, [user?.role]);

  // SSE for real-time order updates (simplified)
  // Real-time order notifications for cafe managers
  useSSESimple({
    endpoint: "/events",
    onNewOrder: (order) => {
      // Refresh orders list immediately
      queryClient.invalidateQueries({ queryKey: ['/api/cafe/orders/all'] });
      
      // Show prominent notification with audio
      toast({
        title: "🔔 NEW ORDER RECEIVED! 🔔",
        description: `Order #${order.id} from ${order.user?.first_name} ${order.user?.last_name} - PKR ${formatPrice(order.total_amount)}`,
        duration: 30000, // 30 seconds to ensure manager sees it
        variant: "destructive",
      });
    },
    onOrderStatusUpdate: (order) => {
      // Refresh orders list when status changes  
      queryClient.invalidateQueries({ queryKey: ['/api/cafe/orders/all'] });
    },
  });


  


  // Fetch all orders for the cafe manager
  const { data: orders = [], isLoading, dataUpdatedAt } = useQuery<CafeOrder[]>({
    queryKey: ['/api/cafe/orders/all'],
    enabled: !!user && user.role === 'cafe_manager'
  });
  
  // Log orders data when it changes for debugging
  console.log('📊 ORDERS DATA UPDATED:', {
    ordersCount: orders.length,
    lastUpdated: new Date(dataUpdatedAt).toLocaleTimeString(),
    latestOrder: orders[0] ? `#${orders[0].id}` : 'none'
  });



  // Update order status mutation
  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number, status: string }) => {
      return apiRequest("PATCH", `/api/cafe/orders/${orderId}/status`, {
        status
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cafe/orders/all'] });
      toast({
        title: "Order Updated",
        description: "Order status has been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update order status.",
        variant: "destructive"
      });
    }
  });

  const handleStatusChange = (orderId: number, newStatus: string) => {
    updateOrderStatus.mutate({ orderId, status: newStatus });
  };



  // Filter all orders to show only today's orders
  const todaysOrders = orders.filter(order => 
    new Date(order.created_at).toDateString() === new Date().toDateString()
  );
  // Only count orders that have been accepted or progressed further
  const todaysCountedOrders = todaysOrders.filter(order => 
    order.status === 'accepted' || order.status === 'preparing' || order.status === 'ready' || order.status === 'delivered'
  );
  
  // Calculate stats based on today's orders only
  const pendingOrders = todaysOrders.filter(order => order.status === 'pending');
  const startedOrders = todaysOrders.filter(order => order.status === 'accepted' || order.status === 'preparing');
  const readyOrders = todaysOrders.filter(order => order.status === 'ready');
  const deliveredOrders = todaysOrders.filter(order => order.status === 'delivered');

  const todaysRevenue = deliveredOrders
    .reduce((sum, order) => sum + parseFloat(order.total_amount), 0);

  const OrderCard = ({ order }: { order: CafeOrder }) => {
    const config = statusConfig[order.status];
    const Icon = config.icon;
    
    return (
      <Card className="mb-4 cursor-pointer hover:shadow-md transition-shadow" 
            onClick={() => setSelectedOrder(order)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between mb-2">
            <Badge className={`${config.color} whitespace-nowrap w-fit`}>
              <Icon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
            <div className="font-bold text-lg">{formatPriceWithCurrency(order.total_amount)}</div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Order #{order.id}
            </div>
            <div className="text-sm text-muted-foreground">
              {format(new Date(order.created_at), 'h:mm a')}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {order.user?.first_name} {order.user?.last_name}
            </span>
            {order.billed_to === 'organization' && (
              <Badge variant="outline" className="text-xs">
                {order.organization?.name}
              </Badge>
            )}
          </div>
          
          {order.delivery_location && (
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {order.delivery_location}
              </span>
            </div>
          )}
          
          {order.items && order.items.length > 0 && (
            <div className="space-y-1">
              {order.items.map((item) => (
                <div key={item.id} className="text-sm text-black font-medium">
                  {item.quantity}x {item.menu_item.name}
                </div>
              ))}
            </div>
          )}
          
          {order.notes && (
            <div className="mt-2 text-sm text-muted-foreground italic">
              Note: {order.notes}
            </div>
          )}
          
          <div className="mt-3 flex gap-2">
            {order.status === 'pending' && (
              <Button 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(order.id, 'accepted');
                }}
              >
                Accept Order
              </Button>
            )}
            {order.status === 'accepted' && (
              <Button 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(order.id, 'preparing');
                }}
              >
                Start Preparing
              </Button>
            )}
            {order.status === 'preparing' && (
              <Button 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(order.id, 'ready');
                }}
              >
                Mark Ready
              </Button>
            )}
            {order.status === 'ready' && (
              <Button 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(order.id, 'delivered');
                }}
              >
                Mark Delivered
              </Button>
            )}
            {/* Manager Delete: allowed only for pending or accepted */}
            {(order.status === 'pending' || order.status === 'accepted') && (
              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(order.id, 'deleted');
                }}
              >
                Delete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Café Manager Dashboard</h1>
        <div className="flex items-center gap-4">
          <p className="text-gray-600">Manage orders and monitor café operations</p>
          {user?.site && (
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              📍 {user.site.replace('_', ' ').toUpperCase()}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="w-full">
          <div className="mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Management
            </h2>
            <p className="text-gray-600 mt-1">Manage and track all café orders</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Orders</p>
                <p className="text-2xl font-bold text-gray-900">{todaysCountedOrders.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatPriceWithCurrency(todaysRevenue)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">{pendingOrders.length}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold text-gray-900">{deliveredOrders.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Received Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Received ({pendingOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
            {pendingOrders.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No pending orders
              </div>
            )}
          </CardContent>
        </Card>

        {/* Started Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Started ({startedOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {startedOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
            {startedOrders.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No orders in preparation
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ready Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Ready ({readyOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {readyOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
            {readyOrders.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No orders ready
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delivered Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-gray-600" />
              Delivered ({deliveredOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {deliveredOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
            {deliveredOrders.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No delivered orders today
              </div>
            )}
          </CardContent>
        </Card>
      </div>
        </div>
      </div>
    </div>
  );
}