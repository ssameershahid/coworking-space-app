import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, X } from "lucide-react";

interface MenuItemEditProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  onSave: (data: any) => void;
}

export function SimpleMenuEdit({ isOpen, onClose, item, onSave }: MenuItemEditProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedSites, setSelectedSites] = useState<string[]>(["blue_area"]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isDailySpecial, setIsDailySpecial] = useState(false);

  // New category form state
  const [showNewCatForm, setShowNewCatForm] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatSite, setNewCatSite] = useState("both");

  const isAdmin = user?.role === "calmkaaj_admin" || user?.role === "calmkaaj_team";

  // Admins fetch all categories across all sites; regular users fetch by their site
  const categoriesEndpoint = isAdmin ? "/api/admin/menu/categories" : "/api/menu/categories";
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: [categoriesEndpoint],
    enabled: isOpen,
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; site: string }) => {
      const res = await apiRequest("POST", "/api/admin/menu/categories", data);
      return res.json();
    },
    onSuccess: (newCat: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/menu/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu/categories"] });
      setCategoryId(newCat.id.toString());
      setNewCatName("");
      setShowNewCatForm(false);
      toast({ title: "Category created", description: `"${newCat.name}" has been added.` });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create category", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (item) {
      setName(item.name || "");
      setDescription(item.description || "");
      setPrice(item.price?.toString() || "");
      setImageUrl(item.image_url || "");
      setCategoryId(item.category_id?.toString() || "");

      // Convert site value to selectedSites array
      if (item.site === "both") {
        setSelectedSites(["blue_area", "i_10"]);
      } else {
        setSelectedSites([item.site || "blue_area"]);
      }

      setIsAvailable(item.is_available ?? true);
      setIsDailySpecial(item.is_daily_special ?? false);
    } else {
      setName("");
      setDescription("");
      setPrice("");
      setImageUrl("");
      setCategoryId("");
      setSelectedSites(["blue_area"]);
      setIsAvailable(true);
      setIsDailySpecial(false);
    }
    setShowNewCatForm(false);
    setNewCatName("");
  }, [item, isOpen]);

  const handleSave = () => {
    // Validate that at least one site is selected
    if (selectedSites.length === 0) {
      return; // Don't save if no sites selected
    }

    // Convert selectedSites array back to site string for backend compatibility
    let site: string;
    if (selectedSites.length === 2 && selectedSites.includes("blue_area") && selectedSites.includes("i_10")) {
      site = "both";
    } else if (selectedSites.length === 1) {
      site = selectedSites[0];
    } else {
      site = "blue_area"; // fallback
    }

    const data: any = {
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

  const handleSiteToggle = (siteValue: string, checked: boolean) => {
    if (checked) {
      setSelectedSites(prev => [...prev, siteValue]);
    } else {
      setSelectedSites(prev => prev.filter(s => s !== siteValue));
    }
  };

  const handleCreateCategory = () => {
    if (!newCatName.trim()) return;
    createCategoryMutation.mutate({ name: newCatName.trim(), site: newCatSite });
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
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="category">Category</Label>
              {isAdmin && !showNewCatForm && (
                <button
                  type="button"
                  onClick={() => setShowNewCatForm(true)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                >
                  <Plus className="h-3 w-3" />
                  New category
                </button>
              )}
            </div>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                    {isAdmin && cat.site !== "both" && (
                      <span className="ml-1 text-xs text-gray-400">
                        ({cat.site === "blue_area" ? "Blue Area" : "I-10"})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Inline new category form */}
            {isAdmin && showNewCatForm && (
              <div className="mt-2 p-3 border rounded-lg bg-blue-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-blue-800">Create new category</span>
                  <button
                    type="button"
                    onClick={() => { setShowNewCatForm(false); setNewCatName(""); }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <Input
                  placeholder="Category name (e.g. Cold Drinks)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreateCategory(); } }}
                  className="h-8 text-sm"
                />
                <Select value={newCatSite} onValueChange={setNewCatSite}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Both Sites</SelectItem>
                    <SelectItem value="blue_area">Blue Area only</SelectItem>
                    <SelectItem value="i_10">I-10 only</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  className="w-full h-8"
                  onClick={handleCreateCategory}
                  disabled={!newCatName.trim() || createCategoryMutation.isPending}
                >
                  {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
                </Button>
              </div>
            )}
          </div>

          <div>
            <Label>Available at Sites</Label>
            <div className="space-y-3 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="site-blue-area"
                  checked={selectedSites.includes("blue_area")}
                  onCheckedChange={(checked) => handleSiteToggle("blue_area", checked as boolean)}
                />
                <Label htmlFor="site-blue-area" className="font-normal">Blue Area</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="site-i10"
                  checked={selectedSites.includes("i_10")}
                  onCheckedChange={(checked) => handleSiteToggle("i_10", checked as boolean)}
                />
                <Label htmlFor="site-i10" className="font-normal">I-10</Label>
              </div>
              {selectedSites.length === 2 && (
                <div className="text-sm text-green-600 bg-green-50 p-2 rounded-md">
                  ✓ This item will be available at both sites
                </div>
              )}
              {selectedSites.length === 0 && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md">
                  ⚠ Please select at least one site
                </div>
              )}
            </div>
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
