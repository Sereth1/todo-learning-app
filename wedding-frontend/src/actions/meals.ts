"use server";

import { authFetch } from "./auth";
import { getCurrentWeddingId } from "./wedding-core";
import type { MealChoice } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// ==============================
// Meal Filters
// ==============================

export interface MealTypeFilter {
  value: string;
  label: string;
  count: number;
}

export interface MealFiltersResponse {
  meal_types: MealTypeFilter[];
  total_count: number;
}

export async function getMealFilters(): Promise<MealFiltersResponse | null> {
  try {
    const weddingId = await getCurrentWeddingId();
    if (!weddingId) return null;

    const response = await authFetch(`${API_URL}/wedding_planner/meal-choices/filters/?wedding=${weddingId}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// ==============================
// Meal Choices
// ==============================

export async function getMealChoices(mealType?: string): Promise<MealChoice[]> {
  try {
    const weddingId = await getCurrentWeddingId();
    if (!weddingId) return [];

    let url = `${API_URL}/wedding_planner/meal-choices/?wedding=${weddingId}`;
    if (mealType && mealType !== "all") {
      url += `&meal_type=${mealType}`;
    }

    const response = await authFetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return data.results || data || [];
  } catch {
    return [];
  }
}

export async function createMealChoice(
  data: Partial<MealChoice>,
  imageFile?: File | null
): Promise<{ success: boolean; meal?: MealChoice; error?: string }> {
  try {
    const weddingId = await getCurrentWeddingId();
    if (!weddingId) return { success: false, error: "No wedding selected" };

    // Use FormData if there's an image, otherwise use JSON
    if (imageFile) {
      const formData = new FormData();
      formData.append("name", data.name || "");
      formData.append("description", data.description || "");
      formData.append("meal_type", data.meal_type || "meat");
      formData.append("is_available", String(data.is_available ?? true));
      formData.append("wedding", String(weddingId));
      formData.append("image", imageFile);

      if (data.contains_allergens) {
        formData.append("contains_allergens", JSON.stringify(data.contains_allergens));
      }

      const response = await authFetch(`${API_URL}/wedding_planner/meal-choices/`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return { success: false, error: error.detail || "Failed to create meal" };
      }

      const meal = await response.json();
      return { success: true, meal };
    }

    // No image - use regular JSON
    const response = await authFetch(`${API_URL}/wedding_planner/meal-choices/`, {
      method: "POST",
      body: JSON.stringify({
        ...data,
        wedding: weddingId,
        contains_allergens: data.contains_allergens || [],
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.detail || "Failed to create meal" };
    }

    const meal = await response.json();
    return { success: true, meal };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function deleteMealChoice(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await authFetch(`${API_URL}/wedding_planner/meal-choices/${id}/`, {
      method: "DELETE",
    });

    if (!response.ok && response.status !== 204) {
      return { success: false, error: "Failed to delete meal" };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function updateMealClientStatus(
  mealId: number,
  status: "pending" | "approved" | "declined",
  declineReason?: string
): Promise<{ success: boolean; meal?: MealChoice; error?: string }> {
  try {
    const response = await authFetch(`${API_URL}/wedding_planner/meal-choices/${mealId}/update-status/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_status: status,
        client_decline_reason: declineReason || "",
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.error || error.detail || "Failed to update status" };
    }

    const meal = await response.json();
    return { success: true, meal };
  } catch {
    return { success: false, error: "Network error" };
  }
}

// ==============================
// Public Meal Choices (no auth)
// ==============================

export async function getMealChoicesByGuestCode(guestCode: string): Promise<MealChoice[]> {
  try {
    const response = await fetch(`${API_URL}/wedding_planner/meal-choices/by-guest-code/${guestCode}/`);
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}
