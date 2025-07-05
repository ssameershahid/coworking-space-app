import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import MenuItem from "@/components/cafe/menu-item";
import CartDrawer from "@/components/cafe/cart-drawer";
import { Button } from "@/components/ui/button";

export default function CafePage() {
  const { user } = useAuth();
  const { cart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showCart, setShowCart] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/menu/categories"],
    enabled: !!user,
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ["/api/menu/items", user?.site],
    enabled: !!user,
  });

  const filteredItems = selectedCategory === "all" 
    ? menuItems 
    : menuItems.filter((item: any) => item.category_id === selectedCategory);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Café Menu</h2>
        <p className="text-gray-600">Order your favorite food and drinks</p>
      </div>

      {/* Category Tabs */}
      <div className="flex space-x-6 mb-8 overflow-x-auto">
        <Button
          variant={selectedCategory === "all" ? "default" : "ghost"}
          onClick={() => setSelectedCategory("all")}
          className="whitespace-nowrap"
        >
          All Items
        </Button>
        {categories.map((category: any) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "ghost"}
            onClick={() => setSelectedCategory(category.id)}
            className="whitespace-nowrap"
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredItems.map((item: any) => (
          <MenuItem key={item.id} item={item} />
        ))}
      </div>

      {/* Cart Summary */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white rounded-xl shadow-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-900">Cart Total</span>
            <span className="font-bold text-primary">Rs. {totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowCart(true)}
              className="flex-1"
            >
              View Cart ({totalItems})
            </Button>
            <Button
              onClick={() => setShowCart(true)}
              className="flex-1"
            >
              Checkout
            </Button>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer open={showCart} onClose={() => setShowCart(false)} />
    </div>
  );
}
