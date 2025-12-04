"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, MoreHorizontal, Pencil, Trash2, Loader2, Utensils,
  AlertTriangle, CheckCircle, ImagePlus, X, Beef, Fish, Leaf, Baby, UtensilsCrossed
} from "lucide-react";
import { toast } from "sonner";
import {
  getRestaurantMeals,
  createRestaurantMeal,
  updateRestaurantMeal,
  deleteRestaurantMeal,
} from "@/actions/restaurant";
import type { RestaurantMeal, RestaurantMealCreateData, AllergenType } from "@/types";
import { ALLERGEN_OPTIONS } from "@/types";

const MEAL_TYPES = [
  { value: "meat", label: "Meat", icon: Beef },
  { value: "fish", label: "Fish", icon: Fish },
  { value: "poultry", label: "Poultry", icon: UtensilsCrossed },
  { value: "vegetarian", label: "Vegetarian", icon: Leaf },
  { value: "vegan", label: "Vegan", icon: Leaf },
  { value: "kids", label: "Kids Menu", icon: Baby },
] as const;

interface RestaurantMealsTabProps {
  accessCode: string;
}

export function RestaurantMealsTab({ accessCode }: RestaurantMealsTabProps) {
  const [meals, setMeals] = useState<RestaurantMeal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<RestaurantMeal | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<RestaurantMealCreateData>({
    name: "",
    description: "",
    meal_type: "meat",
    contains_allergens: [],
    is_available: true,
  });
  
  const loadMeals = async () => {
    setIsLoading(true);
    const result = await getRestaurantMeals(accessCode);
    if (result.success && result.data) {
      setMeals(result.data);
    } else {
      toast.error(result.error || "Failed to load meals");
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    loadMeals();
  }, [accessCode]);
  
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      meal_type: "meat",
      contains_allergens: [],
      is_available: true,
    });
    setEditingMeal(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const handleOpenDialog = (meal?: RestaurantMeal) => {
    if (meal) {
      setEditingMeal(meal);
      setFormData({
        name: meal.name,
        description: meal.description || "",
        meal_type: meal.meal_type,
        contains_allergens: meal.contains_allergens || [],
        is_available: meal.is_available,
      });
      setImagePreview(meal.image_url || null);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate size (1MB max)
      if (file.size > 1024 * 1024) {
        toast.error("Image must be less than 1MB");
        return;
      }
      
      setFormData(prev => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };
  
  const toggleAllergen = (allergen: AllergenType) => {
    setFormData(prev => {
      const current = prev.contains_allergens || [];
      if (current.includes(allergen)) {
        return { ...prev, contains_allergens: current.filter(a => a !== allergen) };
      } else {
        return { ...prev, contains_allergens: [...current, allergen] };
      }
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Please enter a meal name");
      return;
    }
    
    setIsSaving(true);
    
    try {
      if (editingMeal) {
        const result = await updateRestaurantMeal(accessCode, editingMeal.id, formData);
        if (result.success) {
          toast.success("Meal updated");
          loadMeals();
          setIsDialogOpen(false);
          resetForm();
        } else {
          toast.error(result.error || "Failed to update meal");
        }
      } else {
        const result = await createRestaurantMeal(accessCode, formData);
        if (result.success) {
          toast.success("Meal created");
          loadMeals();
          setIsDialogOpen(false);
          resetForm();
        } else {
          toast.error(result.error || "Failed to create meal");
        }
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDelete = async (meal: RestaurantMeal) => {
    if (!confirm(`Delete "${meal.name}"?`)) {
      return;
    }
    
    const result = await deleteRestaurantMeal(accessCode, meal.id);
    if (result.success) {
      toast.success("Meal deleted");
      loadMeals();
    } else {
      toast.error(result.error || "Failed to delete meal");
    }
  };
  
  // Group meals by type
  const groupedMeals = meals.reduce((acc, meal) => {
    const type = meal.meal_type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(meal);
    return acc;
  }, {} as Record<string, RestaurantMeal[]>);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Menu Items
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Manage meal options for the wedding
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Meal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingMeal ? "Edit Meal" : "Add New Meal"}
                </DialogTitle>
                <DialogDescription>
                  {editingMeal 
                    ? "Update the meal details" 
                    : "Create a new menu item for the wedding"}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Meal Name *</Label>
                    <Input
                      id="name"
                      required
                      placeholder="e.g., Grilled Salmon"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="meal_type">Type *</Label>
                    <Select
                      value={formData.meal_type}
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        meal_type: value as RestaurantMealCreateData["meal_type"] 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MEAL_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the meal..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                
                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Image (max 1MB)</Label>
                  <div className="flex items-start gap-4">
                    {imagePreview ? (
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setFormData(prev => ({ ...prev, image: undefined }));
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                      >
                        <ImagePlus className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="text-sm text-gray-500">
                      <p>Click to upload an image</p>
                      <p className="text-xs">JPG, PNG, WebP • Max 1MB</p>
                    </div>
                  </div>
                </div>
                
                {/* Allergens */}
                <div className="space-y-2">
                  <Label>Contains Allergens</Label>
                  <div className="flex flex-wrap gap-2">
                    {ALLERGEN_OPTIONS.map((allergen) => {
                      const isSelected = formData.contains_allergens?.includes(allergen.value);
                      return (
                        <Badge
                          key={allergen.value}
                          variant={isSelected ? "default" : "outline"}
                          className={`cursor-pointer transition-colors ${
                            isSelected 
                              ? "bg-amber-500 hover:bg-amber-600" 
                              : "hover:bg-gray-100"
                          }`}
                          onClick={() => toggleAllergen(allergen.value)}
                        >
                          {allergen.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_available"
                    checked={formData.is_available}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_available: checked }))}
                  />
                  <Label htmlFor="is_available">Available for selection</Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingMeal ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        {meals.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Utensils className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No meals yet</p>
            <p className="text-sm">Click "Add Meal" to create your first menu item</p>
          </div>
        ) : (
          <div className="space-y-6">
            {MEAL_TYPES.map((type) => {
              const typeMeals = groupedMeals[type.value];
              if (!typeMeals || typeMeals.length === 0) return null;
              
              const Icon = type.icon;
              return (
                <div key={type.value}>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {type.label} ({typeMeals.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {typeMeals.map((meal) => (
                      <MealCard 
                        key={meal.id} 
                        meal={meal}
                        onEdit={() => handleOpenDialog(meal)}
                        onDelete={() => handleDelete(meal)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MealCardProps {
  meal: RestaurantMeal;
  onEdit: () => void;
  onDelete: () => void;
}

function MealCard({ meal, onEdit, onDelete }: MealCardProps) {
  const hasAllergens = meal.contains_allergens && meal.contains_allergens.length > 0;
  const mealType = MEAL_TYPES.find(t => t.value === meal.meal_type);
  const Icon = mealType?.icon || UtensilsCrossed;
  
  return (
    <Card className="overflow-hidden group relative">
      {/* Image or placeholder */}
      {meal.image_url ? (
        <div className="aspect-square w-full overflow-hidden">
          <img src={meal.image_url} alt={meal.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-square w-full bg-gray-100 flex items-center justify-center">
          <Icon className="h-8 w-8 text-gray-300" />
        </div>
      )}
      
      {/* Menu button */}
      <div className="absolute top-1 right-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 bg-white/80 hover:bg-white shadow-sm">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Type badge */}
      <div className="absolute top-1 left-1">
        <Badge variant="secondary" className="bg-white/90 text-[10px] px-1.5 py-0.5 shadow-sm">
          {mealType?.label || meal.meal_type}
        </Badge>
      </div>
      
      {/* Info below image */}
      <div className="p-2 border-t">
        <p className="text-xs font-medium truncate">{meal.name}</p>
        {hasAllergens ? (
          <div className="flex items-center gap-0.5 text-amber-600 text-[10px] mt-0.5">
            <AlertTriangle className="h-2.5 w-2.5" />
            <span>{meal.contains_allergens.length} allergens</span>
          </div>
        ) : (
          <div className="flex items-center gap-0.5 text-green-600 text-[10px] mt-0.5">
            <CheckCircle className="h-2.5 w-2.5" />
            <span>Allergen-free</span>
          </div>
        )}
      </div>
    </Card>
  );
}
