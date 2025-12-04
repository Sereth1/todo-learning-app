"use server";

/**
 * Restaurant Portal Server Actions
 * 
 * Two sets of actions:
 * 1. For wedding owners - manage access tokens
 * 2. For restaurants - public API with token auth (no login needed)
 */

import { apiRequest, publicApiRequest } from "./api";
import type {
  RestaurantAccessToken,
  RestaurantAccessTokenCreateData,
  RestaurantPortalInfo,
  RestaurantPortalSummary,
  RestaurantTable,
  RestaurantTableCreateData,
  RestaurantMeal,
  RestaurantMealCreateData,
} from "@/types";

// =====================================================
// Wedding Owner Actions - Manage Access Tokens
// =====================================================

/**
 * Get all restaurant access tokens for a wedding
 */
export async function getRestaurantTokens(weddingId: number) {
  return apiRequest<RestaurantAccessToken[]>(
    `/wedding_planner/restaurant-tokens/?wedding=${weddingId}`
  );
}

/**
 * Create a new restaurant access token
 */
export async function createRestaurantToken(
  weddingId: number,
  data: RestaurantAccessTokenCreateData
) {
  return apiRequest<RestaurantAccessToken>("/wedding_planner/restaurant-tokens/", {
    method: "POST",
    body: JSON.stringify({ ...data, wedding: weddingId }),
  });
}

/**
 * Update a restaurant access token
 */
export async function updateRestaurantToken(
  tokenId: number,
  data: Partial<RestaurantAccessTokenCreateData>
) {
  return apiRequest<RestaurantAccessToken>(
    `/wedding_planner/restaurant-tokens/${tokenId}/`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}

/**
 * Delete a restaurant access token
 */
export async function deleteRestaurantToken(tokenId: number) {
  return apiRequest<void>(`/wedding_planner/restaurant-tokens/${tokenId}/`, {
    method: "DELETE",
  });
}

/**
 * Regenerate access code (invalidates old links)
 */
export async function regenerateTokenCode(tokenId: number) {
  return apiRequest<{ message: string; access_code: string; access_url: string }>(
    `/wedding_planner/restaurant-tokens/${tokenId}/regenerate/`,
    { method: "POST" }
  );
}

/**
 * Toggle token active status
 */
export async function toggleTokenActive(tokenId: number) {
  return apiRequest<{ message: string; is_active: boolean }>(
    `/wedding_planner/restaurant-tokens/${tokenId}/toggle/`,
    { method: "POST" }
  );
}

// =====================================================
// Restaurant Portal Actions - Public (Token Auth)
// =====================================================

/**
 * Get portal info for a restaurant access code
 */
export async function getRestaurantPortalInfo(accessCode: string) {
  return publicApiRequest<RestaurantPortalInfo>(
    `/wedding_planner/restaurant-portal/${accessCode}/`
  );
}

/**
 * Get portal summary (tables, meals, guest counts)
 */
export async function getRestaurantPortalSummary(accessCode: string) {
  return publicApiRequest<RestaurantPortalSummary>(
    `/wedding_planner/restaurant-portal/${accessCode}/summary/`
  );
}

// ----- Tables -----

/**
 * Get all tables for a restaurant access code
 */
export async function getRestaurantTables(accessCode: string) {
  return publicApiRequest<RestaurantTable[]>(
    `/wedding_planner/restaurant-portal/${accessCode}/tables/`
  );
}

/**
 * Create a new table
 */
export async function createRestaurantTable(
  accessCode: string,
  data: RestaurantTableCreateData
) {
  return publicApiRequest<RestaurantTable>(
    `/wedding_planner/restaurant-portal/${accessCode}/tables/`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

/**
 * Update a table
 */
export async function updateRestaurantTable(
  accessCode: string,
  tableId: number,
  data: Partial<RestaurantTableCreateData>
) {
  return publicApiRequest<RestaurantTable>(
    `/wedding_planner/restaurant-portal/${accessCode}/tables/${tableId}/`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}

/**
 * Delete a table
 */
export async function deleteRestaurantTable(accessCode: string, tableId: number) {
  return publicApiRequest<void>(
    `/wedding_planner/restaurant-portal/${accessCode}/tables/${tableId}/`,
    { method: "DELETE" }
  );
}

// ----- Meals -----

/**
 * Get all meals for a restaurant access code
 */
export async function getRestaurantMeals(accessCode: string) {
  return publicApiRequest<RestaurantMeal[]>(
    `/wedding_planner/restaurant-portal/${accessCode}/meals/`
  );
}

/**
 * Create a new meal (supports image upload)
 */
export async function createRestaurantMeal(
  accessCode: string,
  data: RestaurantMealCreateData
) {
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("meal_type", data.meal_type);
  
  if (data.description) {
    formData.append("description", data.description);
  }
  if (data.contains_allergens && data.contains_allergens.length > 0) {
    formData.append("contains_allergens", JSON.stringify(data.contains_allergens));
  }
  if (data.image) {
    formData.append("image", data.image);
  }
  if (data.is_available !== undefined) {
    formData.append("is_available", String(data.is_available));
  }

  return publicApiRequest<RestaurantMeal>(
    `/wedding_planner/restaurant-portal/${accessCode}/meals/`,
    {
      method: "POST",
      body: formData,
      // Don't set Content-Type - let browser set it with boundary for FormData
    }
  );
}

/**
 * Update a meal (supports image upload)
 */
export async function updateRestaurantMeal(
  accessCode: string,
  mealId: number,
  data: Partial<RestaurantMealCreateData>
) {
  const formData = new FormData();
  
  if (data.name) {
    formData.append("name", data.name);
  }
  if (data.meal_type) {
    formData.append("meal_type", data.meal_type);
  }
  if (data.description !== undefined) {
    formData.append("description", data.description);
  }
  if (data.contains_allergens) {
    formData.append("contains_allergens", JSON.stringify(data.contains_allergens));
  }
  if (data.image) {
    formData.append("image", data.image);
  }
  if (data.is_available !== undefined) {
    formData.append("is_available", String(data.is_available));
  }

  return publicApiRequest<RestaurantMeal>(
    `/wedding_planner/restaurant-portal/${accessCode}/meals/${mealId}/`,
    {
      method: "PUT",
      body: formData,
    }
  );
}

/**
 * Delete a meal
 */
export async function deleteRestaurantMeal(accessCode: string, mealId: number) {
  return publicApiRequest<void>(
    `/wedding_planner/restaurant-portal/${accessCode}/meals/${mealId}/`,
    { method: "DELETE" }
  );
}
