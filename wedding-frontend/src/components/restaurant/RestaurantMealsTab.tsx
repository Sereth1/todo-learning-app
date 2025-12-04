"use client";

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
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  Utensils,
  AlertTriangle,
  CheckCircle,
  ImagePlus,
  X,
  Beef,
  Fish,
  Leaf,
  Baby,
  UtensilsCrossed,
} from "lucide-react";
import { useRestaurantMeals } from "@/hooks/use-restaurant-meals";
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
  const {
    groupedMeals,
    isLoading,
    isSaving,
    isDialogOpen,
    editingMeal,
    formData,
    imagePreview,
    fileInputRef,
    openDialog,
    handleDialogChange,
    updateFormField,
    handleImageChange,
    clearImage,
    toggleAllergen,
    handleSubmit,
    handleDelete,
  } = useRestaurantMeals(accessCode);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const hasMeals = Object.values(groupedMeals).some((meals) => meals.length > 0);

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
        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Meal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <MealForm
              formData={formData}
              imagePreview={imagePreview}
              fileInputRef={fileInputRef}
              editingMeal={editingMeal}
              isSaving={isSaving}
              onSubmit={handleSubmit}
              onCancel={() => handleDialogChange(false)}
              updateFormField={updateFormField}
              handleImageChange={handleImageChange}
              clearImage={clearImage}
              toggleAllergen={toggleAllergen}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {!hasMeals ? (
          <EmptyState />
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
                        onEdit={() => openDialog(meal)}
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

function EmptyState() {
  return (
    <div className="text-center py-12 text-gray-500">
      <Utensils className="h-12 w-12 mx-auto mb-4 text-gray-300" />
      <p>No meals yet</p>
      <p className="text-sm">Click &quot;Add Meal&quot; to create your first menu item</p>
    </div>
  );
}

interface MealFormProps {
  formData: RestaurantMealCreateData;
  imagePreview: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  editingMeal: RestaurantMeal | null;
  isSaving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  updateFormField: <K extends keyof RestaurantMealCreateData>(
    field: K,
    value: RestaurantMealCreateData[K]
  ) => void;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearImage: () => void;
  toggleAllergen: (allergen: AllergenType) => void;
}

function MealForm({
  formData,
  imagePreview,
  fileInputRef,
  editingMeal,
  isSaving,
  onSubmit,
  onCancel,
  updateFormField,
  handleImageChange,
  clearImage,
  toggleAllergen,
}: MealFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <DialogHeader>
        <DialogTitle>{editingMeal ? "Edit Meal" : "Add New Meal"}</DialogTitle>
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
              onChange={(e) => updateFormField("name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meal_type">Type *</Label>
            <Select
              value={formData.meal_type}
              onValueChange={(value) =>
                updateFormField(
                  "meal_type",
                  value as RestaurantMealCreateData["meal_type"]
                )
              }
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
            onChange={(e) => updateFormField("description", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Image (max 1MB)</Label>
          <div className="flex items-start gap-4">
            {imagePreview ? (
              <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={clearImage}
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
              <p className="text-xs">JPG, PNG, WebP - Max 1MB</p>
            </div>
          </div>
        </div>

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
            onCheckedChange={(checked) => updateFormField("is_available", checked)}
          />
          <Label htmlFor="is_available">Available for selection</Label>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {editingMeal ? "Update" : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface MealCardProps {
  meal: RestaurantMeal;
  onEdit: () => void;
  onDelete: () => void;
}

function MealCard({ meal, onEdit, onDelete }: MealCardProps) {
  const hasAllergens = meal.contains_allergens && meal.contains_allergens.length > 0;
  const mealType = MEAL_TYPES.find((t) => t.value === meal.meal_type);
  const Icon = mealType?.icon || UtensilsCrossed;

  return (
    <Card className="overflow-hidden group relative">
      {meal.image_url ? (
        <div className="aspect-square w-full overflow-hidden">
          <img
            src={meal.image_url}
            alt={meal.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-square w-full bg-gray-100 flex items-center justify-center">
          <Icon className="h-8 w-8 text-gray-300" />
        </div>
      )}

      <div className="absolute top-1 right-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 bg-white/80 hover:bg-white shadow-sm"
            >
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

      <div className="absolute top-1 left-1">
        <Badge
          variant="secondary"
          className="bg-white/90 text-[10px] px-1.5 py-0.5 shadow-sm"
        >
          {mealType?.label || meal.meal_type}
        </Badge>
      </div>

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
