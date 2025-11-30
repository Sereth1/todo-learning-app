import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getMealChoices, createMealChoice, deleteMealChoice } from "@/actions/wedding";
import { toast } from "sonner";
import type { MealChoice } from "@/types";

export type MealType = "meat" | "fish" | "poultry" | "vegetarian" | "vegan" | "kids";

export interface MealFormData {
  name: string;
  description: string;
  meal_type: MealType;
  is_available: boolean;
}

const initialFormData: MealFormData = {
  name: "",
  description: "",
  meal_type: "meat",
  is_available: true,
};

export const mealTypes: MealType[] = ["meat", "fish", "poultry", "vegetarian", "vegan", "kids"];

export const mealTypeLabels: Record<MealType, string> = {
  meat: "Meat",
  fish: "Fish",
  poultry: "Poultry",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  kids: "Kids Menu",
};

export function useMeals() {
  const { wedding } = useAuth();
  const [meals, setMeals] = useState<MealChoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<MealFormData>(initialFormData);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; meal: MealChoice | null }>({
    open: false,
    meal: null,
  });

  // Load meals
  useEffect(() => {
    const loadMeals = async () => {
      if (!wedding) return;
      setIsLoading(true);
      const data = await getMealChoices();
      setMeals(data);
      setIsLoading(false);
    };
    loadMeals();
  }, [wedding]);

  // Form handlers
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const setMealType = useCallback((type: MealType) => {
    setFormData(prev => ({ ...prev, meal_type: type }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
  }, []);

  // CRUD operations
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error("Please enter a meal name");
      return;
    }

    const result = await createMealChoice({
      name: formData.name,
      description: formData.description || "",
      meal_type: formData.meal_type,
      is_available: formData.is_available,
    });

    if (result.success && result.meal) {
      setMeals(prev => [...prev, result.meal!]);
      toast.success("Meal option added!");
      setShowAddDialog(false);
      resetForm();
    } else {
      toast.error(result.error || "Failed to add meal option");
    }
  }, [formData, resetForm]);

  const handleDelete = useCallback(async () => {
    if (!deleteModal.meal) return;
    
    const result = await deleteMealChoice(deleteModal.meal.id);
    if (result.success) {
      setMeals(prev => prev.filter(m => m.id !== deleteModal.meal!.id));
      toast.success("Meal option deleted");
    } else {
      toast.error(result.error || "Failed to delete meal");
    }
    setDeleteModal({ open: false, meal: null });
  }, [deleteModal.meal]);

  const openDeleteModal = useCallback((meal: MealChoice) => {
    setDeleteModal({ open: true, meal });
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeleteModal({ open: false, meal: null });
  }, []);

  // Helper functions
  const getMealsByType = useCallback((type: MealType) => {
    return meals.filter(m => m.meal_type === type);
  }, [meals]);

  return {
    meals,
    isLoading,
    formData,
    showAddDialog,
    setShowAddDialog,
    deleteModal,
    handleChange,
    handleSubmit,
    handleDelete,
    openDeleteModal,
    closeDeleteModal,
    setMealType,
    getMealsByType,
  };
}
