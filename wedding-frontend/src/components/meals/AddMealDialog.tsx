"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Beef, Fish, UtensilsCrossed, Leaf, Baby } from "lucide-react";
import type { MealFormData, MealType } from "@/hooks/use-meals";
import { mealTypes, mealTypeLabels } from "@/hooks/use-meals";

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
  onSubmit: (e: React.FormEvent) => void;
}

export function AddMealDialog({
  open,
  onOpenChange,
  formData,
  onChange,
  onMealTypeChange,
  onSubmit,
}: AddMealDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Meal Option</DialogTitle>
          <DialogDescription>Add a new menu item for your guests</DialogDescription>
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-rose-500 hover:bg-rose-600">
              Add Meal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
