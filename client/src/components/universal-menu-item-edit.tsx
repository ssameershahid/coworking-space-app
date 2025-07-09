import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface MenuCategory {
  id: number;
  name: string;
  description: string;
  display_order: number;
  site: string;
}

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  image_url?: string;
  is_available: boolean;
  is_daily_special: boolean;
  site: string;
}

interface UniversalMenuItemEditProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
  onSave: (item: any) => void;
}

export function UniversalMenuItemEdit({ isOpen, onClose, item, onSave }: UniversalMenuItemEditProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    image_url: "",
    is_available: true,
    is_daily_special: false,
    site: "blue_area"
  });

  const { data: categories = [] } = useQuery<MenuCategory[]>({
    queryKey: ["/api/menu/categories"],
    enabled: isOpen,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        description: item.description,
        price: item.price.toString(),
        category_id: item.category_id.toString(),
        image_url: item.image_url || "",
        is_available: item.is_available,
        is_daily_special: item.is_daily_special,
        site: item.site
      });
    } else {
      setFormData({
        name: "",
        description: "",
        price: "",
        category_id: "",
        image_url: "",
        is_available: true,
        is_daily_special: false,
        site: "blue_area"
      });
    }
  }, [item, isOpen]);

  const handleSave = () => {
    const saveData = {
      ...formData,
      price: parseFloat(formData.price),
      category_id: parseInt(formData.category_id),
      id: item?.id
    };
    onSave(saveData);
    onClose();
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-xl font-semibold">Edit Menu Item</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="border-2 border-black rounded-lg focus:border-black focus:ring-0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="border-2 border-black rounded-lg focus:border-black focus:ring-0 min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price" className="text-sm font-medium">Price (Rs.)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => handleInputChange("price", e.target.value)}
              className="border-2 border-black rounded-lg focus:border-black focus:ring-0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url" className="text-sm font-medium">Image URL</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) => handleInputChange("image_url", e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="border-2 border-black rounded-lg focus:border-black focus:ring-0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">Category</Label>
            <Select value={formData.category_id} onValueChange={(value) => handleInputChange("category_id", value)}>
              <SelectTrigger className="border-2 border-black rounded-lg focus:border-black focus:ring-0">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="site" className="text-sm font-medium">Site</Label>
            <Select value={formData.site} onValueChange={(value) => handleInputChange("site", value)}>
              <SelectTrigger className="border-2 border-black rounded-lg focus:border-black focus:ring-0">
                <SelectValue placeholder="Select site" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blue_area">Blue Area</SelectItem>
                <SelectItem value="i_10">I-10</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-3">
              <Switch
                id="available"
                checked={formData.is_available}
                onCheckedChange={(checked) => handleInputChange("is_available", checked)}
                className="data-[state=checked]:bg-green-600"
              />
              <Label htmlFor="available" className="text-sm font-medium">Available</Label>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-3">
              <Switch
                id="daily_special"
                checked={formData.is_daily_special}
                onCheckedChange={(checked) => handleInputChange("is_daily_special", checked)}
                className="data-[state=checked]:bg-green-600"
              />
              <Label htmlFor="daily_special" className="text-sm font-medium">Daily Special</Label>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-6">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Update
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}