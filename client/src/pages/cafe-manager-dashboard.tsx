import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, CheckCircle, Truck, Package, User, DollarSign, Calendar, TrendingUp, ShoppingCart, Receipt, Plus, Edit2, Trash2, Menu } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "@/contexts/LocationContext";
import { format } from "date-fns";
import { MenuManagement } from "@/components/menu-management";


interface CafeOrder {
  id: number;
  user_id: number;
  total_amount: string;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
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
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: Clock }
};

export default function CafeManagerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { selectedLocation } = useLocation();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<CafeOrder | null>(null);
  
  // Menu management state
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<any>(null);
  const [menuFormData, setMenuFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "beverages",
    is_available: true,
    is_daily_special: false,
    site: selectedLocation,
  });

  // Fetch all orders for the cafe manager
  const { data: orders = [], isLoading } = useQuery<CafeOrder[]>({
    queryKey: ['/api/cafe/orders/all', selectedLocation],
    queryFn: async () => {
      const url = `/api/cafe/orders/all?site=${selectedLocation}`;
      const response = await fetch(url);
      return response.json();
    },
    enabled: !!user && user.role === 'cafe_manager'
  });

  // Fetch menu items for menu management
  const { data: menuItems = [] } = useQuery({
    queryKey: ['/api/admin/menu/items', selectedLocation],
    queryFn: async () => {
      const url = `/api/admin/menu/items?site=${selectedLocation}`;
      const response = await fetch(url);
      return response.json();
    },
    enabled: !!user && user.role === 'cafe_manager'
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

  // Menu management mutations
  const createMenuItem = useMutation({
    mutationFn: async (menuItemData: any) => {
      return apiRequest('POST', '/api/menu/items', menuItemData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/menu/items'] });
      setIsMenuDialogOpen(false);
      resetMenuForm();
      toast({ title: "Menu item created successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create menu item", 
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    }
  });

  const updateMenuItem = useMutation({
    mutationFn: async ({ itemId, updates }: { itemId: number; updates: any }) => {
      return apiRequest('PATCH', `/api/menu/items/${itemId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/menu/items'] });
      setIsMenuDialogOpen(false);
      resetMenuForm();
      toast({ title: "Menu item updated successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update menu item", 
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    }
  });

  const deleteMenuItem = useMutation({
    mutationFn: async (itemId: number) => {
      return apiRequest('DELETE', `/api/menu/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/menu/items'] });
      toast({ title: "Menu item deleted successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete menu item", 
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    }
  });

  const resetMenuForm = () => {
    setMenuFormData({
      name: "",
      description: "",
      price: "",
      category: "beverages",
      is_available: true,
      is_daily_special: false,
      site: "blue_area",
    });
    setEditingMenuItem(null);
  };

  const handleMenuSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...menuFormData,
      price: parseFloat(menuFormData.price),
    };

    if (editingMenuItem) {
      updateMenuItem.mutate({ itemId: editingMenuItem.id, updates: submitData });
    } else {
      createMenuItem.mutate(submitData);
    }
  };

  const handleEditMenuItem = (item: any) => {
    setEditingMenuItem(item);
    setMenuFormData({
      name: item.name,
      description: item.description || "",
      price: item.price.toString(),
      category: item.category || "beverages",
      is_available: item.is_available,
      is_daily_special: item.is_daily_special,
      site: item.site,
    });
    setIsMenuDialogOpen(true);
  };

  const handleDeleteMenuItem = (itemId: number) => {
    if (confirm("Are you sure you want to delete this menu item?")) {
      deleteMenuItem.mutate(itemId);
    }
  };

  // Filter all orders to show only today's orders
  const todaysOrders = orders.filter(order => 
    new Date(order.created_at).toDateString() === new Date().toDateString()
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
          
          {order.delivery_location && (
            <div className="mt-2 text-sm text-muted-foreground flex items-center gap-1">
              <Package className="h-3 w-3" />
              Deliver to: {order.delivery_location}
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

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="menu">Menu Management</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
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
        </TabsContent>

        <TabsContent value="menu" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Menu className="h-5 w-5" />
                Menu Management
              </h2>
              <p className="text-gray-600 mt-1">Manage café menu items and pricing</p>
            </div>
            <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingMenuItem(null); resetMenuForm(); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Menu Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingMenuItem ? "Edit Menu Item" : "Add Menu Item"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleMenuSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={menuFormData.name}
                      onChange={(e) => setMenuFormData({ ...menuFormData, name: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={menuFormData.description}
                      onChange={(e) => setMenuFormData({ ...menuFormData, description: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="price">Price (Rs.)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={menuFormData.price}
                      onChange={(e) => setMenuFormData({ ...menuFormData, price: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={menuFormData.category} onValueChange={(value) => setMenuFormData({ ...menuFormData, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beverages">Beverages</SelectItem>
                        <SelectItem value="snacks">Snacks</SelectItem>
                        <SelectItem value="meals">Meals</SelectItem>
                        <SelectItem value="desserts">Desserts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="site">Site</Label>
                    <Select value={menuFormData.site} onValueChange={(value) => setMenuFormData({ ...menuFormData, site: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blue_area">Blue Area</SelectItem>
                        <SelectItem value="i_10">I-10</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_available"
                      checked={menuFormData.is_available}
                      onCheckedChange={(checked) => setMenuFormData({ ...menuFormData, is_available: checked })}
                    />
                    <Label htmlFor="is_available">Available</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_daily_special"
                      checked={menuFormData.is_daily_special}
                      onCheckedChange={(checked) => setMenuFormData({ ...menuFormData, is_daily_special: checked })}
                    />
                    <Label htmlFor="is_daily_special">Daily Special</Label>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsMenuDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMenuItem.isPending || updateMenuItem.isPending}>
                      {editingMenuItem ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-6">
              {menuItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No menu items found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Site</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {menuItems.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{item.name}</p>
                              <p className="text-sm text-gray-500">{item.description}</p>
                            </div>
                          </TableCell>
                          <TableCell>Rs. {item.price}</TableCell>
                          <TableCell className="capitalize">{item.category || "Uncategorized"}</TableCell>
                          <TableCell>
                            {item.site === 'blue_area' ? 'Blue Area' : 'I-10'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Badge variant={item.is_available ? "default" : "secondary"}>
                                {item.is_available ? "Available" : "Unavailable"}
                              </Badge>
                              {item.is_daily_special && (
                                <Badge variant="destructive">Special</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditMenuItem(item)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteMenuItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}