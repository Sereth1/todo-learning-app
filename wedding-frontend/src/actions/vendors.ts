"use server";

import { apiRequest } from "./api";
import type {
  VendorCategory,
  VendorCategoryListItem,
  Vendor,
  VendorListItem,
  VendorCreateData,
  VendorImage,
  VendorOffer,
  VendorOfferListItem,
  VendorReview,
  VendorReviewCreateData,
  VendorQuote,
  VendorQuoteCreateData,
  SavedVendor,
  VendorDashboardData,
  VendorFilterOptions,
  VendorFilters,
  VendorCategoryFilters,
} from "@/types";

// ======================
// VENDOR CATEGORIES
// ======================

/**
 * Get vendor categories with backend filtering and sorting.
 * Categories are sorted by: featured first, then sort_order, then name.
 */
export async function getVendorCategories(filters?: VendorCategoryFilters) {
  const params = new URLSearchParams();
  
  if (filters?.category_type && filters.category_type !== "other") {
    params.set("category_type", filters.category_type);
  }
  if (filters?.is_featured) {
    params.set("is_featured", "true");
  }
  if (filters?.search) {
    params.set("search", filters.search);
  }
  if (filters?.compact) {
    params.set("compact", "true");
  }
  
  const query = params.toString();
  const endpoint = `/wedding_planner/vendor-categories/${query ? `?${query}` : ""}`;
  
  return apiRequest<VendorCategory[]>(endpoint);
}

/**
 * Get a single vendor category by ID.
 */
export async function getVendorCategory(id: number) {
  return apiRequest<VendorCategory>(`/wedding_planner/vendor-categories/${id}/`);
}

/**
 * Get category type options for filtering.
 */
export async function getVendorCategoryTypes() {
  return apiRequest<{ value: string; label: string; count: number }[]>(
    "/wedding_planner/vendor-categories/types/"
  );
}

/**
 * Get categories that have at least one active vendor.
 */
export async function getCategoriesWithVendors() {
  return apiRequest<VendorCategory[]>(
    "/wedding_planner/vendor-categories/with-vendors/"
  );
}

/**
 * Create a new vendor category.
 */
