// Meal Types

export interface DietaryRestriction {
  id: number;
  name: string;
  description?: string;
}

export type MealRequestStatus = "pending" | "approved" | "declined";
export type MealCreatedBy = "client" | "restaurant";

export interface GuestMealSelectionSummary {
  meal_name: string;
  meal_type: string;
  meal_type_display: string;
}

export interface MealChoice {
  id: number;
  uid?: string;
  name: string;
  description: string;
  meal_type: "meat" | "fish" | "poultry" | "vegetarian" | "vegan" | "kids";
  contains_allergens: string[];
  allergen_display: string[];
  is_allergen_free: boolean;
  allergen_choices?: { value: string; label: string }[];
  image?: string;
  image_url?: string | null;
  is_available: boolean;
  max_quantity?: number;
  // Who created this meal
  created_by: MealCreatedBy;
  created_by_display?: string;
  // Two-way approval
  restaurant_status: MealRequestStatus;
  restaurant_status_display?: string;
  restaurant_decline_reason?: string;
  restaurant_status_updated_at?: string;
  client_status: MealRequestStatus;
  client_status_display?: string;
  client_decline_reason?: string;
  client_status_updated_at?: string;
  // Overall status (computed)
  overall_status: MealRequestStatus;
  needs_restaurant_approval: boolean;
  needs_client_approval: boolean;
  // Legacy fields
  request_status: MealRequestStatus;
  request_status_display?: string;
  decline_reason?: string;
  status_updated_at?: string;
}

export type AllergenType =
  | "nuts" | "peanuts" | "tree_nuts" | "gluten" | "dairy"
  | "eggs" | "shellfish" | "fish" | "soy" | "sesame"
  | "mushrooms" | "celery" | "mustard" | "sulfites" | "lupin" | "molluscs";

export const ALLERGEN_OPTIONS: { value: AllergenType; label: string }[] = [
  { value: "nuts", label: "Nuts" },
  { value: "peanuts", label: "Peanuts" },
  { value: "tree_nuts", label: "Tree Nuts" },
  { value: "gluten", label: "Gluten" },
  { value: "dairy", label: "Dairy" },
  { value: "eggs", label: "Eggs" },
  { value: "shellfish", label: "Shellfish" },
  { value: "fish", label: "Fish" },
  { value: "soy", label: "Soy" },
  { value: "sesame", label: "Sesame" },
  { value: "mushrooms", label: "Mushrooms" },
  { value: "celery", label: "Celery" },
  { value: "mustard", label: "Mustard" },
  { value: "sulfites", label: "Sulfites" },
  { value: "lupin", label: "Lupin" },
  { value: "molluscs", label: "Molluscs" },
];

export interface GuestMealSelection {
  id: number;
  guest: number;
  meal_choice: number;
  dietary_restrictions?: number[];
}
