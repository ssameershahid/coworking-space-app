import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Receipt, CreditCard, Clock, CheckCircle, AlertCircle, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface CafeOrder {
  id: number;
  user_id: number;
  total_amount: string;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  billed_to: 'personal' | 'organization';
  org_id?: string;
  handled_by?: number;
  created_by?: number;
  payment_status: 'paid' | 'unpaid';
  payment_updated_by?: number;
  payment_updated_at?: string;
  notes?: string;
  delivery_location?: string;
  site: string;
  created_at: string;
  updated_at: string;
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
  pending: { label: "Pending", color: "bg-orange-100 text-orange-800", icon: Clock },
  accepted: { label: "Accepted", color: "bg-yellow-100 text-yellow-800", icon: CheckCircle },
  preparing: { label: "Preparing", color: "bg-blue-100 text-blue-800", icon: Clock },
  ready: { label: "Ready", color: "bg-green-100 text-green-800", icon: CheckCircle },
  delivered: { label: "Delivered", color: "bg-gray-100 text-gray-800", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: AlertCircle }
};

const paymentStatusConfig = {
  paid: { label: "Paid", color: "bg-green-100 text-green-800", icon: CheckCircle },
  unpaid: { label: "Unpaid", color: "bg-red-100 text-red-800", icon: AlertCircle }
};

export default function BillingTransactions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [billingFilter, setBillingFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all orders
  const { data: orders = [], isLoading } = useQuery<CafeOrder[]>({
    queryKey: ['/api/cafe/orders/all'],
  });

  // Update payment status mutation
  const updatePaymentMutation = useMutation({
    mutationFn: async ({ orderId, paymentStatus }: { orderId: number; paymentStatus: string }) => {
      return apiRequest('PATCH', `/api/cafe/orders/${orderId}/payment`, { payment_status: paymentStatus });
    },
    onSuccess: () => {
      toast({
        title: "Payment Status Updated",
        description: "The payment status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cafe/orders/all'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment status",
        variant: "destructive",
      });
    },
  });

  const handlePaymentToggle = (orderId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
    updatePaymentMutation.mutate({ orderId, paymentStatus: newStatus });
  };

  // Filter orders based on search and filter criteria
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === "" || 
      order.user?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.organization?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toString().includes(searchTerm);

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesPayment = paymentFilter === "all" || order.payment_status === paymentFilter;
    const matchesBilling = billingFilter === "all" || order.billed_to === billingFilter;

    return matchesSearch && matchesStatus && matchesPayment && matchesBilling;
  });

  // Calculate totals
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
  const paidRevenue = filteredOrders.filter(order => order.payment_status === 'paid').reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
  const unpaidRevenue = filteredOrders.filter(order => order.payment_status === 'unpaid').reduce((sum, order) => sum + parseFloat(order.total_amount), 0);

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading transactions...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredOrders.length} orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Revenue</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Rs. {paidRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredOrders.filter(order => order.payment_status === 'paid').length} paid orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid Revenue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">Rs. {unpaidRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredOrders.filter(order => order.payment_status === 'unpaid').length} unpaid orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Name, email, order ID..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Order Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Payment Status</Label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Billing Type</Label>
              <Select value={billingFilter} onValueChange={setBillingFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Billing</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="organization">Organization</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            variant="outline" 
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setPaymentFilter("all");
              setBillingFilter("all");
            }}
          >
            Clear Filters
          </Button>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            Showing {filteredOrders.length} of {orders.length} orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <div key={order.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-semibold">
                        Order #{order.id}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {order.user?.first_name} {order.user?.last_name} ({order.user?.email})
                      </p>
                      {order.organization && (
                        <p className="text-sm text-blue-600">
                          {order.organization.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">Rs. {order.total_amount}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className={statusConfig[order.status].color}>
                    {statusConfig[order.status].label}
                  </Badge>
                  <Badge variant={order.billed_to === 'organization' ? 'default' : 'secondary'}>
                    {order.billed_to === 'organization' ? 'Organization' : 'Personal'}
                  </Badge>
                  {order.created_by && (
                    <Badge variant="outline">
                      Created by Staff
                    </Badge>
                  )}
                </div>

                {order.items && order.items.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Items:</p>
                    {order.items.map(item => (
                      <p key={item.id} className="text-sm text-gray-600">
                        {item.quantity}x {item.menu_item.name} - Rs. {item.price}
                      </p>
                    ))}
                  </div>
                )}

                {order.notes && (
                  <div>
                    <p className="text-sm font-medium">Notes:</p>
                    <p className="text-sm text-gray-600">{order.notes}</p>
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span className="text-sm font-medium">Payment Status:</span>
                    <Badge className={paymentStatusConfig[order.payment_status].color}>
                      {paymentStatusConfig[order.payment_status].label}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`payment-${order.id}`} className="text-sm">
                      Mark as Paid
                    </Label>
                    <Switch
                      id={`payment-${order.id}`}
                      checked={order.payment_status === 'paid'}
                      onCheckedChange={() => handlePaymentToggle(order.id, order.payment_status)}
                      disabled={updatePaymentMutation.isPending}
                    />
                  </div>
                </div>

                {order.payment_updated_at && (
                  <p className="text-xs text-gray-500">
                    Payment status last updated: {format(new Date(order.payment_updated_at), 'MMM dd, yyyy HH:mm')}
                  </p>
                )}
              </div>
            ))}

            {filteredOrders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No orders found matching your criteria.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}