export async function createVendorCategory(data: Partial<VendorCategory>) {
  return apiRequest<VendorCategory>("/wedding_planner/vendor-categories/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ======================
// VENDORS
// ======================

/**
 * Get vendors with backend filtering and sorting.
 * ALL filtering is done on backend - frontend just passes query params.
 */
export async function getVendors(filters?: VendorFilters) {
  const params = new URLSearchParams();
  
  if (filters?.category) {
    params.set("category", filters.category.toString());
  }
  if (filters?.category_slug) {
    params.set("category_slug", filters.category_slug);
  }
  if (filters?.category_type) {
    params.set("category_type", filters.category_type);
  }
  if (filters?.city) {
    params.set("city", filters.city);
  }
  if (filters?.country) {
    params.set("country", filters.country);
  }
  if (filters?.price_range) {
    params.set("price_range", filters.price_range);
  }
  if (filters?.min_price) {
    params.set("min_price", filters.min_price.toString());
  }
  if (filters?.max_price) {
    params.set("max_price", filters.max_price.toString());
  }
  if (filters?.is_verified) {
    params.set("is_verified", "true");
  }
  if (filters?.is_featured) {
    params.set("is_featured", "true");
  }
  if (filters?.is_eco_friendly) {
    params.set("is_eco_friendly", "true");
  }
  if (filters?.booking_status) {
    params.set("booking_status", filters.booking_status);
  }
  if (filters?.rating_min) {
    params.set("rating_min", filters.rating_min.toString());
  }
  if (filters?.search) {
    params.set("search", filters.search);
  }
  if (filters?.sort_by) {
    params.set("sort_by", filters.sort_by);
  }
  
  const query = params.toString();
  const endpoint = `/wedding_planner/vendors/${query ? `?${query}` : ""}`;
  
  return apiRequest<VendorListItem[]>(endpoint);
}

/**
 * Get a single vendor by ID with full details.
 */
export async function getVendor(id: number) {
  return apiRequest<Vendor>(`/wedding_planner/vendors/${id}/`);
}

/**
 * Get vendor dashboard data - single API call for dashboard.
 * Returns categories, featured vendors, and stats.
 */
export async function getVendorDashboard() {
  return apiRequest<VendorDashboardData>(
    "/wedding_planner/vendors/dashboard/"
  );
}

/**
 * Get vendors by category slug.
 */
export async function getVendorsByCategory(slug: string) {
  return apiRequest<{
    category: VendorCategory;
    vendors: VendorListItem[];
    count: number;
  }>(`/wedding_planner/vendors/by-category/${slug}/`);
}

/**
 * Get vendors near a location.
 */
export async function getNearbyVendors(
  latitude: number,
  longitude: number,
  radiusKm: number = 50
) {
  return apiRequest<VendorListItem[]>(
    `/wedding_planner/vendors/nearby/?latitude=${latitude}&longitude=${longitude}&radius=${radiusKm}`
  );
}

/**
 * Get list of cities with vendor counts.
 */
export async function getVendorCities() {
  return apiRequest<{ city: string; country: string; count: number }[]>(
    "/wedding_planner/vendors/cities/"
  );
}

/**
 * Get all filter options for the vendor list page.
 */
export async function getVendorFilterOptions() {
  return apiRequest<VendorFilterOptions>(
    "/wedding_planner/vendors/filter-options/"
  );
}

/**
 * Create a new vendor.
 */
export async function createVendor(data: VendorCreateData) {
  // Handle file upload if present
  if (data.primary_image instanceof File) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });
    
    return apiRequest<Vendor>("/wedding_planner/vendors/", {
      method: "POST",
      body: formData,
      headers: {}, // Let browser set content-type for FormData
    });
  }
  
  return apiRequest<Vendor>("/wedding_planner/vendors/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update a vendor.
 */
export async function updateVendor(id: number, data: Partial<VendorCreateData>) {
  return apiRequest<Vendor>(`/wedding_planner/vendors/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * Delete a vendor.
 */
export async function deleteVendor(id: number) {
  return apiRequest<void>(`/wedding_planner/vendors/${id}/`, {
    method: "DELETE",
  });
}

// ======================
// VENDOR IMAGES
// ======================

/**
 * Get vendor images.
 */
export async function getVendorImages(vendorId: number, imageType?: string) {
  const params = new URLSearchParams();
  params.set("vendor", vendorId.toString());
  if (imageType) {
    params.set("image_type", imageType);
  }
  
  return apiRequest<VendorImage[]>(
    `/wedding_planner/vendor-images/?${params.toString()}`
  );
}

/**
 * Upload a vendor image.
 */
export async function uploadVendorImage(
  vendorId: number,
  image: File,
  imageType: string = "gallery",
  caption: string = ""
) {
  const formData = new FormData();
  formData.append("vendor", vendorId.toString());
  formData.append("image", image);
  formData.append("image_type", imageType);
  formData.append("caption", caption);
  
  return apiRequest<VendorImage>("/wedding_planner/vendor-images/", {
    method: "POST",
    body: formData,
    headers: {},
  });
}

/**
 * Delete a vendor image.
 */
export async function deleteVendorImage(id: number) {
  return apiRequest<void>(`/wedding_planner/vendor-images/${id}/`, {
    method: "DELETE",
  });
}

// ======================
// VENDOR OFFERS
// ======================

/**
 * Get vendor offers/packages.
 */
export async function getVendorOffers(
  vendorId?: number,
  options?: { offer_type?: string; is_featured?: boolean; compact?: boolean }
) {
  const params = new URLSearchParams();
  if (vendorId) {
    params.set("vendor", vendorId.toString());
  }
  if (options?.offer_type) {
    params.set("offer_type", options.offer_type);
  }
  if (options?.is_featured) {
    params.set("is_featured", "true");
  }
  if (options?.compact) {
    params.set("compact", "true");
  }
  
  const query = params.toString();
  const endpoint = `/wedding_planner/vendor-offers/${query ? `?${query}` : ""}`;
  
  return options?.compact
    ? apiRequest<VendorOfferListItem[]>(endpoint)
    : apiRequest<VendorOffer[]>(endpoint);
}

/**
 * Get a single vendor offer.
 */
export async function getVendorOffer(id: number) {
  return apiRequest<VendorOffer>(`/wedding_planner/vendor-offers/${id}/`);
}

/**
 * Create a vendor offer.
 */
export async function createVendorOffer(data: Partial<VendorOffer>) {
  return apiRequest<VendorOffer>("/wedding_planner/vendor-offers/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update a vendor offer.
 */
export async function updateVendorOffer(id: number, data: Partial<VendorOffer>) {
  return apiRequest<VendorOffer>(`/wedding_planner/vendor-offers/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * Delete a vendor offer.
 */
export async function deleteVendorOffer(id: number) {
  return apiRequest<void>(`/wedding_planner/vendor-offers/${id}/`, {
    method: "DELETE",
  });
}

// ======================
// VENDOR REVIEWS
// ======================

/**
 * Get vendor reviews.
 */
export async function getVendorReviews(
  vendorId?: number,
  options?: { rating?: number; mine?: boolean; sort_by?: string }
) {
  const params = new URLSearchParams();
  if (vendorId) {
    params.set("vendor", vendorId.toString());
  }
  if (options?.rating) {
    params.set("rating", options.rating.toString());
  }
  if (options?.mine) {
    params.set("mine", "true");
  }
  if (options?.sort_by) {
    params.set("sort_by", options.sort_by);
  }
  
  const query = params.toString();
  return apiRequest<VendorReview[]>(
    `/wedding_planner/vendor-reviews/${query ? `?${query}` : ""}`
  );
}

/**
 * Create a vendor review.
 */
export async function createVendorReview(data: VendorReviewCreateData) {
  return apiRequest<VendorReview>("/wedding_planner/vendor-reviews/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update a vendor review.
 */
export async function updateVendorReview(id: number, data: Partial<VendorReviewCreateData>) {
  return apiRequest<VendorReview>(`/wedding_planner/vendor-reviews/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * Delete a vendor review.
 */
export async function deleteVendorReview(id: number) {
  return apiRequest<void>(`/wedding_planner/vendor-reviews/${id}/`, {
    method: "DELETE",
  });
}

/**
 * Mark a review as helpful.
 */
export async function markReviewHelpful(id: number) {
  return apiRequest<{ helpful_count: number }>(
    `/wedding_planner/vendor-reviews/${id}/helpful/`,
    { method: "POST" }
  );
}

// ======================
// VENDOR QUOTES
// ======================

/**
 * Get user's vendor quotes.
 */
export async function getVendorQuotes(vendorId?: number, status?: string) {
  const params = new URLSearchParams();
  if (vendorId) {
    params.set("vendor", vendorId.toString());
  }
  if (status && status !== "all") {
    params.set("status", status);
  }
  
  const query = params.toString();
  return apiRequest<VendorQuote[]>(
    `/wedding_planner/vendor-quotes/${query ? `?${query}` : ""}`
  );
}

/**
 * Get a single vendor quote.
 */
export async function getVendorQuote(id: number) {
  return apiRequest<VendorQuote>(`/wedding_planner/vendor-quotes/${id}/`);
}

/**
 * Request a quote from a vendor.
 */
export async function requestVendorQuote(data: VendorQuoteCreateData) {
  return apiRequest<VendorQuote>("/wedding_planner/vendor-quotes/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update a vendor quote.
 */
export async function updateVendorQuote(id: number, data: Partial<VendorQuote>) {
  return apiRequest<VendorQuote>(`/wedding_planner/vendor-quotes/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ======================
// SAVED VENDORS
// ======================

/**
 * Get user's saved vendors.
 */
export async function getSavedVendors(categoryId?: number) {
  const params = new URLSearchParams();
  if (categoryId) {
    params.set("category", categoryId.toString());
  }
  
  const query = params.toString();
  return apiRequest<SavedVendor[]>(
    `/wedding_planner/saved-vendors/${query ? `?${query}` : ""}`
  );
}

/**
 * Save a vendor.
 */
export async function saveVendor(vendorId: number, notes: string = "") {
  return apiRequest<SavedVendor>("/wedding_planner/saved-vendors/", {
    method: "POST",
    body: JSON.stringify({ vendor: vendorId, notes }),
  });
}

/**
 * Unsave a vendor.
 */
export async function unsaveVendor(id: number) {
  return apiRequest<void>(`/wedding_planner/saved-vendors/${id}/`, {
    method: "DELETE",
  });
}

/**
 * Toggle save/unsave a vendor.
 */
export async function toggleSaveVendor(vendorId: number, notes: string = "") {
  return apiRequest<{ saved: boolean; message: string; data?: SavedVendor }>(
    "/wedding_planner/saved-vendors/toggle/",
    {
      method: "POST",
      body: JSON.stringify({ vendor: vendorId, notes }),
    }
  );
}

/**
 * Check if a vendor is saved.
 */
export async function checkVendorSaved(vendorId: number) {
  return apiRequest<{ saved: boolean }>(
    `/wedding_planner/saved-vendors/check/${vendorId}/`
  );
}
