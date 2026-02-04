"use client";

import { useRef, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Beef, Fish, UtensilsCrossed, Leaf, Baby, Upload, X, AlertTriangle } from "lucide-react";
import type { MealFormData, MealType } from "@/hooks/use-meals";
import { mealTypes, mealTypeLabels } from "@/hooks/use-meals";
import { ALLERGEN_OPTIONS, type AllergenType } from "@/types";

const mealTypeIcons: Record<MealType, React.ElementType> = {
  meat: Beef,
  fish: Fish,
  poultry: UtensilsCrossed,
  vegetarian: Leaf,
  vegan: Leaf,
  kids: Baby,
};

interface AddMealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: MealFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onMealTypeChange: (type: MealType) => void;
  onToggleAllergen: (allergen: AllergenType) => void;
  onImageChange: (file: File | null) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddMealDialog({
  open,
  onOpenChange,
  formData,
  onChange,
  onMealTypeChange,
  onToggleAllergen,
  onImageChange,
  onSubmit,
}: AddMealDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memoize object URL to prevent memory leak (URL.createObjectURL in render)
  const imagePreviewUrl = useMemo(() => {
    if (formData.image) return URL.createObjectURL(formData.image);
    return null;
  }, [formData.image]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onImageChange(file);
  };

  const handleRemoveImage = () => {
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Special Meal</DialogTitle>
          <DialogDescription>
            Request a special meal for your wedding. The restaurant/caterer will review and confirm if they can prepare it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Dish Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Grilled Salmon"
              value={formData.name}
              onChange={onChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              placeholder="Description..."
              value={formData.description}
              onChange={onChange}
              className="w-full min-h-20 px-3 py-2 rounded-md border border-input bg-background text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label>Meal Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {mealTypes.map((type) => {
                const Icon = mealTypeIcons[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onMealTypeChange(type)}
                    className={`flex items-center gap-2 p-2 rounded-md border text-sm ${
                      formData.meal_type === type
                        ? "border-rose-500 bg-rose-50 text-rose-700"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {mealTypeLabels[type]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Allergens Section */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Contains Allergens
            </Label>
            <p className="text-xs text-muted-foreground">
              Select all allergens present in this dish to help guests with allergies
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {ALLERGEN_OPTIONS.map((allergen) => (
                <Badge
                  key={allergen.value}
                  variant={formData.contains_allergens.includes(allergen.value) ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    formData.contains_allergens.includes(allergen.value)
                      ? "bg-amber-500 hover:bg-amber-600"
                      : "hover:bg-amber-50 hover:border-amber-300"
                  }`}
                  onClick={() => onToggleAllergen(allergen.value)}
                >
                  {allergen.label}
                </Badge>
              ))}
            </div>
            {formData.contains_allergens.length === 0 && (
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                ✓ Allergen-free
              </p>
            )}
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Dish Photo (optional)</Label>
            <p className="text-xs text-muted-foreground">Max 1MB. Formats: JPG, PNG, WebP</p>
            
            {formData.image ? (
              <div className="relative inline-block">
                <img
                  src={imagePreviewUrl || ""}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-rose-300 hover:bg-rose-50/50 transition-colors"
              >
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Click to upload image</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-rose-500 hover:bg-rose-600">
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
