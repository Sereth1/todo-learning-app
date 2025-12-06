"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  getRestaurantMeals,
  getRestaurantMealFilters,
  createRestaurantMeal,
  updateRestaurantMeal,
  deleteRestaurantMeal,
} from "@/actions/restaurant";
import type { RestaurantMeal, RestaurantMealCreateData, AllergenType, RestaurantMealFilters } from "@/types";

const DEFAULT_FORM_DATA: RestaurantMealCreateData = {
  name: "",
  description: "",
  meal_type: "meat",
  contains_allergens: [],
  is_available: true,
};

export interface MealFiltersState {
  meal_type: string;
  restaurant_status: string;
  client_status: string;
  created_by: string;
}

const DEFAULT_FILTERS: MealFiltersState = {
  meal_type: "all",
  restaurant_status: "all",
  client_status: "all",
  created_by: "all",
};

export function useRestaurantMeals(accessCode: string) {
  // State
  const [meals, setMeals] = useState<RestaurantMeal[]>([]);
  const [filters, setFilters] = useState<RestaurantMealFilters | null>(null);
  const [activeFilters, setActiveFilters] = useState<MealFiltersState>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<RestaurantMeal | null>(null);
  const [formData, setFormData] = useState<RestaurantMealCreateData>(DEFAULT_FORM_DATA);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load filters
  const loadFilters = useCallback(async () => {
    const result = await getRestaurantMealFilters(accessCode);
    if (result.success && result.data) {
      setFilters(result.data);
    }
  }, [accessCode]);

  // Load meals with active filters
  const loadMeals = useCallback(async () => {
    setIsLoading(true);
    const result = await getRestaurantMeals(accessCode, activeFilters);
    if (result.success && result.data) {
      setMeals(result.data);
    } else {
      toast.error(result.error || "Failed to load meals");
    }
    setIsLoading(false);
  }, [accessCode, activeFilters]);

  // Load both on mount
  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    loadMeals();
  }, [loadMeals]);

  // Update filter
  const updateFilter = useCallback(<K extends keyof MealFiltersState>(
    key: K,
    value: MealFiltersState[K]
  ) => {
    setActiveFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setActiveFilters(DEFAULT_FILTERS);
  }, []);

  // Form helpers
  const resetForm = useCallback(() => {
    setFormData(DEFAULT_FORM_DATA);
    setEditingMeal(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const openDialog = useCallback((meal?: RestaurantMeal) => {
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
  }, [resetForm]);

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    resetForm();
  }, [resetForm]);

  const handleDialogChange = useCallback((open: boolean) => {
    setIsDialogOpen(open);
    if (!open) resetForm();
  }, [resetForm]);

  // Type-safe form field updater
  const updateFormField = useCallback(<K extends keyof RestaurantMealCreateData>(
    field: K,
    value: RestaurantMealCreateData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Image handling
  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error("Image must be less than 1MB");
        return;
      }
      setFormData(prev => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  }, []);

  const clearImage = useCallback(() => {
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image: undefined }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  // Allergen toggle
  const toggleAllergen = useCallback((allergen: AllergenType) => {
    setFormData(prev => {
      const current = prev.contains_allergens || [];
      if (current.includes(allergen)) {
        return { ...prev, contains_allergens: current.filter(a => a !== allergen) };
      } else {
        return { ...prev, contains_allergens: [...current, allergen] };
      }
    });
  }, []);

  // CRUD operations
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
          await Promise.all([loadMeals(), loadFilters()]);
          closeDialog();
        } else {
          toast.error(result.error || "Failed to update meal");
        }
      } else {
        const result = await createRestaurantMeal(accessCode, formData);
        if (result.success) {
          toast.success("Meal suggestion sent to couple for approval");
          await Promise.all([loadMeals(), loadFilters()]);
          closeDialog();
        } else {
          toast.error(result.error || "Failed to create meal");
        }
      }
    } finally {
      setIsSaving(false);
    }
  }, [accessCode, editingMeal, formData, loadMeals, loadFilters, closeDialog]);

  const handleDelete = useCallback(async (meal: RestaurantMeal) => {
    if (!confirm(`Delete "${meal.name}"?`)) return;

    const result = await deleteRestaurantMeal(accessCode, meal.id);
    if (result.success) {
      toast.success("Meal deleted");
      await Promise.all([loadMeals(), loadFilters()]);
    } else {
      toast.error(result.error || "Failed to delete meal");
    }
  }, [accessCode, loadMeals, loadFilters]);

  // Group meals by type
  const groupedMeals = meals.reduce((acc, meal) => {
    const type = meal.meal_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(meal);
    return acc;
  }, {} as Record<string, RestaurantMeal[]>);

  return {
    // State
    meals,
    groupedMeals,
    filters,
    activeFilters,
    isLoading,
    isSaving,
    isDialogOpen,
    editingMeal,
    formData,
    imagePreview,
    fileInputRef,
    
    // Actions
    loadMeals,
    loadFilters,
    updateFilter,
    resetFilters,
    openDialog,
    closeDialog,
    handleDialogChange,
    updateFormField,
    handleImageChange,
    clearImage,
    toggleAllergen,
    handleSubmit,
    handleDelete,
  };
}
