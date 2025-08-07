import { useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CheckoutModal({ open, onClose }: CheckoutModalProps) {
  const { cart, clearCart } = useCart();
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
    console.log("🚨🚨🚨 CHECKOUT MODAL: handlePlaceOrder called!");
    console.log("📦 Cart contents:", cart);
    console.log("💳 Billing type:", billingType);
    console.log("📝 Notes:", notes);
    
    if (cart.length === 0) {
      console.log("❌ CHECKOUT MODAL: Cart is empty, returning early");
      return;
    }

    const orderData = {
      items: cart.map(item => ({
        menu_item_id: item.id,
        quantity: item.quantity,
      })),
      billed_to: billingType,
      notes,
    };
    
    console.log("📋 Order data prepared:", orderData);
    console.log("🔄 About to call placeOrderMutation.mutate()");

    placeOrderMutation.mutate(orderData);
    console.log("✅ placeOrderMutation.mutate() called");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Checkout</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Order Summary */}
          <div>
            <h3 className="font-medium mb-3">Order Summary</h3>
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.name} x{item.quantity}</span>
                  <span>Rs. {(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 font-semibold">
                <div className="flex justify-between">
                  <span>Total</span>
                  <span>Rs. {totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Billing Toggle */}
          {user?.can_charge_cafe_to_org && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Bill to:</Label>
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
          
          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-sm font-medium mb-2 block">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special instructions..."
            />
          </div>
          
          <Button
            onClick={handlePlaceOrder}
            disabled={placeOrderMutation.isPending}
            className="w-full"
          >
            {placeOrderMutation.isPending ? "Placing Order..." : "Place Order"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
