import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

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

export function MenuManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [menuForm, setMenuForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image_url: "",
    is_available: true,
    is_daily_special: false,
    site: user?.site || "blue_area"
  });

  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ['/api/admin/menu/items'],
    enabled: !!user,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/menu/categories"],
    enabled: !!user,
  });

  const createMenuItem = useMutation({
    mutationFn: async (menuItemData: any) => {
      return apiRequest('POST', '/api/menu/items', menuItemData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/menu/items'] });
      setIsMenuDialogOpen(false);
      resetMenuForm();
      toast({ title: "Menu item created successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create menu item", 
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    }
  });

  const updateMenuItem = useMutation({
    mutationFn: async ({ itemId, updates }: { itemId: number; updates: any }) => {
      return apiRequest('PATCH', `/api/menu/items/${itemId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/menu/items'] });
      setIsMenuDialogOpen(false);
      resetMenuForm();
      toast({ title: "Menu item updated successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update menu item", 
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    }
  });

  const deleteMenuItem = useMutation({
    mutationFn: async (itemId: number) => {
      return apiRequest('DELETE', `/api/menu/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/menu/items'] });
      toast({ title: "Menu item deleted successfully!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete menu item", 
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    }
  });

  const resetMenuForm = () => {
    setMenuForm({
      name: "",
      description: "",
      price: "",
      category: "",
      image_url: "",
      is_available: true,
      is_daily_special: false,
      site: user?.site || "blue_area"
    });
    setEditingMenuItem(null);
  };

  const handleCreateMenuItem = () => {
    const menuItemData = {
      ...menuForm,
      price: parseFloat(menuForm.price).toFixed(2)
    };
    createMenuItem.mutate(menuItemData);
  };

  const handleEditMenuItem = (item: MenuItem) => {
    setEditingMenuItem(item);
    setMenuForm({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      image_url: item.image_url || "",
      is_available: item.is_available,
      is_daily_special: item.is_daily_special,
      site: item.site
    });
    setIsMenuDialogOpen(true);
  };

  const handleUpdateMenuItem = () => {
    if (!editingMenuItem) return;
    
    const updates = {
      ...menuForm,
      price: parseFloat(menuForm.price).toFixed(2)
    };
    updateMenuItem.mutate({ itemId: editingMenuItem.id, updates });
  };

  const handleDeleteMenuItem = (itemId: number) => {
    if (confirm("Are you sure you want to delete this menu item?")) {
      deleteMenuItem.mutate(itemId);
    }
  };

  const filteredMenuItems = menuItems.filter(item => 
    user?.role === 'calmkaaj_admin' || item.site === user?.site
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Menu Management</CardTitle>
          <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetMenuForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Menu Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingMenuItem ? "Edit Menu Item" : "Add New Menu Item"}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input
                    id="name"
                    value={menuForm.name}
                    onChange={(e) => setMenuForm({...menuForm, name: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">Description</Label>
                  <Textarea
                    id="description"
                    value={menuForm.description}
                    onChange={(e) => setMenuForm({...menuForm, description: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">Price (Rs.)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={menuForm.price}
                    onChange={(e) => setMenuForm({...menuForm, price: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">Category</Label>
                  <Select value={menuForm.category} onValueChange={(value) => setMenuForm({...menuForm, category: value})}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="image_url" className="text-right">Image URL</Label>
                  <Input
                    id="image_url"
                    value={menuForm.image_url}
                    onChange={(e) => setMenuForm({...menuForm, image_url: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="site" className="text-right">Site</Label>
                  <Select value={menuForm.site} onValueChange={(value) => setMenuForm({...menuForm, site: value})}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blue_area">Blue Area</SelectItem>
                      <SelectItem value="i_10">I-10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="is_available" className="text-right">Available</Label>
                  <Switch
                    id="is_available"
                    checked={menuForm.is_available}
                    onCheckedChange={(checked) => setMenuForm({...menuForm, is_available: checked})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="is_daily_special" className="text-right">Daily Special</Label>
                  <Switch
                    id="is_daily_special"
                    checked={menuForm.is_daily_special}
                    onCheckedChange={(checked) => setMenuForm({...menuForm, is_daily_special: checked})}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsMenuDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={editingMenuItem ? handleUpdateMenuItem : handleCreateMenuItem}>
                  {editingMenuItem ? "Update" : "Create"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMenuItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="max-w-[200px] truncate">{item.description}</TableCell>
                <TableCell>Rs. {item.price}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>
                  {item.site === 'blue_area' ? 'Blue Area' : 'I-10'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Badge variant={item.is_available ? "default" : "secondary"}>
                      {item.is_available ? "Available" : "Unavailable"}
                    </Badge>
                    {item.is_daily_special && (
                      <Badge variant="destructive">Special</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditMenuItem(item)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteMenuItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}