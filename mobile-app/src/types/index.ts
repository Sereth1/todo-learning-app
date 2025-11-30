// Auth Types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

// Wedding Types
export interface Wedding {
  id: number;
  uid: string;
  slug: string;
  partner1_name: string;
  partner2_name: string;
  wedding_date: string | null;
  status: "planning" | "active" | "completed" | "cancelled";
  is_website_public: boolean;
  primary_color: string;
  secondary_color: string;
  cover_image_url: string;
  public_code: string;
  display_name: string;
  guest_count: number;
  confirmed_guest_count: number;
  created_at: string;
}

export interface WeddingCreateData {
  partner1_name: string;
  partner2_name: string;
  slug: string;
  wedding_date?: string;
}

// Guest Types
export type GuestType = "family" | "friend" | "coworker" | "neighbor" | "other";

export type FamilyRelationship = 
  | "mother" | "father" | "sister" | "brother" | "daughter" | "son" 
  | "grandmother" | "grandfather"
  | "aunt" | "uncle" | "cousin" | "niece" | "nephew"
  | "great_aunt" | "great_uncle" | "second_cousin" | "cousin_once_removed" | "distant_relative";

export type RelationshipTier = "first" | "second" | "third";

export interface Guest {
  id: number;
  uid: string;
  user_code: string;
  wedding: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  guest_type: GuestType;
  guest_type_display?: string;
  family_relationship?: FamilyRelationship;
  family_relationship_display?: string;
  relationship_tier?: RelationshipTier;
  relationship_tier_display?: string;
  attendance_status: "yes" | "no" | "pending";
  can_bring_plus_one: boolean;
  is_plus_one_coming: boolean;
  plus_one_name?: string;
  can_bring_children: boolean;
  has_children: boolean;
  dietary_restrictions?: string;
  notes?: string;
  table_assignment?: number;
  created_at: string;
  updated_at: string;
}

export interface GuestCreateData {
  first_name: string;
  last_name: string;
  email: string;
  guest_type?: GuestType;
  family_relationship?: FamilyRelationship;
  relationship_tier?: RelationshipTier;
  phone?: string;
  address?: string;
  can_bring_plus_one?: boolean;
  plus_one_name?: string;
  can_bring_children?: boolean;
  notes?: string;
  wedding: number;
}

// Stats Types
export interface GuestStats {
  total_guests: number;
  confirmed: number;
  pending: number;
  declined: number;
  family_count: number;
  friend_count: number;
}

// Table & Seating Types
export interface Table {
  id: number;
  uid: string;
  name: string;
  table_number: number;
  capacity: number;
  seats_taken: number;
  seats_available: number;
  is_vip: boolean;
  is_full: boolean;
  location?: string;
  notes?: string;
  guests: SeatingAssignment[];
  created_at: string;
  updated_at: string;
}

export interface SeatingAssignment {
  id: number;
  guest: number;
  table: number;
  guest_name: string;
  guest_email: string;
  assigned_at: string;
}

export interface TableCreateData {
  name: string;
  capacity: number;
  is_vip?: boolean;
  location?: string;
  notes?: string;
  wedding: number;
}

// Meal Types
export type MealType = "meat" | "fish" | "poultry" | "vegetarian" | "vegan" | "kids";

export interface MealChoice {
  id: number;
  name: string;
  description: string;
  meal_type: MealType;
  is_available: boolean;
  max_quantity?: number;
  created_at: string;
  updated_at: string;
}

export interface MealCreateData {
  name: string;
  description: string;
  meal_type: MealType;
  is_available?: boolean;
  max_quantity?: number;
  wedding: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
