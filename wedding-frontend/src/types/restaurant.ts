/**
 * Restaurant Portal Types
 */

import type { MealCreatedBy, MealRequestStatus } from "./meal";

export interface RestaurantAccessToken {
  id: number;
  uid: string;
  access_code: string;
  access_url: string;
  name: string;
  restaurant_name: string;
  contact_email: string;
  contact_phone: string;
  can_manage_tables: boolean;
  can_manage_meals: boolean;
  can_view_guest_count: boolean;
  is_active: boolean;
  is_valid: boolean;
  is_expired: boolean;
  expires_at: string | null;
  last_accessed_at: string | null;
  access_count: number;
  notes: string;
  created_at: string;
}

export interface RestaurantAccessTokenCreateData {
  name: string;
  restaurant_name?: string;
  contact_email?: string;
  contact_phone?: string;
  can_manage_tables?: boolean;
  can_manage_meals?: boolean;
  can_view_guest_count?: boolean;
  days_valid?: number;
  notes?: string;
}

export interface RestaurantPortalInfo {
  wedding_name: string;
  wedding_date: string | null;
  token_name: string;
  can_manage_tables: boolean;
  can_manage_meals: boolean;
  can_view_guest_count: boolean;
  confirmed_guest_count?: number;
}

export interface RestaurantPortalSummary {
  wedding_name: string;
  wedding_date: string | null;
  tables?: {
    count: number;
    total_capacity: number;
    total_seats_taken: number;
  };
  meals?: {
    count: number;
    by_type: Record<string, number>;
  };
  guests?: {
    confirmed: number;
    pending: number;
  };
}

export interface RestaurantTable {
  id: number;
  uid: string;
  table_number: number;
  name: string;
  capacity: number;
  location: string;
  notes: string;
  is_vip: boolean;
  table_category: string;
  table_category_display: string;
  seats_taken: number;
  seats_available: number;
  is_full: boolean;
  created_at: string;
  updated_at: string;
}

export interface RestaurantTableCreateData {
  table_number?: number;
  name: string;
  capacity: number;
  location?: string;
  notes?: string;
  is_vip?: boolean;
}

export interface RestaurantMeal {
  id: number;
  uid: string;
  name: string;
  description: string;
  meal_type: "meat" | "fish" | "poultry" | "vegetarian" | "vegan" | "kids";
  meal_type_display: string;
  contains_allergens: string[];
  allergen_display: string[];
  is_allergen_free: boolean;
  image: string | null;
  image_url: string | null;
  is_available: boolean;
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
  created_at: string;
  updated_at: string;
}

export interface RestaurantMealFilter {
  value: string;
  label: string;
  count: number;
}

export interface RestaurantMealFilters {
  meal_types: RestaurantMealFilter[];
  restaurant_statuses: RestaurantMealFilter[];
  client_statuses: RestaurantMealFilter[];
  created_by: RestaurantMealFilter[];
}

export interface RestaurantMealCreateData {
  name: string;
  description?: string;
  meal_type: "meat" | "fish" | "poultry" | "vegetarian" | "vegan" | "kids";
  contains_allergens?: string[];
  image?: File;
  is_available?: boolean;
}
