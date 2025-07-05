import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, CheckCircle, Truck, Package, User, DollarSign, Calendar, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface CafeOrder {
  id: number;
  user_id: number;
  total_amount: string;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  billed_to: 'personal' | 'organization';
  org_id?: string;
  notes?: string;
  site: string;
  created_at: string;
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
  pending: { label: "Received", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  preparing: { label: "Started", color: "bg-blue-100 text-blue-800", icon: Package },
  ready: { label: "Ready", color: "bg-green-100 text-green-800", icon: CheckCircle },
  delivered: { label: "Delivered", color: "bg-gray-100 text-gray-800", icon: Truck },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: Clock }
};

export default function CafeManagerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<CafeOrder | null>(null);

  // Fetch all orders for the cafe manager
  const { data: orders = [], isLoading } = useQuery<CafeOrder[]>({
    queryKey: ['/api/cafe/orders/all'],
    enabled: !!user && user.role === 'cafe_manager'
  });

  // Update order status mutation
  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number, status: string }) => {
      return apiRequest(`/api/cafe/orders/${orderId}/status`, "PATCH", {
        status,
        handled_by: user?.id
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

  // Calculate stats
  const todaysOrders = orders.filter(order => 
    new Date(order.created_at).toDateString() === new Date().toDateString()
  );
  
  const pendingOrders = orders.filter(order => order.status === 'pending');
  const preparingOrders = orders.filter(order => order.status === 'preparing');
  const readyOrders = orders.filter(order => order.status === 'ready');
  const completedToday = orders.filter(order => 
    order.status === 'delivered' && 
    new Date(order.created_at).toDateString() === new Date().toDateString()
  );

  const todaysRevenue = todaysOrders
    .filter(order => order.status === 'delivered')
    .reduce((sum, order) => sum + parseFloat(order.total_amount), 0);

  const OrderCard = ({ order }: { order: CafeOrder }) => {
    const config = statusConfig[order.status];
    const Icon = config.icon;
    
    return (
      <Card className="mb-4 cursor-pointer hover:shadow-md transition-shadow" 
            onClick={() => setSelectedOrder(order)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={config.color}>
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Order #{order.id}
              </span>
            </div>
            <div className="text-right">
              <div className="font-semibold">Rs. {order.total_amount}</div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(order.created_at), 'HH:mm')}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {order.user?.first_name} {order.user?.last_name}
            </span>
            {order.billed_to === 'organization' && (
              <Badge variant="outline" className="text-xs">
                {order.organization?.name}
              </Badge>
            )}
          </div>
          
          {order.items && order.items.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {order.items.map((item, index) => (
                <div key={item.id}>
                  {item.quantity}x {item.menu_item.name}
                  {index < order.items!.length - 1 && ", "}
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
        <p className="text-gray-600">Manage orders and monitor café operations</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Orders</p>
                <p className="text-2xl font-bold text-gray-900">{todaysOrders.length}</p>
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
                <p className="text-2xl font-bold text-gray-900">Rs. {todaysRevenue.toFixed(2)}</p>
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
                <p className="text-2xl font-bold text-gray-900">{completedToday.length}</p>
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
              Started ({preparingOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {preparingOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
            {preparingOrders.length === 0 && (
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
              Delivered ({completedToday.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {completedToday.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
            {completedToday.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No delivered orders today
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}