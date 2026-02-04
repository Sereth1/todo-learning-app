/**
 * Barrel re-export for all types.
 *
 * Domain-specific types live in their own files for maintainability:
 *   - auth.ts       User, AuthTokens, LoginCredentials, RegisterData
 *   - wedding.ts    Wedding, WeddingCreateData
 *   - guest.ts      Guest, GuestCreateData, GuestStats, Child, RSVPFormData, etc.
 *   - event.ts      WeddingEvent
 *   - meal.ts       MealChoice, AllergenType, ALLERGEN_OPTIONS, etc.
 *   - seating.ts    Table, SeatingAssignment, SeatingGuest, SeatingStats
 *   - todo.ts       Todo, TodoListItem, TodoCategory, TodoTemplate, etc.
 *   - notification.ts  Notification, NotificationPreference, etc.
 *   - vendor.ts     Vendor, VendorCategory, VendorOffer, VendorReview, etc.
 *   - restaurant.ts RestaurantAccessToken, RestaurantMeal, RestaurantTable, etc.
 *   - registry.ts   RegistryItem, GiftRegistry, etc. (constants + types)
 *
 * All existing `import { ... } from "@/types"` statements continue to work.
 */

export * from "./auth";
export * from "./wedding";
export * from "./guest";
export * from "./event";
export * from "./meal";
export * from "./seating";
export * from "./todo";
export * from "./notification";
export * from "./vendor";
export * from "./restaurant";
