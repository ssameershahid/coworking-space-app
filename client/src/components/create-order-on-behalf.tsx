import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, ShoppingCart, User, Search, Coffee, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useCart } from "@/hooks/use-cart";

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  organization_id?: string;
  site: string;
}

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: string;
  category: string;
  image_url?: string;
  is_available: boolean;
  is_daily_special: boolean;
  site: string;
}

interface CartItem {
  menu_item_id: number;
  quantity: number;
  menu_item: MenuItem;
}

export default function CreateOrderOnBehalf() {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [billedTo, setBilledTo] = useState<"personal" | "organization">("personal");
  const [notes, setNotes] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { cart, addToCart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/cafe/users'],
  });

  // Fetch menu items
  const { data: menuItems = [], isLoading: menuLoading } = useQuery<MenuItem[]>({
    queryKey: ['/api/menu/items'],
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      return apiRequest('POST', '/api/cafe/orders/create-on-behalf', orderData);
    },
    onSuccess: () => {
      toast({
        title: "Order Created Successfully",
        description: "The order has been placed for the selected user",
      });
      clearCart();
      setSelectedUserId("");
      setSelectedUser(null);
      setBilledTo("personal");
      setNotes("");
      setDeliveryLocation("");
      setSearchTerm("");
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/cafe/orders/all'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create order",
        variant: "destructive",
      });
    },
  });

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    const user = users.find(u => u.id === parseInt(userId));
    setSelectedUser(user || null);
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + parseFloat(item.price) * item.quantity, 0);
  };

  const handleSubmit = () => {
    if (!selectedUser || cart.length === 0) {
      toast({
        title: "Error",
        description: "Please select a user and add items to the cart",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      user_id: selectedUser.id,
      items: cart.map(item => ({
        menu_item_id: item.id,
        quantity: item.quantity,
      })),
      billed_to: billedTo,
      notes,
      delivery_location: deliveryLocation,
    };

    createOrderMutation.mutate(orderData);
  };

  const filteredUsers = users.filter(user =>
    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (usersLoading || menuLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2 mb-6">
        <ShoppingCart className="h-5 w-5 text-green-700" />
        <h1 className="text-2xl font-bold text-gray-900">Create Order on Behalf</h1>
      </div>

      {/* User Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select User</CardTitle>
          <CardDescription>Choose the user to place the order for</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user-search">Search Users</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="user-search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="user-select">Select User</Label>
              <Select value={selectedUserId} onValueChange={handleUserSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {filteredUsers.map(user => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{user.first_name} {user.last_name}</span>
                        <span className="text-gray-500">({user.email})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedUser && (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Selected:</strong> {selectedUser.first_name} {selectedUser.last_name}
                </p>
                <p className="text-sm text-green-700">
                  Email: {selectedUser.email} | Role: {selectedUser.role}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Details */}
      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="billed-to">Billing Type</Label>
              <Select value={billedTo} onValueChange={(value: "personal" | "organization") => setBilledTo(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="organization">Organization</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="delivery-location">Delivery Location</Label>
              <Input
                id="delivery-location"
                placeholder="e.g., Desk 12, Meeting Room A"
                value={deliveryLocation}
                onChange={(e) => setDeliveryLocation(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Special instructions or notes for the order..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu Items */}
      <Card>
        <CardHeader>
          <CardTitle>Menu Items</CardTitle>
          <CardDescription>Select items for the order</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
            {menuItems.filter(item => item.is_available).map(item => (
              <Card key={item.id} className="group hover:shadow-lg transition-shadow duration-200">
                <div className="aspect-[4/3] sm:aspect-[4/3] overflow-hidden rounded-t-lg bg-gray-100">
                  {item.image_url ? (
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Coffee className="h-8 w-8 sm:h-12 sm:w-12" />
                    </div>
                  )}
                </div>
                
                <CardContent className="p-3 sm:p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">{item.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2">{item.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-lg font-bold text-green-600">Rs. {item.price}</span>
                    
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      {cart.find(cartItem => cartItem.id === item.id) ? (
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                            onClick={() => {
                              const cartItem = cart.find(cartItem => cartItem.id === item.id);
                              if (cartItem && cartItem.quantity > 1) {
                                updateQuantity(item.id, cartItem.quantity - 1);
                              } else {
                                removeFromCart(item.id);
                              }
                            }}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="font-medium text-sm min-w-[1.5rem] text-center">
                            {cart.find(cartItem => cartItem.id === item.id)?.quantity || 0}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                            onClick={() => {
                              const cartItem = cart.find(cartItem => cartItem.id === item.id);
                              if (cartItem) {
                                updateQuantity(item.id, cartItem.quantity + 1);
                              }
                            }}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-green-700 hover:bg-green-800 text-white h-7 px-3 sm:h-8 sm:px-4 text-xs sm:text-sm"
                          onClick={() => addToCart({
                            id: item.id,
                            name: item.name,
                            price: item.price,
                            quantity: 1,
                            image_url: item.image_url,
                          })}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {item.is_daily_special && (
                    <Badge variant="destructive" className="mt-2 text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      Today's Special
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cart Summary */}
      {cart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">Rs. {item.price} x {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Rs. {(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFromCart(item.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total: Rs. {calculateTotal().toFixed(2)}</span>
                </div>
                <Button 
                  onClick={handleSubmit} 
                  className="w-full bg-green-700 hover:bg-green-800 text-white"
                  disabled={createOrderMutation.isPending}
                >
                  {createOrderMutation.isPending ? "Creating Order..." : "Create Order"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}