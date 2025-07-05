import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { USER_ROLES, ORDER_STATUSES } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/layout/navigation";
import { ChefHat, Clock, Truck, CheckCircle, DollarSign, TrendingUp } from "lucide-react";
import { CafeOrder } from "@/lib/types";

const STATUS_COLUMNS = [
  { status: ORDER_STATUSES.PENDING, title: "New Orders", icon: Clock, color: "bg-yellow-100 text-yellow-800" },
  { status: ORDER_STATUSES.PREPARING, title: "Preparing", icon: ChefHat, color: "bg-blue-100 text-blue-800" },
  { status: ORDER_STATUSES.READY, title: "Ready", icon: Truck, color: "bg-green-100 text-green-800" },
  { status: ORDER_STATUSES.DELIVERED, title: "Delivered", icon: CheckCircle, color: "bg-gray-100 text-gray-800" },
];

export default function CafeManagerDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: orders = [], isLoading } = useQuery<CafeOrder[]>({
    queryKey: ['/api/cafe/orders'],
    enabled: !!user,
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      return apiRequest('PATCH', `/api/cafe/orders/${orderId}/status`, {
        status,
        handled_by: user?.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cafe/orders'] });
    },
  });

  const moveOrder = (orderId: number, newStatus: string) => {
    updateOrderMutation.mutate({ orderId, status: newStatus });
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const statusOrder = [ORDER_STATUSES.PENDING, ORDER_STATUSES.PREPARING, ORDER_STATUSES.READY, ORDER_STATUSES.DELIVERED];
    const currentIndex = statusOrder.indexOf(currentStatus);
    return currentIndex < statusOrder.length - 1 ? statusOrder[currentIndex + 1] : null;
  };

  const getTodayStats = () => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter((order: CafeOrder) => 
      new Date(order.created_at).toDateString() === today
    );
    
    const totalRevenue = todayOrders.reduce((sum: number, order: CafeOrder) => 
      sum + parseFloat(order.total_amount), 0
    );
    
    return {
      totalOrders: todayOrders.length,
      totalRevenue,
      pending: todayOrders.filter((order: CafeOrder) => order.status === ORDER_STATUSES.PENDING).length,
      completed: todayOrders.filter((order: CafeOrder) => order.status === ORDER_STATUSES.DELIVERED).length,
    };
  };

  const stats = getTodayStats();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Café Management Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.first_name}! Manage incoming orders and track daily performance.</p>
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pending} pending • {stats.completed} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                From {stats.totalOrders} orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalOrders > 0 ? Math.round((stats.completed / stats.totalOrders) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.completed} of {stats.totalOrders} orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Order</CardTitle>
              <ChefHat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">
                Per order today
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {STATUS_COLUMNS.map((column) => {
            const columnOrders = orders.filter((order: CafeOrder) => order.status === column.status);
            const Icon = column.icon;
            
            return (
              <Card key={column.status} className="h-fit">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {column.title}
                    <Badge variant="secondary">{columnOrders.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {columnOrders.map((order: CafeOrder) => (
                    <div key={order.id} className="border rounded-lg p-4 bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Order #{order.id}</span>
                        <Badge className={column.color}>
                          {column.status}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        {order.user?.first_name} {order.user?.last_name}
                      </div>
                      
                      {order.items && (
                        <div className="text-sm text-gray-500 mb-3">
                          {order.items.map((item, index) => (
                            <div key={item.id} className="flex justify-between">
                              <span>{item.quantity}x {item.menu_item.name}</span>
                              <span>${item.price}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <Separator className="my-3" />
                      
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">${order.total_amount}</span>
                        {getNextStatus(order.status) && (
                          <Button
                            size="sm"
                            onClick={() => {
                              const nextStatus = getNextStatus(order.status);
                              if (nextStatus) moveOrder(order.id, nextStatus);
                            }}
                            disabled={updateOrderMutation.isPending}
                          >
                            Move to {STATUS_COLUMNS.find(col => col.status === getNextStatus(order.status))?.title}
                          </Button>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-400 mt-2">
                        {new Date(order.created_at).toLocaleString()}
                      </div>
                      
                      {order.notes && (
                        <div className="text-xs text-yellow-600 mt-2 p-2 bg-yellow-50 rounded">
                          Note: {order.notes}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {columnOrders.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      No orders in {column.title.toLowerCase()}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}