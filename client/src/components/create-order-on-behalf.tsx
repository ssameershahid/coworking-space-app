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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
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
        description: "The order has been placed on behalf of the user.",
      });
      // Reset form
      setSelectedUserId("");
      setSelectedUser(null);
      setBilledTo("personal");
      setNotes("");
      setDeliveryLocation("");
      setCart([]);
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

  const addToCart = (menuItem: MenuItem) => {
    const existingItem = cart.find(item => item.menu_item_id === menuItem.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.menu_item_id === menuItem.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { menu_item_id: menuItem.id, quantity: 1, menu_item: menuItem }]);
    }
  };

  const removeFromCart = (menuItemId: number) => {
    setCart(cart.filter(item => item.menu_item_id !== menuItemId));
  };

  const updateQuantity = (menuItemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(menuItemId);
    } else {
      setCart(cart.map(item =>
        item.menu_item_id === menuItemId
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + parseFloat(item.menu_item.price) * item.quantity, 0);
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
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
      })),
      billed_to: billedTo,
      notes,
      delivery_location: deliveryLocation,
    };

    createOrderMutation.mutate(orderData);
  };

  if (usersLoading || menuLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  console.log('Menu items:', menuItems.filter(item => item.is_available));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Create Order on Behalf
          </CardTitle>
          <CardDescription>
            Create an order for a member who is physically at the café
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Selection */}
          <div className="space-y-2">
            <Label>Select User</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchTerm && (
              <div className="border rounded-md bg-white shadow-md max-h-48 overflow-y-auto">
                {users
                  .filter(user => 
                    `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(user => (
                    <div 
                      key={user.id} 
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      onClick={() => {
                        setSelectedUser(user);
                        setSelectedUserId(user.id.toString());
                        setSearchTerm(`${user.first_name} ${user.last_name}`);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{user.first_name} {user.last_name}</span>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          {user.role.replace('member_', '').replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                {users.filter(user => 
                  `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  user.email.toLowerCase().includes(searchTerm.toLowerCase())
                ).length === 0 && (
                  <div className="p-3 text-gray-500 text-center">No users found</div>
                )}
              </div>
            )}
          </div>

          {selectedUser && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4" />
                <span className="font-medium">Selected User</span>
              </div>
              <p className="text-sm text-gray-600">
                {selectedUser.first_name} {selectedUser.last_name} ({selectedUser.email})
              </p>
              {selectedUser.organization_id && (
                <p className="text-sm text-gray-600">Organization Member</p>
              )}
            </div>
          )}

          {/* Billing Options */}
          {selectedUser && (
            <div className="space-y-2">
              <Label>Billing Type</Label>
              <Select value={billedTo} onValueChange={(value: "personal" | "organization") => setBilledTo(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal</SelectItem>
                  {selectedUser.organization_id && (
                    <SelectItem value="organization">Organization</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Delivery Location */}
          <div className="space-y-2">
            <Label>Delivery Location (Optional)</Label>
            <Input
              placeholder="e.g., Table 5, Meeting Room A"
              value={deliveryLocation}
              onChange={(e) => setDeliveryLocation(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Special instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
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
                          onClick={() => addToCart(item)}
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

      {/* Cart */}
      {cart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cart</CardTitle>
            <CardDescription>Items in the current order</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.menu_item_id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">{item.menu_item.name}</h4>
                    <p className="text-sm text-gray-600">Rs. {item.menu_item.price} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="font-semibold">{item.quantity}</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => removeFromCart(item.menu_item_id)}
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