/**
 * Registry Types and Constants
 * Separated from server actions since "use server" files can only export async functions
 */

// =============================================================================
// Types
// =============================================================================

export interface RegistryItem {
  id: number;
  name: string;
  description: string;
  image_url: string | null;
  external_url: string;
  price: number | null;
  currency: string;
  price_display: string | null;
  category: string;
  priority: string;
  display_order: number;
  is_claimed: boolean;
  claimed_by_name: string | null;
  claimed_at: string | null;
  is_group_gift: boolean;
  group_gift_collected: number;
  group_gift_percentage: number;
  is_available: boolean;
  is_visible: boolean;
  is_fulfilled: boolean;
  quantity_requested: number;
  quantity_received: number;
  // Public serializer extras
  is_mine?: boolean;
  can_claim?: boolean;
}

export interface GiftRegistry {
  id: number;
  wedding: number;
  title: string;
  message: string;
  accept_cash_gifts: boolean;
  cash_fund_title: string;
  cash_fund_description: string;
  cash_fund_goal: number | null;
  is_visible: boolean;
  show_prices: boolean;
  allow_anonymous_claims: boolean;
  total_items: number;
  claimed_items: number;
  available_items: number;
  total_received: number;
}

export interface RegistryStats {
  total_items: number;
  claimed_items: number;
  available_items: number;
  total_value: number;
  claimed_value: number;
  by_category: Record<string, number>;
  by_priority: Record<string, number>;
}

export interface RegistryDashboard {
  registry: GiftRegistry;
  items: RegistryItem[];
  stats: RegistryStats;
}

export interface PublicRegistryInfo {
  title: string;
  message: string;
  show_prices: boolean;
  accept_cash_gifts: boolean;
  cash_fund_title: string;
  cash_fund_description: string;
}

export interface GuestWishlistResponse {
  registry: PublicRegistryInfo | null;
  items: RegistryItem[];
  my_claimed_count: number;
  my_claimed_ids: number[];
  message?: string;
}

export interface RegistryItemCreate {
  wedding?: number;  // Backend uses wedding ID to get/create registry
  name: string;
  description?: string;
  external_url?: string;
  price?: number;
  currency?: string;
  category?: string;
  priority?: string;
  quantity_requested?: number;
  is_group_gift?: boolean;
  is_visible?: boolean;
  display_order?: number;
}

// =============================================================================
// Constants
// =============================================================================

export const ITEM_CATEGORIES = [
  { value: "kitchen", label: "Kitchen" },
  { value: "bedroom", label: "Bedroom" },
  { value: "bathroom", label: "Bathroom" },
  { value: "living_room", label: "Living Room" },
  { value: "dining", label: "Dining" },
  { value: "garden", label: "Garden" },
  { value: "electronics", label: "Electronics" },
  { value: "experiences", label: "Experiences" },
  { value: "honeymoon", label: "Honeymoon" },
  { value: "home_decor", label: "Home Decor" },
  { value: "other", label: "Other" },
] as const;

export const ITEM_PRIORITIES = [
  { value: "high", label: "High Priority" },
  { value: "medium", label: "Medium Priority" },
  { value: "low", label: "Low Priority" },
] as const;

export type ItemCategory = typeof ITEM_CATEGORIES[number]["value"];
export type ItemPriority = typeof ITEM_PRIORITIES[number]["value"];
