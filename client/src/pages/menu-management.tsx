import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Menu } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SimpleMenuEdit } from "@/components/simple-menu-edit";

export default function MenuManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingMenuItem, setEditingMenuItem] = useState<any>(null);
  const [isSimpleEditOpen, setIsSimpleEditOpen] = useState(false);

  // Determine API endpoint based on user role
  const isAdmin = user?.role === 'calmkaaj_admin';
  const isCafeManager = user?.role === 'cafe_manager';
  // Both admins and cafe managers should see all items to manage both sites
  const apiEndpoint = (isAdmin || isCafeManager) ? '/api/admin/menu/items' : '/api/menu/items';

  // Fetch menu items
  const { data: menuItems = [], isLoading } = useQuery({
    queryKey: [apiEndpoint],
    enabled: !!user && (isAdmin || isCafeManager)
  });

  // Fetch categories (admin and cafe managers get all categories to see both sites)
  const categoriesEndpoint = (isAdmin || isCafeManager) ? '/api/admin/menu/categories' : '/api/menu/categories';
  const { data: categories = [] } = useQuery({
    queryKey: [categoriesEndpoint],
    enabled: !!user && (isAdmin || isCafeManager)
  });

  // Create menu item mutation
  const createMenuItem = useMutation({
    mutationFn: async (menuItemData: any) => {
      return apiRequest('POST', '/api/menu/items', menuItemData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/menu/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu/items"] });
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

  // Update menu item mutation
  const updateMenuItem = useMutation({
    mutationFn: async ({ itemId, updates }: { itemId: number; updates: any }) => {
      return apiRequest('PATCH', `/api/menu/items/${itemId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/menu/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu/items"] });
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

  // Delete menu item mutation
  const deleteMenuItem = useMutation({
    mutationFn: async (itemId: number) => {
      return apiRequest('DELETE', `/api/menu/items/${itemId}`);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/menu/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu/items"] });
      
      if (data?.soft_deleted) {
        toast({ 
          title: "Menu item marked as unavailable",
          description: "Item cannot be deleted as it has existing orders. It has been marked as unavailable instead."
        });
      } else {
        toast({ title: "Menu item deleted successfully!" });
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete menu item", 
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleEditMenuItem = (item: any) => {
    setEditingMenuItem(item);
    setIsSimpleEditOpen(true);
  };

  const handleAddMenuItem = () => {
    setEditingMenuItem(null);
    setIsSimpleEditOpen(true);
  };

  const handleSaveFromSimpleEdit = (itemData: any) => {
    if (itemData.id) {
      // Update existing item
      updateMenuItem.mutate({ itemId: itemData.id, updates: itemData });
    } else {
      // Create new item
      createMenuItem.mutate(itemData);
    }
    setIsSimpleEditOpen(false);
    setEditingMenuItem(null);
  };

  const handleDeleteMenuItem = (itemId: number) => {
    if (confirm("Are you sure you want to delete this menu item?")) {
      deleteMenuItem.mutate(itemId);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading menu items...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Menu className="h-8 w-8" />
            Menu Management
          </h1>
          <p className="text-gray-600 mt-2">
            {isAdmin ? "Manage all café menu items and pricing" : "Manage your café's menu items and pricing"}
          </p>
        </div>
        <Button onClick={handleAddMenuItem} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Menu Item
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Menu Items</CardTitle>
        </CardHeader>
        <CardContent>
          {menuItems.length === 0 ? (
            <div className="text-center py-12">
              <Menu className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No menu items found</p>
              <p className="text-gray-400 text-sm mt-2">Get started by adding your first menu item</p>
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
                  {menuItems.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">{item.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>Rs. {item.price}</TableCell>
                      <TableCell className="capitalize">
                        {categories.find((cat: any) => cat.id == item.category_id)?.name || "Uncategorized"}
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">
                          {item.site === 'blue_area' ? 'Blue Area' : 
                           item.site === 'i_10' ? 'I-10' : 
                           item.site === 'both' ? 'Both Sites' :
                           item.site}
                        </span>
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Simple Edit Dialog */}
      <SimpleMenuEdit
        isOpen={isSimpleEditOpen}
        onClose={() => {
          setIsSimpleEditOpen(false);
          setEditingMenuItem(null);
        }}
        item={editingMenuItem}
        onSave={handleSaveFromSimpleEdit}
      />
    </div>
  );
}