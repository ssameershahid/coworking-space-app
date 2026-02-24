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
import { Plus, X, Pencil, Check } from "lucide-react";

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

  // Category management state
  const [showCatPanel, setShowCatPanel] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatSite, setNewCatSite] = useState("both");
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editingCatName, setEditingCatName] = useState("");

  const isAdmin = user?.role === "calmkaaj_admin" || user?.role === "calmkaaj_team";

  const categoriesEndpoint = isAdmin ? "/api/admin/menu/categories" : "/api/menu/categories";
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: [categoriesEndpoint],
    enabled: isOpen,
  });

  const invalidateCategories = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/menu/categories"] });
    queryClient.invalidateQueries({ queryKey: ["/api/menu/categories"] });
  };

  const createCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; site: string }) => {
      const res = await apiRequest("POST", "/api/admin/menu/categories", data);
      return res.json();
    },
    onSuccess: (newCat: any) => {
      invalidateCategories();
      setCategoryId(newCat.id.toString());
      setNewCatName("");
      toast({ title: "Category created", description: `"${newCat.name}" added.` });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create category", variant: "destructive" });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/menu/categories/${id}`, { name });
      return res.json();
    },
    onSuccess: () => {
      invalidateCategories();
      setEditingCatId(null);
      setEditingCatName("");
      toast({ title: "Category renamed." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to rename category", variant: "destructive" });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/menu/categories/${id}`);
    },
    onSuccess: (_, id) => {
      invalidateCategories();
      // If the deleted category was selected, clear selection
      if (categoryId === id.toString()) setCategoryId("");
      toast({ title: "Category deleted." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete category", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (item) {
      setName(item.name || "");
      setDescription(item.description || "");
      setPrice(item.price?.toString() || "");
      setImageUrl(item.image_url || "");
      setCategoryId(item.category_id?.toString() || "");
      if (item.site === "both") {
        setSelectedSites(["blue_area", "i_10"]);
      } else {
        setSelectedSites([item.site || "blue_area"]);
      }
      setIsAvailable(item.is_available ?? true);
      setIsDailySpecial(item.is_daily_special ?? false);
    } else {
      setName(""); setDescription(""); setPrice(""); setImageUrl(""); setCategoryId("");
      setSelectedSites(["blue_area"]); setIsAvailable(true); setIsDailySpecial(false);
    }
    setShowCatPanel(false);
    setNewCatName("");
    setEditingCatId(null);
  }, [item, isOpen]);

  const handleSave = () => {
    if (selectedSites.length === 0) return;
    let site: string;
    if (selectedSites.length === 2 && selectedSites.includes("blue_area") && selectedSites.includes("i_10")) {
      site = "both";
    } else if (selectedSites.length === 1) {
      site = selectedSites[0];
    } else {
      site = "blue_area";
    }
    const data: any = {
      name, description, price, image_url: imageUrl,
      category_id: parseInt(categoryId), site, is_available: isAvailable, is_daily_special: isDailySpecial,
    };
    if (item?.id) data.id = item.id;
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

  const siteLabelShort = (s: string) => s === "both" ? "Both" : s === "blue_area" ? "Blue Area" : "I-10";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Menu Item</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="price">Price (Rs.)</Label>
            <Input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>

          <div>
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input id="imageUrl" type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
          </div>

          {/* Category field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="category">Category</Label>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowCatPanel(v => !v)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                >
                  {showCatPanel ? <X className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
                  {showCatPanel ? "Close" : "Manage categories"}
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
                      <span className="ml-1 text-xs text-gray-400">({siteLabelShort(cat.site)})</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category management panel */}
            {isAdmin && showCatPanel && (
              <div className="mt-2 border rounded-lg bg-gray-50 p-3 space-y-3">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Manage Categories</p>

                {/* Existing categories */}
                <div className="space-y-1.5">
                  {categories.length === 0 && (
                    <p className="text-xs text-gray-400">No categories yet.</p>
                  )}
                  {categories.map((cat: any) => (
                    <div key={cat.id} className="flex items-center gap-1.5 bg-white border rounded-md px-2 py-1">
                      {editingCatId === cat.id ? (
                        <>
                          <Input
                            value={editingCatName}
                            onChange={(e) => setEditingCatName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && editingCatName.trim()) {
                                updateCategoryMutation.mutate({ id: cat.id, name: editingCatName });
                              }
                              if (e.key === "Escape") { setEditingCatId(null); setEditingCatName(""); }
                            }}
                            className="h-6 text-xs flex-1 px-1"
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              if (editingCatName.trim()) updateCategoryMutation.mutate({ id: cat.id, name: editingCatName });
                            }}
                            className="text-green-600 hover:text-green-800"
                            title="Save rename"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => { setEditingCatId(null); setEditingCatName(""); }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-xs flex-1 font-medium">{cat.name}</span>
                          <span className="text-xs text-gray-400">({siteLabelShort(cat.site)})</span>
                          <button
                            onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); }}
                            className="text-gray-400 hover:text-blue-600 ml-1"
                            title="Rename"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete category "${cat.name}"? Items in this category will become uncategorized.`)) {
                                deleteCategoryMutation.mutate(cat.id);
                              }
                            }}
                            className="text-gray-400 hover:text-red-500"
                            title="Delete"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Create new category */}
                <div className="border-t pt-2 space-y-1.5">
                  <p className="text-xs text-gray-500 font-medium">Add new category</p>
                  <Input
                    placeholder="Category name (e.g. Cold Drinks)"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newCatName.trim()) {
                        createCategoryMutation.mutate({ name: newCatName.trim(), site: newCatSite });
                      }
                    }}
                    className="h-7 text-xs"
                  />
                  <div className="flex gap-1.5">
                    <Select value={newCatSite} onValueChange={setNewCatSite}>
                      <SelectTrigger className="h-7 text-xs flex-1">
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
                      className="h-7 px-3 text-xs"
                      onClick={() => {
                        if (newCatName.trim()) {
                          createCategoryMutation.mutate({ name: newCatName.trim(), site: newCatSite });
                        }
                      }}
                      disabled={!newCatName.trim() || createCategoryMutation.isPending}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
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
            <Switch id="available" checked={isAvailable} onCheckedChange={setIsAvailable} />
            <Label htmlFor="available">Available</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="special" checked={isDailySpecial} onCheckedChange={setIsDailySpecial} />
            <Label htmlFor="special">Daily Special</Label>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
