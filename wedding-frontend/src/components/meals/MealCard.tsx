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
import { MoreHorizontal, Trash2, Leaf, Beef, Fish, UtensilsCrossed, Baby } from "lucide-react";
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-rose-50">
              <Icon className="h-5 w-5 text-rose-500" />
            </div>
            <div>
              <CardTitle className="text-base">{meal.name}</CardTitle>
              <Badge variant="outline" className="mt-1 text-xs">
                {mealTypeLabels[meal.meal_type as MealType] || meal.meal_type}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
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
      <CardContent>
        {meal.description && (
          <p className="text-sm text-gray-500 mb-3">{meal.description}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {(meal.meal_type === "vegetarian" || meal.meal_type === "vegan") && (
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
              <Leaf className="h-3 w-3 mr-1" />
              {meal.meal_type === "vegan" ? "Vegan" : "Vegetarian"}
            </Badge>
          )}
          {!meal.is_available && <Badge variant="secondary">Unavailable</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}
