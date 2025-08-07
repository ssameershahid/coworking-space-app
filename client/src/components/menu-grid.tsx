import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Coffee, Star } from "lucide-react";
import { formatPriceWithCurrency } from "@/lib/format-price";

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
  id: number;
  name: string;
  price: string;
  quantity: number;
  image_url?: string;
}

interface MenuGridProps {
  items: MenuItem[];
  cart: CartItem[];
  onAddToCart: (item: MenuItem) => void;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemoveFromCart: (id: number) => void;
}

export function MenuGrid({ items, cart, onAddToCart, onUpdateQuantity, onRemoveFromCart }: MenuGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-8">
      {items.map((item) => (
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
              <span className="text-sm sm:text-lg font-bold text-green-600">{formatPriceWithCurrency(item.price)}</span>
              
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
                          onUpdateQuantity(item.id, cartItem.quantity - 1);
                        } else {
                          onRemoveFromCart(item.id);
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
                          onUpdateQuantity(item.id, cartItem.quantity + 1);
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
                    onClick={() => onAddToCart(item)}
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
  );
}