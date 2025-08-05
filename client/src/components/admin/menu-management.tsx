import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MenuItem } from "@/lib/types";

export default function MenuManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    image_url: "",
    is_available: true,
    is_daily_special: false,
    site: "blue_area",
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ["/api/menu/items"],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/menu/categories"],
  });

  const createItemMutation = useMutation({
    mutationFn: async (itemData: any) => {
      const response = await apiRequest("POST", "/api/menu/items", itemData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Menu item created successfully",
      });
      setIsDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/menu/items"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create menu item",
        variant: "destructive",
      });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const response = await apiRequest("PATCH", `/api/menu/items/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Menu item updated successfully",
      });
      setIsDialogOpen(false);
      setEditingItem(null);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/menu/items"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update menu item",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category_id: "",
      image_url: "",
      is_available: true,
      is_daily_special: false,
      site: "blue_area",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const itemData = {
      ...formData,
      price: formData.price,
      category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
    };

    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, updates: itemData });
    } else {
      createItemMutation.mutate(itemData);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category_id: item.category_id?.toString() || "",
      image_url: item.image_url || "",
      is_available: item.is_available,
      is_daily_special: item.is_daily_special,
      site: item.site,
    });
    setIsDialogOpen(true);
  };

  const handleToggleAvailability = (item: MenuItem) => {
    updateItemMutation.mutate({
      id: item.id,
      updates: { is_available: !item.is_available },
    });
  };

  const handleToggleDailySpecial = (item: MenuItem) => {
    updateItemMutation.mutate({
      id: item.id,
      updates: { is_daily_special: !item.is_daily_special },
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Menu Management</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingItem(null); resetForm(); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Menu Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Menu Item" : "Add Menu Item"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="price">Price (Rs.)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="site">Site</Label>
                <Select value={formData.site} onValueChange={(value) => setFormData({ ...formData, site: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue_area">Blue Area</SelectItem>
                    <SelectItem value="i_10">I-10</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_available"
                  checked={formData.is_available}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                />
                <Label htmlFor="is_available">Available</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_daily_special"
                  checked={formData.is_daily_special}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_daily_special: checked })}
                />
                <Label htmlFor="is_daily_special">Daily Special</Label>
              </div>
              
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createItemMutation.isPending || updateItemMutation.isPending}>
                  {createItemMutation.isPending || updateItemMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {menuItems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No menu items found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menuItems.map((item: MenuItem) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>Rs. {item.price}</TableCell>
                  <TableCell>
                    {categories.find((cat: any) => cat.id == item.category_id)?.name || "Uncategorized"}
                  </TableCell>
                  <TableCell>
                    {item.site === 'blue_area' ? 'Blue Area' : 'I-10'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Badge variant={item.is_available ? "default" : "secondary"}>
                        {item.is_available ? "Available" : "Unavailable"}
                      </Badge>
                      {item.is_daily_special && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          Daily Special
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAvailability(item)}
                      >
                        {item.is_available ? "Hide" : "Show"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleDailySpecial(item)}
                      >
                        {item.is_daily_special ? "Remove Special" : "Make Special"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
