import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { Coffee } from "lucide-react";
import { formatPriceWithCurrency } from "@/lib/format-price";

interface MenuItemProps {
  item: {
    id: number;
    name: string;
    description: string;
    price: string;
    image_url?: string;
    is_daily_special?: boolean;
  };
}

export default function MenuItem({ item }: MenuItemProps) {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      image_url: item.image_url,
    });
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <Coffee className="h-12 w-12 text-gray-400" />
          </div>
        )}
        {item.is_daily_special && (
          <div className="absolute top-2 right-2 bg-warning text-white px-2 py-1 rounded text-xs font-medium">
            Daily Special
          </div>
        )}
      </div>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
          <span className="text-lg font-bold text-primary">{formatPriceWithCurrency(item.price)}</span>
        </div>
        <p className="text-gray-600 text-sm mb-4">{item.description}</p>
        <Button
          onClick={handleAddToCart}
          className="w-full bg-primary hover:bg-blue-700 text-white"
        >
          Add to Cart
        </Button>
      </CardContent>
    </Card>
  );
}
