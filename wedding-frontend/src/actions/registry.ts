"use server";

import { apiRequest, publicApiRequest } from "./api";

// Re-export types from types file (types can be re-exported from "use server" files)
export type {
  RegistryItem,
  GiftRegistry,
  RegistryStats,
  RegistryDashboard,
  PublicRegistryInfo,
  GuestWishlistResponse,
  RegistryItemCreate,
} from "@/types/registry";

// Import types for use in this file
import type {
  RegistryItem,
  GiftRegistry,
  RegistryStats,
  RegistryDashboard,
  GuestWishlistResponse,
  RegistryItemCreate,
} from "@/types/registry";

// =============================================================================
// Authenticated Endpoints (Dashboard)
// =============================================================================

/**
 * Get or create registry for wedding
 */
export async function getRegistry(weddingId: number) {
  return apiRequest<GiftRegistry>(
    `/wedding_planner/gift-registries/get-or-create/?wedding=${weddingId}`,
    { method: "POST" }
  );
}

/**
 * Update registry settings
 */
export async function updateRegistry(registryId: number, data: Partial<GiftRegistry>) {
  return apiRequest<GiftRegistry>(
    `/wedding_planner/gift-registries/${registryId}/`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}

/**
 * Get registry dashboard (registry + items + stats) with filters
 */
export interface GetRegistryDashboardParams {
  wedding: number;
  category?: string;
  priority?: string;
  status?: string;  // "all" | "available" | "claimed"
  search?: string;
}

export async function getRegistryDashboard(params: GetRegistryDashboardParams) {
  const searchParams = new URLSearchParams();
  searchParams.set("wedding", String(params.wedding));
  
  if (params.category && params.category !== "all") {
    searchParams.set("category", params.category);
  }
  if (params.priority && params.priority !== "all") {
    searchParams.set("priority", params.priority);
  }
  if (params.status && params.status !== "all") {
    searchParams.set("status", params.status);
  }
  if (params.search) {
    searchParams.set("search", params.search);
  }
  
  return apiRequest<RegistryDashboard>(
    `/wedding_planner/registry-items/dashboard/?${searchParams.toString()}`
  );
}

/**
 * Get registry items with filters
 */
export interface GetRegistryItemsParams {
  wedding: number;
  category?: string;
  priority?: string;
  is_claimed?: boolean;
  is_available?: boolean;
  search?: string;
  ordering?: string;
}

export async function getRegistryItems(params: GetRegistryItemsParams) {
  const searchParams = new URLSearchParams();
  searchParams.set("wedding", String(params.wedding));
  
  if (params.category && params.category !== "all") {
    searchParams.set("category", params.category);
  }
  if (params.priority && params.priority !== "all") {
    searchParams.set("priority", params.priority);
  }
  if (params.is_claimed !== undefined) {
    searchParams.set("is_claimed", String(params.is_claimed));
  }
  if (params.is_available !== undefined) {
    searchParams.set("is_available", String(params.is_available));
  }
  if (params.search) {
    searchParams.set("search", params.search);
  }
  if (params.ordering) {
    searchParams.set("ordering", params.ordering);
  }
  
  return apiRequest<RegistryItem[]>(
    `/wedding_planner/registry-items/?${searchParams.toString()}`
  );
}

/**
 * Create a registry item
 */
export async function createRegistryItem(data: RegistryItemCreate) {
  return apiRequest<RegistryItem>(
    `/wedding_planner/registry-items/`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

/**
 * Create registry item with image upload
 */
export async function createRegistryItemWithImage(formData: FormData) {
  // For multipart form data, don't set Content-Type header
  return apiRequest<RegistryItem>(
    `/wedding_planner/registry-items/`,
    {
      method: "POST",
      body: formData,
      headers: {
        // Remove Content-Type to let browser set it with boundary
      },
    }
  );
}

/**
 * Update a registry item
 */
export async function updateRegistryItem(itemId: number, data: Partial<RegistryItemCreate>) {
  return apiRequest<RegistryItem>(
    `/wedding_planner/registry-items/${itemId}/`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}

/**
 * Delete a registry item
 */
export async function deleteRegistryItem(itemId: number) {
  return apiRequest<void>(
    `/wedding_planner/registry-items/${itemId}/`,
    { method: "DELETE" }
  );
}

/**
 * Get registry items stats
 */
export async function getRegistryStats(weddingId: number) {
  return apiRequest<RegistryStats>(
    `/wedding_planner/registry-items/stats/?wedding=${weddingId}`
  );
}

/**
 * Reorder registry items
 */
export async function reorderRegistryItems(items: Array<{ id: number; display_order: number }>) {
  return apiRequest<{ success: boolean; message: string }>(
    `/wedding_planner/registry-items/reorder/`,
    {
      method: "POST",
      body: JSON.stringify({ items }),
    }
  );
}

// =============================================================================
// Public Endpoints (Guest RSVP Page)
// =============================================================================

/**
 * Get wishlist for guest by code (no auth required)
 */
export async function getGuestWishlist(guestCode: string) {
  return publicApiRequest<GuestWishlistResponse>(
    `/wedding_planner/guest-wishlist/${guestCode}/`
  );
}

/**
 * Guest claims an item
 */
export async function claimWishlistItem(guestCode: string, itemId: number) {
  return publicApiRequest<{
    success: boolean;
    message: string;
    item: RegistryItem;
  }>(
    `/wedding_planner/guest-wishlist/${guestCode}/claim/${itemId}/`,
    { method: "POST" }
  );
}

/**
 * Guest unclaims an item
 */
export async function unclaimWishlistItem(guestCode: string, itemId: number) {
  return publicApiRequest<{
    success: boolean;
    message: string;
    item: RegistryItem;
  }>(
    `/wedding_planner/guest-wishlist/${guestCode}/unclaim/${itemId}/`,
    { method: "POST" }
  );
}
