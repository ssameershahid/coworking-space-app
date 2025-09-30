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
import { Receipt, CreditCard, Clock, CheckCircle, AlertCircle, Search, Filter, Calendar, CalendarDays, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, isToday, parseISO } from "date-fns";
import { formatLargeCurrencyAmount } from "@/lib/format-price";

interface CafeOrder {
  id: number;
  user_id: number;
  total_amount: string;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivered' | 'cancelled' | 'deleted';
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
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: AlertCircle },
  deleted: { label: "Deleted", color: "bg-red-200 text-red-900", icon: AlertCircle }
};

const paymentStatusConfig = {
  paid: { label: "Paid", color: "bg-green-100 text-green-800", icon: CheckCircle },
  unpaid: { label: "Unpaid", color: "bg-red-100 text-red-800", icon: AlertCircle }
};

export default function BillingTransactions() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [billingFilter, setBillingFilter] = useState<string>("all");
  
  // Date filtering state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all orders
  const { data: orders = [], isLoading } = useQuery<CafeOrder[]>({
    queryKey: ['/api/cafe/orders/all'],
  });

  // Role-based base list: cafe managers should not see cancelled/deleted in Billing
  const baseOrders: CafeOrder[] = (user?.role === 'cafe_manager')
    ? orders.filter(o => o.status !== 'cancelled' && o.status !== 'deleted')
    : orders;

  // Update payment status mutation
  const updatePaymentMutation = useMutation({
    mutationFn: async ({ orderId }: { orderId: number }) => {
      return apiRequest('PATCH', `/api/cafe/orders/${orderId}/payment`, { payment_status: 'paid' });
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
    if (currentStatus === 'paid') return; // one-way: ignore attempts to unset
    updatePaymentMutation.mutate({ orderId });
  };

  // Date filtering helper functions
  const getDateRange = () => {
    const today = new Date();
    const yesterday = subDays(today, 1);
    
    switch (dateFilter) {
      case 'today':
        return { start: startOfDay(selectedDate), end: endOfDay(selectedDate) };
      case 'yesterday':
        return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
      case 'week':
        return { start: startOfWeek(today), end: endOfWeek(today) };
      case 'custom':
        if (customStartDate && customEndDate) {
          return { 
            start: startOfDay(new Date(customStartDate)), 
            end: endOfDay(new Date(customEndDate)) 
          };
        }
        // Fallback to last 7 days if custom dates not set
        return { start: startOfDay(subDays(today, 7)), end: endOfDay(today) };
      default:
        return { start: startOfDay(today), end: endOfDay(today) };
    }
  };

  const getRevenueRange = () => {
    // Revenue cards show last 7 days by default, or custom range if selected
    const today = new Date();
    if (dateFilter === 'custom' && customStartDate && customEndDate) {
      return { 
        start: startOfDay(new Date(customStartDate)), 
        end: endOfDay(new Date(customEndDate)) 
      };
    }
    return { start: startOfDay(subDays(today, 7)), end: endOfDay(today) };
  };

  const isOrderInDateRange = (order: CafeOrder, range: { start: Date; end: Date }) => {
    const orderDate = new Date(order.created_at);
    return orderDate >= range.start && orderDate <= range.end;
  };



  const setQuickFilter = (filter: 'today' | 'yesterday' | 'week') => {
    setDateFilter(filter);
    if (filter === 'today') {
      setSelectedDate(new Date());
    } else if (filter === 'yesterday') {
      setSelectedDate(subDays(new Date(), 1));
    }
  };

  // CSV Export functionality
  const generateCSV = () => {
    const headers = [
      'Order ID',
      'Date',
      'Time', 
      'Customer Name',
      'Email',
      'Organization',
      'Office Number',
      'Items',
      'Total Amount',
      'Delivery Status',
      'Payment Status',
      'Billed To'
    ];

    const csvData = filteredOrders.map(order => [
      order.id,
      format(new Date(order.created_at), 'yyyy-MM-dd'),
      format(new Date(order.created_at), 'HH:mm:ss'),
      `${order.user?.first_name || ''} ${order.user?.last_name || ''}`.trim(),
      order.user?.email || '',
      order.organization?.name || '',
      order.user?.office_number || '',
      order.items?.map(item => `${item.quantity}x ${item.name}`).join('; ') || '',
      `Rs. ${parseFloat(order.total_amount).toFixed(2)}`,
      order.status || '',
      order.payment_status || '',
      order.billed_to || ''
    ]);

    // Combine headers and data
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  };

  const downloadCSV = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    // Generate filename based on current filters
    let filename = 'cafe-transactions';
    
    if (dateFilter === 'today' && isToday(selectedDate)) {
      filename += `-today-${format(new Date(), 'yyyy-MM-dd')}`;
    } else if (dateFilter === 'yesterday') {
      filename += `-yesterday-${format(subDays(new Date(), 1), 'yyyy-MM-dd')}`;
    } else if (dateFilter === 'week') {
      filename += `-this-week-${format(new Date(), 'yyyy-MM-dd')}`;
    } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
      filename += `-${customStartDate}-to-${customEndDate}`;
    } else {
      filename += `-${format(selectedDate, 'yyyy-MM-dd')}`;
    }
    
    if (searchTerm) {
      filename += `-search-${searchTerm.replace(/\s+/g, '-')}`;
    }
    
    filename += '.csv';
    
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Successful",
      description: `${filteredOrders.length} transactions exported to ${filename}`,
    });
  };

  // Filter orders based on search, filters, and date range
  const dateRange = getDateRange();
  
  // First filter by date for orders display
  const dateFilteredOrders = baseOrders.filter(order => isOrderInDateRange(order, dateRange));
  
  // If no orders for today and it's today filter, expand to recent days
  const ordersToDisplay = dateFilteredOrders.length === 0 && dateFilter === 'today' && isToday(selectedDate)
    ? baseOrders.filter(order => isOrderInDateRange(order, { start: startOfDay(subDays(new Date(), 7)), end: endOfDay(new Date()) }))
    : dateFilteredOrders;

  const filteredOrders = ordersToDisplay.filter(order => {
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

  // Calculate revenue totals (based on 7-day rolling window or custom range)
  const revenueRange = getRevenueRange();
  const revenueOrders = baseOrders.filter(order => isOrderInDateRange(order, revenueRange));
  
  const totalRevenue = revenueOrders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
  const paidRevenue = revenueOrders.filter(order => order.payment_status === 'paid').reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
  const unpaidRevenue = revenueOrders.filter(order => order.payment_status === 'unpaid').reduce((sum, order) => sum + parseFloat(order.total_amount), 0);
  
  // Get display info for current filter
  const getDisplayInfo = () => {
    const todayOrdersCount = baseOrders.filter(order => isOrderInDateRange(order, { start: startOfDay(new Date()), end: endOfDay(new Date()) })).length;
    
    if (dateFilter === 'today' && isToday(selectedDate)) {
      if (todayOrdersCount === 0 && ordersToDisplay.length > 0) {
        return `Showing ${filteredOrders.length} orders from recent days (no orders today)`;
      }
      return `Showing ${filteredOrders.length} orders for today`;
    } else if (dateFilter === 'yesterday') {
      return `Showing ${filteredOrders.length} orders for yesterday`;
    } else if (dateFilter === 'week') {
      return `Showing ${filteredOrders.length} orders for this week`;
    } else if (dateFilter === 'custom') {
      return `Showing ${filteredOrders.length} orders for selected date range`;
    }
    return `Showing ${filteredOrders.length} orders for ${format(selectedDate, 'MMM dd, yyyy')}`;
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading transactions...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cafe Revenue</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatLargeCurrencyAmount(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {revenueOrders.length} orders (last 7 days)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Revenue</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatLargeCurrencyAmount(paidRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {revenueOrders.filter(order => order.payment_status === 'paid').length} paid orders (last 7 days)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid Revenue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatLargeCurrencyAmount(unpaidRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {revenueOrders.filter(order => order.payment_status === 'unpaid').length} unpaid orders (last 7 days)
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
        <CardContent className="space-y-6">
          {/* Date Filter Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Date Filter</Label>
            </div>
            
            {/* Quick Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={dateFilter === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQuickFilter('today')}
              >
                Today
              </Button>
              <Button
                variant={dateFilter === 'yesterday' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQuickFilter('yesterday')}
              >
                Yesterday
              </Button>
              <Button
                variant={dateFilter === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQuickFilter('week')}
              >
                This Week
              </Button>
            </div>

            {/* Custom Date Range */}
            <div className="grid gap-2 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="start-date" className="text-xs text-muted-foreground">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value);
                    if (e.target.value && customEndDate) {
                      setDateFilter('custom');
                    }
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="end-date" className="text-xs text-muted-foreground">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    if (customStartDate && e.target.value) {
                      setDateFilter('custom');
                    }
                  }}
                />
              </div>
            </div>
            
            {/* Display current filter info */}
            <div className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">
              {getDisplayInfo()}
            </div>
            
            {dateFilter === 'custom' && customStartDate && customEndDate && (
              <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                Custom range: {format(new Date(customStartDate), 'MMM dd')} to {format(new Date(customEndDate), 'MMM dd, yyyy')}
              </div>
            )}
          </div>

          <Separator />
          
          {/* Search and Status Filters */}
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
                  <SelectItem value="deleted">Deleted</SelectItem>
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

          <div className="flex gap-2">
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
            
            <Button 
              variant="default" 
              onClick={downloadCSV}
              className="bg-green-600 hover:bg-green-700"
              disabled={filteredOrders.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV ({filteredOrders.length} orders)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            Showing {filteredOrders.length} of {baseOrders.length} orders
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

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={statusConfig[order.status].color}>
                    {statusConfig[order.status].label}
                  </Badge>
                  <Badge variant={order.billed_to === 'organization' ? 'default' : 'secondary'}>
                    {order.billed_to === 'organization' ? 'Charge Organization' : 'Charge Individual'}
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
                      disabled={updatePaymentMutation.isPending || order.payment_status === 'paid' || order.status === 'cancelled' || order.status === 'deleted'}
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