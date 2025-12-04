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
    <Card className="overflow-hidden">
      {/* Image Section */}
      {meal.image_url && (
        <div className="relative aspect-square w-full">
          <img
            src={meal.image_url}
            alt={meal.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-1 right-1">
            <Badge variant="secondary" className="bg-white/90 text-xs">
              {mealTypeLabels[meal.meal_type as MealType] || meal.meal_type}
            </Badge>
          </div>
        </div>
      )}

      <CardHeader className={`p-2 pb-1 ${meal.image_url ? 'pt-2' : ''}`}>
        <div className="flex items-start justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            {!meal.image_url && (
              <div className="p-1.5 rounded-md bg-rose-50 shrink-0">
                <Icon className="h-4 w-4 text-rose-500" />
              </div>
            )}
            <div className="min-w-0">
              <CardTitle className="text-sm truncate">{meal.name}</CardTitle>
              {!meal.image_url && (
                <Badge variant="outline" className="mt-0.5 text-xs">
                  {mealTypeLabels[meal.meal_type as MealType] || meal.meal_type}
                </Badge>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
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
      </CardHeader>

      <CardContent className="p-2 pt-0">
        {meal.description && (
          <p className="text-xs text-gray-500 mb-2 line-clamp-2">{meal.description}</p>
        )}

        {/* Allergens Section */}
        {hasAllergens ? (
          <div className="mb-2">
            <div className="flex items-center gap-1 text-amber-600 text-xs font-medium mb-0.5">
              <AlertTriangle className="h-3 w-3" />
              Contains:
            </div>
            <div className="flex flex-wrap gap-0.5">
              {meal.allergen_display?.slice(0, 3).map((allergen, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="text-[10px] px-1 py-0 bg-amber-50 text-amber-700 border-amber-200"
                >
                  {allergen}
                </Badge>
              ))}
              {(meal.allergen_display?.length || 0) > 3 && (
                <Badge variant="outline" className="text-[10px] px-1 py-0">
                  +{(meal.allergen_display?.length || 0) - 3}
                </Badge>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-green-600 text-xs mb-2">
            <CheckCircle className="h-3 w-3" />
            Allergen-free
          </div>
        )}

        {/* Diet & Availability Badges */}
        <div className="flex flex-wrap gap-1">
          {(meal.meal_type === "vegetarian" || meal.meal_type === "vegan") && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 text-green-600 border-green-200 bg-green-50">
              <Leaf className="h-2.5 w-2.5 mr-0.5" />
              {meal.meal_type === "vegan" ? "Vegan" : "Veg"}
            </Badge>
          )}
          {!meal.is_available && <Badge variant="secondary" className="text-[10px] px-1 py-0">Unavailable</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}
