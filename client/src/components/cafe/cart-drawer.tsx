import { useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Minus, Plus, X } from "lucide-react";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [billingType, setBillingType] = useState<"personal" | "organization">("personal");
  const [notes, setNotes] = useState("");

  const totalAmount = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

  const placeOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      console.log("🚨 FRONTEND: About to make API call to /api/cafe/orders");
      console.log("📦 FRONTEND: Order data:", orderData);
      console.log("⏰ FRONTEND: Timestamp:", new Date().toISOString());
      
      const response = await apiRequest("POST", "/api/cafe/orders", orderData);
      console.log("✅ FRONTEND: API call completed, response:", response.status);
      return response.json();
    },
    onSuccess: (data) => {
      console.log("🎉 FRONTEND: Order mutation SUCCESS:", data);
      toast({
        title: "Order Placed",
        description: "Your order has been placed successfully",
      });
      clearCart();
      onClose();
      queryClient.invalidateQueries({ queryKey: ["/api/cafe/orders"] });
    },
    onError: (error: any) => {
      console.error("❌ FRONTEND: Order mutation ERROR:", error);
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place order",
        variant: "destructive",
      });
    },
  });

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;

    const orderData = {
      items: cart.map(item => ({
        menu_item_id: item.id,
        quantity: item.quantity,
      })),
      billed_to: billingType,
      notes,
    };

    placeOrderMutation.mutate(orderData);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your Cart</SheetTitle>
        </SheetHeader>
        
        {cart.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Your cart is empty</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-auto py-4 space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-gray-500">Rs. {item.price}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4 space-y-4">
              {user?.can_charge_cafe_to_org && (
                <div>
                  <Label className="text-sm font-medium">Bill to:</Label>
                  <RadioGroup value={billingType} onValueChange={setBillingType as any}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="personal" id="personal" />
                      <Label htmlFor="personal">Personal</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="organization" id="organization" />
                      <Label htmlFor="organization">My Company</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
              
              <div>
                <Label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special instructions..."
                  className="mt-1"
                />
              </div>
              
              <div className="flex items-center justify-between font-semibold">
                <span>Total</span>
                <span>Rs. {totalAmount.toFixed(2)}</span>
              </div>
              
              <Button
                onClick={handlePlaceOrder}
                disabled={placeOrderMutation.isPending}
                className="w-full"
              >
                {placeOrderMutation.isPending ? "Placing Order..." : "Place Order"}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
