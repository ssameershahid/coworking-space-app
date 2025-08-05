import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";

interface MenuItemEditProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  onSave: (data: any) => void;
}

export function SimpleMenuEdit({ isOpen, onClose, item, onSave }: MenuItemEditProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [site, setSite] = useState("blue_area");
  const [isAvailable, setIsAvailable] = useState(true);
  const [isDailySpecial, setIsDailySpecial] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/menu/categories"],
    enabled: isOpen,
  });

  useEffect(() => {
    if (item) {
      setName(item.name || "");
      setDescription(item.description || "");
      setPrice(item.price?.toString() || "");
      setImageUrl(item.image_url || "");
      setCategoryId(item.category_id?.toString() || "");
      setSite(item.site || "blue_area"); // Don't allow "both" for editing existing items
      setIsAvailable(item.is_available ?? true);
      setIsDailySpecial(item.is_daily_special ?? false);
    } else {
      setName("");
      setDescription("");
      setPrice("");
      setImageUrl("");
      setCategoryId("");
      setSite("blue_area");
      setIsAvailable(true);
      setIsDailySpecial(false);
    }
  }, [item, isOpen]);

  const handleSave = () => {
    const data = {
      name,
      description,
      price: price, // Keep as string for decimal validation
      image_url: imageUrl,
      category_id: parseInt(categoryId),
      site,
      is_available: isAvailable,
      is_daily_special: isDailySpecial,
    };
    
    if (item?.id) {
      data.id = item.id;
    }
    
    onSave(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Menu Item</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="price">Price (Rs.)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="site">Site</Label>
            <Select value={site} onValueChange={setSite}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blue_area">Blue Area</SelectItem>
                <SelectItem value="i_10">I-10</SelectItem>
                {!item && <SelectItem value="both">Both Sites</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="available"
              checked={isAvailable}
              onCheckedChange={setIsAvailable}
            />
            <Label htmlFor="available">Available</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="special"
              checked={isDailySpecial}
              onCheckedChange={setIsDailySpecial}
            />
            <Label htmlFor="special">Daily Special</Label>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}