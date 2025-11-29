// Guest Types
export interface Guest {
  id: number;
  uid: string;
  user_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  attendance_status: "yes" | "no" | "pending";
  is_plus_one_coming: boolean;
  has_children: boolean;
  dietary_restrictions?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface GuestCreateData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
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
  meal_type: "appetizer" | "main" | "dessert" | "beverage";
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  is_available: boolean;
}

export interface GuestMealSelection {
  id: number;
  guest: number;
  meal_choice: number;
  allergies?: string;
  special_requests?: string;
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
