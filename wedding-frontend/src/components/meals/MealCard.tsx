"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Leaf, Beef, Fish, UtensilsCrossed, Baby, AlertTriangle, CheckCircle } from "lucide-react";
import type { MealChoice } from "@/types";
import type { MealType } from "@/hooks/use-meals";
import { mealTypeLabels } from "@/hooks/use-meals";

const mealTypeIcons: Record<MealType, React.ElementType> = {
  meat: Beef,
  fish: Fish,
  poultry: UtensilsCrossed,
  vegetarian: Leaf,
  vegan: Leaf,
  kids: Baby,
};

interface MealCardProps {
  meal: MealChoice;
  onDelete: (meal: MealChoice) => void;
}

export function MealCard({ meal, onDelete }: MealCardProps) {
  const Icon = mealTypeIcons[meal.meal_type as MealType] || UtensilsCrossed;
  const hasAllergens = meal.contains_allergens && meal.contains_allergens.length > 0;

  return (
    <Card className="overflow-hidden group relative">
      {/* Image Section - Square */}
      {meal.image_url ? (
        <div className="aspect-square w-full overflow-hidden">
          <img
            src={meal.image_url}
            alt={meal.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        /* No image placeholder - Square with icon */
        <div className="aspect-square w-full bg-gray-100 flex items-center justify-center">
          <Icon className="h-8 w-8 text-gray-300" />
        </div>
      )}
      
      {/* Menu button - top right corner */}
      <div className="absolute top-1 right-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 bg-white/80 hover:bg-white shadow-sm">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onDelete(meal)} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Type badge - top left corner */}
      <div className="absolute top-1 left-1">
        <Badge variant="secondary" className="bg-white/90 text-[10px] px-1.5 py-0.5 shadow-sm">
          {mealTypeLabels[meal.meal_type as MealType] || meal.meal_type}
        </Badge>
      </div>
      
      {/* Text info - Below image */}
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
