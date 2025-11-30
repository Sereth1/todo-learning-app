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
// Guest type options
export type GuestType = "family" | "friend" | "coworker" | "neighbor" | "other";

// Family relationship options
export type FamilyRelationship = 
  | "mother" | "father" | "sister" | "brother" | "daughter" | "son" 
  | "grandmother" | "grandfather"
  | "aunt" | "uncle" | "cousin" | "niece" | "nephew"
  | "great_aunt" | "great_uncle" | "second_cousin" | "cousin_once_removed" | "distant_relative";

// Relationship tier
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
  can_bring_plus_one?: boolean;
  plus_one_name?: string;
  can_bring_children?: boolean;
  address?: string;
  notes?: string;
}

export interface Child {
  id: number;
  first_name: string;
  last_name: string;
  age: number;
  gender: string;
  guest: number;
}

// Event Types
export interface WeddingEvent {
  id: number;
  uid: string;
  name: string;
  event_date: string;
  event_time: string;
  venue_name: string;
  venue_address: string;
  ceremony_time?: string;
  reception_time?: string;
  dress_code?: string;
  rsvp_deadline: string;
  is_active: boolean;
  description?: string;
  days_until_wedding: number;
  is_rsvp_open: boolean;
}

// Meal Types
export interface DietaryRestriction {
  id: number;
  name: string;
  description?: string;
}

export interface MealChoice {
  id: number;
  name: string;
  description: string;
  meal_type: "meat" | "fish" | "poultry" | "vegetarian" | "vegan" | "kids";
  is_available: boolean;
  max_quantity?: number;
}

export interface GuestMealSelection {
  id: number;
  guest: number;
  meal_choice: number;
  dietary_restrictions?: number[];
}

// Seating Types
export interface Table {
  id: number;
  name: string;
  capacity: number;
  seats_taken: number;
  is_vip: boolean;
  is_full: boolean;
  location?: string;
  table_number?: number;
  description?: string;
}

export interface SeatingAssignment {
  id: number;
  guest: Guest;
  table: Table;
  seat_number?: number;
}

// Stats Types
export interface GuestStats {
  total_invited: number;
  confirmed: number;
  pending: number;
  declined: number;
  plus_ones_coming: number;
  guests_with_children: number;
  total_expected_attendees: number;
  response_rate: number;
  confirmation_rate: number;
}

export interface SeatingStats {
  total_tables: number;
  total_capacity: number;
  total_seated: number;
  seats_available: number;
  occupancy_rate: number;
  tables_full: number;
  vip_tables: number;
}

// RSVP Form Types
export interface RSVPFormData {
  attending: boolean;
  is_plus_one_coming: boolean;
  has_children: boolean;
  meal_choice?: number;
  dietary_restrictions?: string;
  special_requests?: string;
}
