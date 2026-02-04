// Guest Types

import type { GuestMealSelectionSummary } from "./meal";

export type GuestType = "family" | "friend" | "coworker" | "neighbor" | "other";

export type FamilyRelationship =
  | "mother" | "father" | "sister" | "brother" | "daughter" | "son"
  | "grandmother" | "grandfather"
  | "aunt" | "uncle" | "cousin" | "niece" | "nephew"
  | "great_aunt" | "great_uncle" | "second_cousin" | "cousin_once_removed" | "distant_relative";

export type RelationshipTier = "first" | "second" | "third";

export interface GuestClaimedGift {
  id: number;
  name: string;
  category?: string;
}

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
  children?: Child[];
  dietary_restrictions?: string;
  notes?: string;
  table_assignment?: number;
  meal_selection?: GuestMealSelectionSummary;
  claimed_gifts?: GuestClaimedGift[];
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
  age: number;
  guest: number;
}

export interface GuestStats {
  total_invited: number;
  confirmed: number;
  pending: number;
  declined: number;
  plus_ones_coming: number;
  guests_with_children: number;
  total_children: number;
  total_expected_attendees: number;
  response_rate: number;
  confirmation_rate: number;
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
