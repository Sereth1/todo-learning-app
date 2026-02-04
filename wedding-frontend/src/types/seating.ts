// Seating Types

export interface SeatingAssignment {
  id: number;
  uid: string;
  guest: number;
  guest_name: string;
  guest_type?: string;
  family_relationship?: string;
  family_relationship_display?: string;
  relationship_tier?: string;
  relationship_tier_display?: string;
  attendee_type: "guest" | "plus_one" | "child";
  child?: number;
  table: number;
  table_info: string;
  seat_number?: number;
  display_name: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Table {
  id: number;
  uid: string;
  name: string;
  table_number: number;
  capacity: number;
  table_category?: string;
  table_category_display?: string;
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

// Expanded guest for seating (includes guest + plus one + children)
export interface SeatingGuest {
  id: string; // Composite ID like "guest-123", "plusone-123", "child-456"
  guest_id: number;
  child_id?: number;
  type: "guest" | "plus_one" | "child";
  name: string;
  display_name?: string;
  email: string;
  guest_type: string;
  guest_type_display?: string;
  family_relationship?: string;
  family_relationship_display?: string;
  relationship_tier?: string;
  relationship_tier_display?: string;
  is_primary: boolean;
  parent_guest?: string;
  parent_guest_id?: number;
  age?: number;
  priority?: number;
  sort_order?: number;
  has_plus_one?: boolean;
  has_children?: boolean;
  children_count?: number;
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
