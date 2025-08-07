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
import calmkaajLogo from "@assets/calmkaaj-logo.png";

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

      {/* Menu Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-8">
        {filteredItems.map((item) => (
          <Card key={item.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
            {item.is_daily_special && (
              <Badge className="absolute top-2 right-2 z-10 bg-yellow-500 text-yellow-900">
                <Star className="h-3 w-3 mr-1" />
                Special
              </Badge>
            )}
            
            <div className="aspect-[4/3] sm:aspect-square bg-gray-100 relative">
              {item.image_url ? (
                <img 
                  src={item.image_url} 
                  alt={item.name}
                  className="w-full h-full object-cover"
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
                      className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
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
            <div className="space-y-4">
              {myOrders.slice(0, 3).map((order) => (
                <div key={order.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                    {order.items && order.items.some(item => 
                      item.menu_item.name.toLowerCase().includes('coffee') || 
                      item.menu_item.name.toLowerCase().includes('tea')
                    ) ? (
                      <Coffee className="h-6 w-6 text-accent" />
                    ) : (
                      <Utensils className="h-6 w-6 text-accent" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-lg">Order #{order.id}</h3>
                      <div className="text-right">
                        <p className="font-semibold text-lg">{formatPriceWithCurrency(order.total_amount)}</p>
                        <Badge 
                          variant={
                            order.status === 'delivered' ? 'default' :
                            order.status === 'ready' ? 'default' :
                            order.status === 'preparing' ? 'secondary' : 'outline'
                          }
                          className={
                            order.status === 'ready' ? 'bg-green-100 text-green-800' :
                            order.status === 'preparing' ? 'bg-blue-100 text-blue-800' : ''
                          }
                        >
                          {order.status === 'ready' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {order.status === 'preparing' && <Clock className="h-3 w-3 mr-1" />}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      {new Date(order.created_at).toLocaleDateString()} • {new Date(order.created_at).toLocaleTimeString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.items ? 
                        order.items.map(item => `${item.menu_item.name}${item.quantity > 1 ? ` x${item.quantity}` : ''}`).join(', ') :
                        'Order details'
                      }
                    </p>
                  </div>
                </div>
              ))}
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
                <Button variant="ghost" size="sm" onClick={() => clearCart()}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear
                </Button>
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

              <Separator />

              {/* Billing Options */}
              {canChargeToOrg && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Billing Options</Label>
                  <RadioGroup value={billingType} onValueChange={(value) => setBillingType(value as "personal" | "organization")}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="personal" id="personal" />
                      <Label htmlFor="personal" className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Charge to Me (Personal)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="organization" id="organization" />
                      <Label htmlFor="organization" className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Charge to My Company
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Office Location */}
              <div className="space-y-2">
                <Label htmlFor="delivery-location" className="text-sm font-medium">Office Location</Label>
                <select 
                  id="delivery-location"
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                >
                  <option value="">Select office location for delivery</option>
                  <option value="Reception">Reception</option>
                  <option value="Conference Room A">Conference Room A</option>
                  <option value="Conference Room B">Conference Room B</option>
                  <option value="Lounge Area">Lounge Area</option>
                  <option value="Kitchen">Kitchen</option>
                  <option value="Workspace Floor 1">Workspace Floor 1</option>
                  <option value="Workspace Floor 2">Workspace Floor 2</option>
                  <option value="Private Office 1">Private Office 1</option>
                  <option value="Private Office 2">Private Office 2</option>
                  <option value="Cafeteria">Cafeteria</option>
                </select>
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
                disabled={cart.length === 0 || placeOrderMutation.isPending}
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
