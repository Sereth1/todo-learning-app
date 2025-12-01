"use client";

import { useState, useEffect } from "react";
import { useWedding } from "@/contexts/wedding-context";
import { Plus, ExternalLink, Trash2, Edit, Gift, Check, Loader2, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  getRegistryDashboard,
  createRegistryItem,
  createRegistryItemWithImage,
  updateRegistryItem,
  deleteRegistryItem,
} from "@/actions/registry";
import type {
  RegistryItem,
  RegistryStats,
  GiftRegistry,
  RegistryItemCreate,
} from "@/types/registry";
import { ITEM_CATEGORIES, ITEM_PRIORITIES } from "@/types/registry";

export default function RegistryDashboard() {
  const { selectedWedding } = useWedding();
  const [registry, setRegistry] = useState<GiftRegistry | null>(null);
  const [items, setItems] = useState<RegistryItem[]>([]);
  const [stats, setStats] = useState<RegistryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters (sent to backend)
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RegistryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<RegistryItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<RegistryItemCreate>({
    name: "",
    description: "",
    external_url: "",
    price: undefined,
    category: "other",
    priority: "medium",
    quantity_requested: 1,
    is_visible: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchDashboard = async () => {
    if (!selectedWedding?.id) return;
    
    setIsLoading(true);
    const result = await getRegistryDashboard({
      wedding: selectedWedding.id,
      category: categoryFilter,
      priority: priorityFilter,
      status: statusFilter,
      search: debouncedSearch,
    });
    
    if (result.success && result.data) {
      setRegistry(result.data.registry);
      setItems(result.data.items);
      setStats(result.data.stats);
    } else {
      toast.error(result.error || "Failed to load registry");
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    if (selectedWedding?.id) {
      fetchDashboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWedding?.id, categoryFilter, priorityFilter, statusFilter, debouncedSearch]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      external_url: "",
      price: undefined,
      category: "other",
      priority: "medium",
      quantity_requested: 1,
      is_visible: true,
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const processImageFile = (file: File) => {
    // Validate file size (max 1MB)
    if (file.size > 1 * 1024 * 1024) {
      toast.error("Image must be less than 1MB");
      return;
    }
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          processImageFile(file);
        }
        break;
      }
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setEditingItem(null);
    setIsAddDialogOpen(true);
  };

  const handleOpenEdit = (item: RegistryItem) => {
    setFormData({
      name: item.name,
      description: item.description || "",
      external_url: item.external_url || "",
      price: item.price || undefined,
      category: item.category,
      priority: item.priority,
      quantity_requested: item.quantity_requested,
      is_visible: item.is_visible,
    });
    setEditingItem(item);
    setImagePreview(item.image_url || null);
    setIsAddDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Please enter a name");
      return;
    }
    
    setIsSubmitting(true);
    
    if (editingItem) {
      // Update (without image change for now)
      const result = await updateRegistryItem(editingItem.id, formData);
      
      if (result.success && result.data) {
        toast.success("Item updated");
        setItems(prev => 
          prev.map(item => 
            item.id === editingItem.id ? result.data! : item
          )
        );
        setIsAddDialogOpen(false);
        resetForm();
      } else {
        toast.error(result.error || "Failed to update item");
      }
    } else {
      // Create - use FormData if image is present
      let result;
      
      if (imageFile) {
        const formDataToSend = new FormData();
        formDataToSend.append("name", formData.name);
        formDataToSend.append("wedding", String(selectedWedding?.id));
        if (formData.description) formDataToSend.append("description", formData.description);
        if (formData.external_url) formDataToSend.append("external_url", formData.external_url);
        if (formData.price) formDataToSend.append("price", String(formData.price));
        if (formData.category) formDataToSend.append("category", formData.category);
        if (formData.priority) formDataToSend.append("priority", formData.priority);
        formDataToSend.append("quantity_requested", String(formData.quantity_requested || 1));
        formDataToSend.append("is_visible", String(formData.is_visible ?? true));
        formDataToSend.append("image", imageFile);
        
        result = await createRegistryItemWithImage(formDataToSend);
      } else {
        result = await createRegistryItem({
          ...formData,
          wedding: selectedWedding?.id,
        });
      }
      
      if (result.success && result.data) {
        toast.success("Item added to wishlist");
        setItems(prev => [result.data!, ...prev]);
        setIsAddDialogOpen(false);
        resetForm();
      } else {
        toast.error(result.error || "Failed to add item");
      }
    }
    
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    
    const result = await deleteRegistryItem(deletingItem.id);
    
    if (result.success) {
      toast.success("Item removed");
      setItems(prev => prev.filter(item => item.id !== deletingItem.id));
      setDeletingItem(null);
    } else {
      toast.error(result.error || "Failed to remove item");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Items</CardDescription>
              <CardTitle className="text-3xl">{stats.total_items}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Claimed</CardDescription>
              <CardTitle className="text-3xl text-green-600">{stats.claimed_items}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Available</CardDescription>
              <CardTitle className="text-3xl text-blue-600">{stats.available_items}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Value</CardDescription>
              <CardTitle className="text-3xl">€{stats.total_value?.toFixed(0) || 0}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Filters & Add Button */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[200px]"
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {ITEM_CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {ITEM_PRIORITIES.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="claimed">Claimed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={handleOpenAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Items Grid */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Gift className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">
                {items.length === 0 
                  ? "Start adding items to your wishlist"
                  : "No items match your filters"
                }
              </p>
              {items.length === 0 && (
                <Button onClick={handleOpenAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Item
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card 
              key={item.id} 
              className={`overflow-hidden ${item.is_claimed ? "bg-green-50 dark:bg-green-950/30 border-green-200" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Image Thumbnail */}
                  <div className="flex-shrink-0">
                    {item.image_url ? (
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                        <Gift className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    {/* Title & Price Row */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-base truncate">{item.name}</h3>
                      {item.price_display && (
                        <span className="font-bold text-primary whitespace-nowrap">
                          {item.price_display}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                        {item.description}
                      </p>
                    )}

                    {/* Badges Row */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {ITEM_CATEGORIES.find(c => c.value === item.category)?.label || item.category}
                      </Badge>
                      <Badge 
                        variant={item.priority === "high" ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {item.priority === "high" ? "🔥 Must Have" : item.priority === "medium" ? "Nice to Have" : "Dream Item"}
                      </Badge>
                      
                      {/* Status Badge */}
                      {item.is_claimed ? (
                        <Badge className="bg-green-500 hover:bg-green-600 text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          Will be brought
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50">
                          ⏳ Pending
                        </Badge>
                      )}
                    </div>

                    {/* Claimed by info */}
                    {item.is_claimed && item.claimed_by_name && (
                      <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                        🎁 {item.claimed_by_name} will bring this
                        {item.claimed_at && (
                          <span className="text-muted-foreground font-normal ml-1">
                            • claimed {new Date(item.claimed_at).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    )}

                    {/* External URL */}
                    {item.external_url && !item.is_claimed && (
                      <a 
                        href={item.external_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View product
                      </a>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {item.external_url && (
                      <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                        <a href={item.external_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenEdit(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeletingItem(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Item" : "Add to Wishlist"}
            </DialogTitle>
            <DialogDescription>
              {editingItem 
                ? "Update the item details"
                : "Add a product you'd like to receive as a gift"
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., KitchenAid Stand Mixer"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Color, size, or other details..."
                rows={2}
              />
            </div>

            {/* Image Upload */}
            <div>
              <Label>Product Image (max 1MB)</Label>
              {imagePreview ? (
                <div className="mt-2 relative w-full h-32 rounded-lg overflow-hidden border">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label 
                  className="mt-2 flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors focus-within:ring-2 focus-within:ring-primary"
                  tabIndex={0}
                  onPaste={handlePaste}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.currentTarget.querySelector('input')?.click();
                    }
                  }}
                >
                  <ImagePlus className="h-8 w-8 text-muted-foreground mb-1" />
                  <span className="text-sm text-muted-foreground">Click to upload or paste (Ctrl+V)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div>
              <Label htmlFor="external_url">Product URL</Label>
              <Input
                id="external_url"
                type="url"
                value={formData.external_url}
                onChange={(e) => setFormData(prev => ({ ...prev, external_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price || ""}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    price: e.target.value ? parseFloat(e.target.value) : undefined 
                  }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, priority: v }))}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ITEM_PRIORITIES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingItem ? (
                  "Save Changes"
                ) : (
                  "Add Item"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove item?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove &ldquo;{deletingItem?.name}&rdquo; from your wishlist?
              {deletingItem?.is_claimed && " This item has already been claimed by a guest."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
