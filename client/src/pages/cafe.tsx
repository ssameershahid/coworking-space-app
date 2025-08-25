import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useSSE } from "@/hooks/use-sse";
import { 
  ShoppingCart, 
  Coffee, 
  Plus, 
  Minus, 
  Star, 
  Clock, 
  Filter,
  Search,
  Download,
  Calendar,
  Building,
  CreditCard,
  Trash2,
  CheckCircle,
  AlertCircle,
  Package,
  Utensils
} from "lucide-react";
import { MenuItem as MenuItemType, CafeOrder } from "@/lib/types";
import { formatPriceWithCurrency } from "@/lib/format-price";
import calmkaajLogo from "@assets/calmkaaj-logo-optimized.png";

export default function CafePage() {
  const { user } = useAuth();
  const { cart, addToCart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [showCart, setShowCart] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [billingType, setBillingType] = useState<"personal" | "organization">("personal");
  const [orderNotes, setOrderNotes] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [currentOrder, setCurrentOrder] = useState<CafeOrder | null>(null);

  // Location-specific delivery options
  const deliveryLocationsBysite = {
    blue_area: [
      "Reception - Blue Area",
      "Conference Room A",
      "Conference Room B", 
      "Executive Lounge",
      "Kitchen - Blue Area",
      "Workspace Floor 1",
      "Workspace Floor 2",
      "Private Office 1",
      "Private Office 2",
      "Cafeteria - Blue Area"
    ],
    i_10: [
      "Reception - I-10",
      "Meeting Room Alpha",
      "Meeting Room Beta",
      "Co-working Space",
      "Kitchen - I-10", 
      "Workspace East Wing",
      "Workspace West Wing",
      "Manager Office",
      "Break Room",
      "Cafeteria - I-10"
    ]
  };

  const availableDeliveryLocations = deliveryLocationsBysite[user?.site as keyof typeof deliveryLocationsBysite] || [];

  const { data: categories = [] } = useQuery<{id: number, name: string}[]>({
    queryKey: ["/api/menu/categories"],
    enabled: !!user,
  });

  const { data: menuItems = [] } = useQuery<MenuItemType[]>({
    queryKey: ["/api/menu/items"],
    enabled: !!user,
  });

  const { data: myOrders = [] } = useQuery<CafeOrder[]>({
    queryKey: ["/api/cafe/orders"],
    enabled: !!user,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache results
  });

  // Real-time order updates for users (use polling instead of SSE for efficiency)
  // Users don't need real-time updates as frequently as cafe managers

  const placeOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      return await apiRequest('POST', '/api/cafe/orders', orderData);
    },
    onSuccess: async (response) => {
      const order = await response.json();
      setCurrentOrder(order);
      clearCart();
      setIsCheckingOut(false);
      toast({
        title: "Order Placed Successfully!",
        description: `Your order #${order.id} has been submitted to the café.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cafe/orders"] });
    },
    onError: (error: any) => {
      console.error("Order placement failed:", error);
      toast({
        title: "Order Failed",
        description: "There was an error placing your order. Please try again.",
        variant: "destructive",
      });
    },
  });

  // User cancel order (allowed only for pending or accepted)
  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      return await apiRequest('PATCH', `/api/cafe/orders/${orderId}/cancel`, {});
    },
    onSuccess: async () => {
      toast({
        title: "Order Deleted",
        description: "Your order has been deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cafe/orders"] });
    },
    onError: (error: any) => {
      console.error("Order cancel failed:", error);
      toast({
        title: "Delete Failed",
        description: "Could not delete the order. It may already be in preparation.",
        variant: "destructive",
      });
    },
  });

  // Filter and sort menu items
  const filteredItems = menuItems
    .filter((item) => {
      if (selectedCategory !== "all" && item.category_id !== parseInt(selectedCategory)) return false;
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return item.is_available;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low": return parseFloat(a.price) - parseFloat(b.price);
        case "price-high": return parseFloat(b.price) - parseFloat(a.price);
        case "popular": return (b.is_daily_special ? 1 : 0) - (a.is_daily_special ? 1 : 0);
        default: return a.name.localeCompare(b.name);
      }
    });

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;

    const orderData = {
      items: cart.map(item => ({
        menu_item_id: item.id,
        quantity: item.quantity,
        price: item.price,
      })),
      total_amount: totalAmount.toFixed(2),
      billed_to: billingType,
      org_id: billingType === "organization" ? user?.organization_id : null,
      notes: orderNotes || null,
      delivery_location: deliveryLocation || null,
      site: user?.site,
    };

    placeOrderMutation.mutate(orderData);
  };

  const canChargeToOrg = user?.can_charge_cafe_to_org && user?.organization_id;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Café Menu</h2>
        <p className="text-gray-600">Order your favorite food and drinks</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
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

        {showFilters && (
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Sort By</Label>
                <RadioGroup value={sortBy} onValueChange={setSortBy}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="name" id="name" />
                    <Label htmlFor="name">Name</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="price-low" id="price-low" />
                    <Label htmlFor="price-low">Price: Low to High</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="price-high" id="price-high" />
                    <Label htmlFor="price-high">Price: High to Low</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="popular" id="popular" />
                    <Label htmlFor="popular">Daily Specials First</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex space-x-2 mb-8 overflow-x-auto pb-2">
        <Button
          variant={selectedCategory === "all" ? "default" : "outline"}
          onClick={() => setSelectedCategory("all")}
          className="whitespace-nowrap"
        >
          All Items
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id.toString() ? "default" : "outline"}
            onClick={() => setSelectedCategory(category.id.toString())}
            className="whitespace-nowrap"
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* Menu Grid - Compact Design */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 mb-8">
        {filteredItems.map((item) => (
          <Card key={item.id} className="relative overflow-hidden hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
            {item.is_daily_special && (
              <Badge className="absolute top-1 right-1 z-10 bg-yellow-500 text-yellow-900 text-xs px-1 py-0">
                <Star className="h-2 w-2 mr-0.5" />
                Special
              </Badge>
            )}
            
            {/* Compact Image */}
            <div className="aspect-square bg-gray-100 relative">
              {item.image_url ? (
                <img 
                  src={item.image_url} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Coffee className="h-6 w-6 md:h-8 md:w-8" />
                </div>
              )}
            </div>
            
            {/* Compact Content */}
            <CardContent className="p-2 md:p-3">
              <h3 className="font-medium text-gray-900 mb-1 text-xs md:text-sm line-clamp-2 leading-tight">
                {item.name}
              </h3>
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm md:text-base font-bold text-green-600">
                  Rs. {parseInt(item.price).toLocaleString()}
                </span>
              </div>
              
              {/* Action Button */}
              <div className="w-full">
                {cart.find(cartItem => cartItem.id === item.id) ? (
                  <div className="flex items-center justify-between bg-gray-50 rounded px-2 py-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-red-100"
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
                    <span className="font-medium text-sm px-2">
                      {cart.find(cartItem => cartItem.id === item.id)?.quantity || 0}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-green-100"
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
                    className="w-full h-7 text-xs font-medium bg-green-600 hover:bg-green-700"
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Current Order Status */}
      {myOrders.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Your Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myOrders.length > 0 ? (
                myOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Coffee className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-medium">Order #{order.id}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()} • {new Date(order.created_at).toLocaleTimeString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {order.items && order.items.length > 0 
                            ? order.items.map(item => 
                                item.quantity > 1 
                                  ? `${item.menu_item?.name} x${item.quantity}`
                                  : item.menu_item?.name
                              ).join(', ')
                            : 'No items'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPriceWithCurrency(parseFloat(order.total_amount) || 0)}</p>
                      <div className="flex items-center gap-2 justify-end">
                        <Badge 
                          variant={order.status === 'delivered' ? 'default' : 'secondary'}
                          className={
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'ready' || order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'cancelled' || order.status === 'deleted' ? 'bg-red-100 text-red-800' : ''
                          }
                        >
                          {order.status}
                        </Badge>
                        {(order.status === 'pending' || order.status === 'accepted') && (
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => cancelOrderMutation.mutate(order.id)}
                            disabled={cancelOrderMutation.isPending}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No recent orders
                </div>
              )}
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
                <div className="bg-white rounded-full p-3 shadow-xl hover:shadow-2xl transition-all duration-300 animate-pulse">
                  <img 
                    src={calmkaajLogo} 
                    alt="CalmKaaj Cart"
                    className="w-14 h-14 rounded-full cursor-pointer hover:scale-125 transition-transform duration-300 animate-bounce"
                  />
                </div>
                <div className="absolute -top-3 -right-3 bg-red-500 text-white text-sm font-bold rounded-full w-7 h-7 flex items-center justify-center border-2 border-white animate-pulse">
                  {totalItems}
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-sm px-3 py-1 rounded-full whitespace-nowrap shadow-lg font-semibold animate-pulse">
                  Rs. {totalAmount.toFixed(2)}
                </div>
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center justify-between">
                <span>Your Order</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
              {/* Cart Items */}
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-600">Rs. {item.price}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (item.quantity > 1) {
                            updateQuantity(item.id, item.quantity - 1);
                          } else {
                            removeFromCart(item.id);
                          }
                        }}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold">Rs. {(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Billing Options */}
              {canChargeToOrg && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Billing Options</Label>
                  <RadioGroup value={billingType} onValueChange={(value) => setBillingType(value as "personal" | "organization")}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="personal" id="personal" />
                      <Label htmlFor="personal" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Charge Me Personally
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="organization" id="organization" />
                      <Label htmlFor="organization" className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Charge My Organization
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Delivery Location */}
              <div className="space-y-2">
                <Label htmlFor="delivery-location" className="text-sm font-medium">
                  Delivery Location <span className="text-red-500">*</span>
                </Label>
                <select 
                  id="delivery-location"
                  className={`w-full h-10 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    !deliveryLocation ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                >
                  <option value="">Select delivery location (Required)</option>
                  {availableDeliveryLocations.map((location) => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
                {!deliveryLocation && (
                  <p className="text-red-500 text-xs">Please select a delivery location to continue</p>
                )}
              </div>

              {/* Order Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">Special Instructions (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special requests or dietary requirements..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal ({totalItems} items)</span>
                  <span>Rs. {totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>Rs. {totalAmount.toFixed(2)}</span>
                </div>
              </div>

            </div>

            {/* Fixed Footer with Place Order Button */}
            <div className="flex-shrink-0 px-4 py-4 border-t bg-white">
              <Button 
                className="w-full h-12 text-lg"
                onClick={handlePlaceOrder}
                disabled={cart.length === 0 || placeOrderMutation.isPending || !deliveryLocation}
              >
                {placeOrderMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Placing Order...
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
