"use client";

import type { MealChoice } from "@/types";
import { MealCard } from "./MealCard";

interface MealGridProps {
  meals: MealChoice[];
  onDelete: (meal: MealChoice) => void;
}

export function MealGrid({ meals, onDelete }: MealGridProps) {
  if (meals.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No items in this category
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {meals.map((meal) => (
        <MealCard key={meal.id} meal={meal} onDelete={onDelete} />
      ))}
    </div>
  );
}
