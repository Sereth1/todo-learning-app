import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getMealChoices, getMealFilters, createMealChoice, deleteMealChoice } from "@/actions/wedding";
import type { MealTypeFilter } from "@/actions/wedding";
import { toast } from "sonner";
import type { MealChoice, AllergenType } from "@/types";

export type MealType = "meat" | "fish" | "poultry" | "vegetarian" | "vegan" | "kids";

// Still export these for components that need display labels (like AddMealDialog, MealCard)
export const mealTypes: MealType[] = ["meat", "fish", "poultry", "vegetarian", "vegan", "kids"];

export const mealTypeLabels: Record<MealType, string> = {
  meat: "Meat",
  fish: "Fish",
  poultry: "Poultry",
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  kids: "Kids Menu",
};

export interface MealFormData {
  name: string;
  description: string;
  meal_type: MealType;
  contains_allergens: AllergenType[];
  image: File | null;
  is_available: boolean;
}

const initialFormData: MealFormData = {
  name: "",
  description: "",
  meal_type: "meat",
  contains_allergens: [],
  image: null,
  is_available: true,
};

export function useMeals() {
  const { wedding } = useAuth();
  const [meals, setMeals] = useState<MealChoice[]>([]);
  const [mealTypeFilters, setMealTypeFilters] = useState<MealTypeFilter[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<MealFormData>(initialFormData);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; meal: MealChoice | null }>({
    open: false,
    meal: null,
  });

  // Load filters from backend
  const loadFilters = useCallback(async () => {
    if (!wedding) return;
    const filtersData = await getMealFilters();
    if (filtersData) {
      setMealTypeFilters(filtersData.meal_types);
      setTotalCount(filtersData.total_count);
    }
  }, [wedding]);

  // Load meals with optional filter
  const loadMeals = useCallback(async (mealType?: string) => {
    if (!wedding) return;
    setIsLoading(true);
    const data = await getMealChoices(mealType);
    setMeals(data);
    setIsLoading(false);
  }, [wedding]);

  // Initial load - filters and meals
  useEffect(() => {
    if (!wedding) return;
    loadFilters();
    loadMeals();
  }, [wedding, loadFilters, loadMeals]);

  // Change active filter and reload meals
  const changeFilter = useCallback(async (filter: string) => {
    setActiveFilter(filter);
    await loadMeals(filter === "all" ? undefined : filter);
  }, [loadMeals]);

  // Form handlers
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const setMealType = useCallback((type: MealType) => {
    setFormData(prev => ({ ...prev, meal_type: type }));
  }, []);

  const setAllergens = useCallback((allergens: AllergenType[]) => {
    setFormData(prev => ({ ...prev, contains_allergens: allergens }));
  }, []);

  const toggleAllergen = useCallback((allergen: AllergenType) => {
    setFormData(prev => ({
      ...prev,
      contains_allergens: prev.contains_allergens.includes(allergen)
        ? prev.contains_allergens.filter(a => a !== allergen)
        : [...prev.contains_allergens, allergen]
    }));
  }, []);

  const setImage = useCallback((file: File | null) => {
    if (file && file.size > 1024 * 1024) {
      toast.error("Image must be less than 1MB");
      return;
    }
    setFormData(prev => ({ ...prev, image: file }));
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
      contains_allergens: formData.contains_allergens,
      is_available: formData.is_available,
    }, formData.image);

    if (result.success && result.meal) {
      // Reload both meals and filters to get updated counts
      await Promise.all([loadMeals(activeFilter === "all" ? undefined : activeFilter), loadFilters()]);
      toast.success("Meal option added!");
      setShowAddDialog(false);
      resetForm();
    } else {
      toast.error(result.error || "Failed to add meal option");
    }
  }, [formData, resetForm, loadMeals, loadFilters, activeFilter]);

  const handleDelete = useCallback(async () => {
    if (!deleteModal.meal) return;
    
    const result = await deleteMealChoice(deleteModal.meal.id);
    if (result.success) {
      // Reload both meals and filters to get updated counts
      await Promise.all([loadMeals(activeFilter === "all" ? undefined : activeFilter), loadFilters()]);
      toast.success("Meal option deleted");
    } else {
      toast.error(result.error || "Failed to delete meal");
    }
    setDeleteModal({ open: false, meal: null });
  }, [deleteModal.meal, loadMeals, loadFilters, activeFilter]);

  const openDeleteModal = useCallback((meal: MealChoice) => {
    setDeleteModal({ open: true, meal });
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeleteModal({ open: false, meal: null });
  }, []);

  // Refresh meals and filters after status changes
  const refresh = useCallback(async () => {
    await Promise.all([
      loadMeals(activeFilter === "all" ? undefined : activeFilter),
      loadFilters()
    ]);
  }, [loadMeals, loadFilters, activeFilter]);

  return {
    meals,
    mealTypeFilters,
    totalCount,
    activeFilter,
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
    setAllergens,
    toggleAllergen,
    setImage,
    changeFilter,
    refresh,
  };
}
