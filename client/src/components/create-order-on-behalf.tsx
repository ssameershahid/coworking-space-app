import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, ShoppingCart, User, Search, Coffee, Star, Filter, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MenuGrid } from "@/components/menu-grid";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLocation } from "@/contexts/LocationContext";
import calmkaajLogo from "@assets/calmkaaj-logo.png";

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
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [showCart, setShowCart] = useState(false);
  const { toast } = useToast();
  const { selectedLocation } = useLocation();
  const queryClient = useQueryClient();

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/cafe/users', selectedLocation],
    queryFn: async () => {
      const url = `/api/cafe/users?site=${selectedLocation}`;
      const response = await fetch(url);
      return response.json();
    },
  });

  // Fetch menu items
  const { data: menuItems = [], isLoading: menuLoading } = useQuery<MenuItem[]>({
    queryKey: ['/api/menu/items', selectedLocation],
    queryFn: async () => {
      const url = `/api/menu/items?site=${selectedLocation}`;
      const response = await fetch(url);
      return response.json();
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/menu/categories"],
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

  // Filter and sort menu items
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const isAvailable = item.is_available;
    return matchesCategory && matchesSearch && isAvailable;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "price":
        return parseFloat(a.price) - parseFloat(b.price);
      case "category":
        return a.category.localeCompare(b.category);
      default:
        return 0;
    }
  });

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

  // Convert cart to format expected by MenuGrid
  const menuGridCart = cart.map(item => ({
    id: item.menu_item_id,
    name: item.menu_item.name,
    price: item.menu_item.price,
    quantity: item.quantity,
    image_url: item.menu_item.image_url
  }));

  const handleAddToCart = (menuItem: MenuItem) => {
    addToCart(menuItem);
  };

  const handleUpdateQuantity = (id: number, quantity: number) => {
    updateQuantity(id, quantity);
  };

  const handleRemoveFromCart = (id: number) => {
    removeFromCart(id);
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + parseFloat(item.menu_item.price) * item.quantity, 0);
  };

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const totalAmount = calculateTotal();

  const clearCart = () => {
    setCart([]);
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
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Menu Items</CardTitle>
              <CardDescription>Select items for the order</CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showFilters && (
            <div className="grid gap-4 md:grid-cols-3 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sort">Sort by</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <MenuGrid
            items={sortedItems}
            cart={menuGridCart}
            onAddToCart={handleAddToCart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveFromCart={handleRemoveFromCart}
          />
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

      {/* Floating Cart Button with CalmKaaj Logo */}
      {totalItems > 0 && (
        <Dialog open={showCart} onOpenChange={setShowCart}>
          <DialogTrigger asChild>
            <div className="fixed bottom-20 right-4 z-40">
              <div className="relative">
                <div className="bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200">
                  <img 
                    src={calmkaajLogo} 
                    alt="CalmKaaj Cart"
                    className="w-12 h-12 rounded-full cursor-pointer hover:scale-110 transition-transform duration-200"
                  />
                </div>
                <div className="absolute -top-2 -right-2 bg-green-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
                  {totalItems}
                </div>
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap shadow-md">
                  Rs. {totalAmount.toFixed(2)}
                </div>
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center justify-between">
                <span>Your Order</span>
                <Button variant="ghost" size="sm" onClick={clearCart}>
                  <Trash2 className="h-4 w-4" />
                  <span className="ml-1">Clear</span>
                </Button>
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {/* Order Items */}
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.menu_item_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.menu_item.name}</h4>
                      <p className="text-sm text-gray-600">Rs. {item.menu_item.price}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => updateQuantity(item.menu_item_id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-semibold min-w-[2rem] text-center">{item.quantity}</span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => updateQuantity(item.menu_item_id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">Rs. {(parseFloat(item.menu_item.price) * item.quantity).toFixed(2)}</div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          onClick={() => removeFromCart(item.menu_item_id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Select User */}
              <div>
                <Label className="text-sm font-medium block mb-2">Select User</Label>
                <Select value={selectedUserId} onValueChange={handleUserSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.first_name} {user.last_name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Delivery Location */}
              <div>
                <Label htmlFor="delivery-location" className="text-sm font-medium block mb-2">Delivery Location (Optional)</Label>
                <Input
                  id="delivery-location"
                  placeholder="e.g., Desk 15, Conference Room A"
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                />
              </div>

              {/* Special Instructions */}
              <div>
                <Label htmlFor="notes" className="text-sm font-medium block mb-2">Special Instructions (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special requests or dietary requirements..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            
            {/* Fixed Footer with Place Order Button */}
            <div className="flex-shrink-0 px-4 py-4 border-t bg-white">
              <Button 
                className="w-full h-12 text-lg"
                onClick={handleSubmit}
                disabled={createOrderMutation.isPending || !selectedUserId}
              >
                {createOrderMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating Order...
                  </div>
                ) : (
                  `Place Order • Rs. ${totalAmount.toFixed(2)}`
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}