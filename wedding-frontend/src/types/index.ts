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
  age: number;
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
  uid?: string;
  name: string;
  description: string;
  meal_type: "meat" | "fish" | "poultry" | "vegetarian" | "vegan" | "kids";
  contains_allergens: string[];
  allergen_display: string[];
  is_allergen_free: boolean;
  allergen_choices?: { value: string; label: string }[];
  image?: string;
  image_url?: string | null;
  is_available: boolean;
  max_quantity?: number;
}

export type AllergenType = 
  | "nuts" | "peanuts" | "tree_nuts" | "gluten" | "dairy" 
  | "eggs" | "shellfish" | "fish" | "soy" | "sesame" 
  | "mushrooms" | "celery" | "mustard" | "sulfites" | "lupin" | "molluscs";

export const ALLERGEN_OPTIONS: { value: AllergenType; label: string }[] = [
  { value: "nuts", label: "Nuts" },
  { value: "peanuts", label: "Peanuts" },
  { value: "tree_nuts", label: "Tree Nuts" },
  { value: "gluten", label: "Gluten" },
  { value: "dairy", label: "Dairy" },
  { value: "eggs", label: "Eggs" },
  { value: "shellfish", label: "Shellfish" },
  { value: "fish", label: "Fish" },
  { value: "soy", label: "Soy" },
  { value: "sesame", label: "Sesame" },
  { value: "mushrooms", label: "Mushrooms" },
  { value: "celery", label: "Celery" },
  { value: "mustard", label: "Mustard" },
  { value: "sulfites", label: "Sulfites" },
  { value: "lupin", label: "Lupin" },
  { value: "molluscs", label: "Molluscs" },
];

export interface GuestMealSelection {
  id: number;
  guest: number;
  meal_choice: number;
  dietary_restrictions?: number[];
}

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

// ======================
// TODO LIST TYPES
// ======================

// Todo Status
export type TodoStatus = "not_started" | "in_progress" | "waiting" | "completed" | "cancelled";

// Todo Priority
export type TodoPriority = "low" | "medium" | "high" | "urgent";

// Attachment Type
export type AttachmentType = "image" | "document" | "contract" | "receipt" | "inspiration" | "other";

// Timeline Position for Templates
export type TimelinePosition = 
  | "12_plus" | "9_12" | "6_9" | "4_6" | "2_4" 
  | "1_2" | "2_4_weeks" | "1_week" | "day_of" | "post";

// Todo Category
export interface TodoCategory {
  id: number;
  uid: string;
  wedding: number;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  order: number;
  is_active: boolean;
  total_todos: number;
  completed_todos: number;
  in_progress_todos: number;
  overdue_todos: number;
  progress_percent: number;
  created_at: string;
  updated_at: string;
}

export interface TodoCategorySummary {
  id: number;
  uid: string;
  name: string;
  color: string;
  icon?: string;
  description?: string;
  todo_count?: number;
}

export interface TodoCategoryCreateData {
  wedding: number;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  order?: number;
}

export interface TodoCategoryUpdateData {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  order?: number;
}

// Checklist Item
export interface TodoChecklist {
  id: number;
  uid: string;
  todo: number;
  title: string;
  is_completed: boolean;
  completed_at?: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface TodoChecklistCreateData {
  todo: number;
  title: string;
  order?: number;
}

// Subtask/Checklist Progress
export interface ChecklistProgress {
  total: number;
  completed: number;
  percent: number;
}

export interface SubtaskCount {
  total: number;
  completed: number;
}

// Todo (List View)
export interface TodoListItem {
  id: number;
  uid: string;
  title: string;
  status: TodoStatus;
  status_display: string;
  priority: TodoPriority;
  priority_display: string;
  due_date?: string;
  due_time?: string;
  category?: number;
  category_name?: string;
  category_color?: string;
  assigned_to?: number;
  assigned_to_name?: string;
  is_milestone: boolean;
  is_pinned: boolean;
  progress_percent: number;
  is_overdue: boolean;
  days_until_due?: number;
  subtask_count: SubtaskCount;
  checklist_progress: ChecklistProgress;
  estimated_cost?: number;
  created_at: string;
}

// Todo (Full Detail)
export interface Todo extends TodoListItem {
  wedding: number;
  parent?: number;
  parent_title?: string;
  description?: string;
  notes?: string;
  reminder_date?: string;
  started_at?: string;
  completed_at?: string;
  actual_cost?: number;
  vendor_name?: string;
  vendor_contact?: string;
  vendor_email?: string;
  vendor_phone?: string;
  vendor_notes?: string;
  location?: string;
  location_url?: string;
  external_url?: string;
  checklist_items: TodoChecklist[];
  subtasks: TodoListItem[];
  comment_count: number;
  attachment_count: number;
  updated_at: string;
}

export interface TodoCreateData {
  wedding: number;
  category?: number;
  parent?: number;
  assigned_to?: number;
  title: string;
  description?: string;
  notes?: string;
  status?: TodoStatus;
  priority?: TodoPriority;
  due_date?: string;
  due_time?: string;
  reminder_date?: string;
  estimated_cost?: number;
  actual_cost?: number;
  vendor_name?: string;
  vendor_contact?: string;
  vendor_email?: string;
  vendor_phone?: string;
  vendor_notes?: string;
  location?: string;
  location_url?: string;
  is_milestone?: boolean;
  is_pinned?: boolean;
  external_url?: string;
  checklist_items?: { title: string; order?: number }[];
}

export interface TodoUpdateData extends Partial<TodoCreateData> {
  progress_percent?: number;
}

// Bulk Update
export type TodoBulkAction = 
  | "complete" | "cancel" | "restart" 
  | "set_priority" | "set_category" | "assign" | "delete";

export interface TodoBulkUpdateData {
  wedding: number;
  todo_ids: number[];
  action: TodoBulkAction;
  priority?: TodoPriority;
  category_id?: number;
  assigned_to_id?: number | null;
}

// Todo Template
export interface TodoTemplate {
  id: number;
  uid: string;
  wedding?: number;
  category_name: string;
  title: string;
  description?: string;
  timeline_position: TimelinePosition;
  timeline_position_display: string;
  days_before_wedding?: number;
  priority: TodoPriority;
  priority_display: string;
  is_milestone: boolean;
  estimated_cost?: number;
  order: number;
  is_active: boolean;
  checklist_items: { title: string }[];
  created_at: string;
  updated_at: string;
  // Additional properties for template selection UI
  default_category?: string;
  default_priority?: TodoPriority;
}

export interface ApplyTemplateData {
  wedding: number;
  template_ids?: number[];
  include_global?: boolean;
  wedding_date?: string;
  skip_existing?: boolean;
}

export interface ApplyTemplateResult {
  created: number;
  skipped: number;
  todos: TodoListItem[];
  skipped_details: { id: number; title: string; reason: string }[];
}

// Todo Comment
export interface TodoComment {
  id: number;
  uid: string;
  todo: number;
  author: number;
  author_name: string;
  author_email: string;
  content: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

export interface TodoCommentCreateData {
  todo: number;
  content: string;
}

// Todo Attachment
export interface TodoAttachment {
  id: number;
  uid: string;
  todo: number;
  uploaded_by?: number;
  uploaded_by_name?: string;
  file: string;
  file_url: string;
  filename: string;
  file_size: number;
  file_size_display: string;
  file_type: string;
  attachment_type: AttachmentType;
  attachment_type_display: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// Todo Stats
export interface TodoStats {
  total: number;
  completed: number;
  completion_rate: number;
  status_counts: Record<TodoStatus, number>;
  priority_counts: Record<TodoPriority, number>;
  overdue: number;
  due_today: number;
  due_this_week: number;
  by_category: {
    category__id: number;
    category__name: string;
    category__color: string;
    total: number;
    completed: number;
  }[];
}

// Timeline Group
export interface TodoTimelineGroup {
  month: string;
  label?: string;
  todos: TodoListItem[];
}

// Template Timeline Group
export interface TemplateTimelineGroup {
  position: TimelinePosition;
  label: string;
  templates: TodoTemplate[];
}

// Notification Types
export type NotificationType = 
  | "todo_due_soon"      // 30 minutes before due
  | "todo_due_now"       // At due time
  | "todo_overdue"       // Past due time
  | "todo_completed"     // Todo marked complete
  | "rsvp_accepted"      // Guest accepted invitation
  | "rsvp_declined"      // Guest declined invitation
  | "gift_claimed"       // Guest claimed a gift
  | "gift_unclaimed"     // Guest unclaimed a gift
  | "reminder"           // General reminder
  | "rsvp_update"        // RSVP status update
  | "payment_due"        // Payment reminder
  | "vendor_message"     // Message from vendor
  | "event_update"       // Event details changed
  | "custom";            // Custom notification

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export interface Notification {
  id: number;
  uid: string;
  user: number;
  wedding?: number;
  wedding_display?: string;
  notification_type: NotificationType;
  notification_type_display: string;
  priority: NotificationPriority;
  priority_display: string;
  title: string;
  message: string;
  action_url?: string;
  related_todo?: number;
  related_todo_display?: string;
  related_guest?: number;
  related_guest_display?: string;
  is_read: boolean;
  read_at?: string;
  is_email_sent: boolean;
  email_sent_at?: string;
  scheduled_at?: string;
  expires_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  time_ago: string;
}

export interface NotificationPreference {
  id: number;
  uid: string;
  user: number;
  wedding?: number;
  todo_reminders: boolean;
  todo_reminder_minutes: number;
  rsvp_notifications: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  by_type: Record<NotificationType, number>;
  by_priority: Record<NotificationPriority, number>;
  recent_count: number;
}

export interface CreateNotificationData {
  wedding?: number;
  notification_type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  action_url?: string;
  related_todo?: number;
  related_guest?: number;
  scheduled_at?: string;
  expires_at?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationPreferenceUpdateData {
  todo_reminders?: boolean;
  todo_reminder_minutes?: number;
  rsvp_notifications?: boolean;
  email_notifications?: boolean;
  push_notifications?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

// ======================
// VENDOR TYPES
// ======================

// Category type enum
export type VendorCategoryType = 
  | "venue" 
  | "photography" 
  | "catering" 
  | "beauty" 
  | "decor" 
  | "entertainment" 
  | "planning" 
  | "fashion" 
  | "stationery" 
  | "transportation" 
  | "officiant" 
  | "gifts" 
  | "accommodation" 
  | "honeymoon" 
  | "other";

// Price range enum
export type VendorPriceRange = "$" | "$$" | "$$$" | "$$$$";

// Booking status enum
export type VendorBookingStatus = "available" | "limited" | "booked";

// Offer type enum
export type VendorOfferType = "package" | "service" | "promo" | "bundle" | "addon";

// Image type enum
export type VendorImageType = "gallery" | "portfolio" | "venue" | "food" | "team" | "certificate" | "other";

// Quote status enum
export type VendorQuoteStatus = "requested" | "received" | "negotiating" | "accepted" | "rejected";

// Vendor Category
export interface VendorCategory {
  id: number;
  uid: string;
  name: string;
  slug: string;
  category_type: VendorCategoryType;
  category_type_display: string;
  icon: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  is_featured: boolean;
  meta_title: string;
  meta_description: string;
  vendor_count: number;
  created_at: string;
  updated_at: string;
}

// Lightweight category for lists
export interface VendorCategoryListItem {
  id: number;
  name: string;
  slug: string;
  category_type: VendorCategoryType;
  icon: string;
  vendor_count: number;
}

// Vendor Image
export interface VendorImage {
  id: number;
  uid: string;
  vendor: number;
  image: string;
  image_type: VendorImageType;
  image_type_display: string;
  caption: string;
  alt_text: string;
  sort_order: number;
  is_featured: boolean;
  created_at: string;
}

// Vendor Offer/Package
export interface VendorOffer {
  id: number;
  uid: string;
  vendor: number;
  name: string;
  offer_type: VendorOfferType;
  offer_type_display: string;
  description: string;
  price: number;
  original_price?: number;
  discount_percentage: number;
  currency: string;
  includes: string[];
  excludes: string[];
  is_active: boolean;
  is_featured: boolean;
  valid_from?: string;
  valid_until?: string;
  terms_and_conditions: string;
  deposit_required?: number;
  duration_hours?: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Lightweight offer for lists
export interface VendorOfferListItem {
  id: number;
  name: string;
  offer_type: VendorOfferType;
  price: number;
  original_price?: number;
  discount_percentage: number;
  currency: string;
  is_featured: boolean;
}

// Full Vendor
export interface Vendor {
  id: number;
  uid: string;
  name: string;
  slug: string;
  category: number;
  category_name: string;
  category_slug: string;
  tagline: string;
  description: string;
  primary_image?: string;
  primary_image_url?: string;
  
  // Contact
  email: string;
  phone: string;
  secondary_phone: string;
  whatsapp: string;
  website: string;
  
  // Social media
  facebook_url: string;
  instagram_url: string;
  tiktok_url: string;
  youtube_url: string;
  pinterest_url: string;
  
  // Location
  address: string;
  address_line_2: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  latitude?: number;
  longitude?: number;
  service_area: string;
  
  // Pricing
  price_range: VendorPriceRange;
  price_range_display: string;
  min_price?: number;
  max_price?: number;
  price_display: string;
  currency: string;
  deposit_percentage?: number;
  
  // Capacity
  min_capacity?: number;
  max_capacity?: number;
  
  // Booking
  booking_status: VendorBookingStatus;
  booking_status_display: string;
  lead_time_days?: number;
  
  // Business hours
  business_hours: Record<string, { open: string; close: string; closed: boolean }>;
  
  // Credentials
  years_in_business?: number;
  licenses: string;
  awards: string;
  insurance_info: string;
  languages_spoken: string;
  languages_list: string[];
  
  // Ratings
  average_rating: number;
  review_count: number;
  
  // Status
  is_verified: boolean;
  is_featured: boolean;
  is_active: boolean;
  accepts_credit_card: boolean;
  offers_payment_plan: boolean;
  
  // Sustainability
  is_eco_friendly: boolean;
  eco_certifications: string;
  
  // Sorting
  sort_order: number;
  
  // Nested data
  images: VendorImage[];
  offers: VendorOffer[];
  
  created_at: string;
  updated_at: string;
}

// Lightweight vendor for lists
export interface VendorListItem {
  id: number;
  uid: string;
  name: string;
  slug: string;
  category: number;
  category_name: string;
  category_slug: string;
  tagline: string;
  primary_image?: string;
  primary_image_url?: string;
  city: string;
  country: string;
  price_range: VendorPriceRange;
  price_range_display: string;
  min_price?: number;
  max_price?: number;
  price_display: string;
  currency: string;
  average_rating: number;
  review_count: number;
  is_verified: boolean;
  is_featured: boolean;
  is_eco_friendly: boolean;
  booking_status: VendorBookingStatus;
  offer_count: number;
}

// Vendor create/update data
export interface VendorCreateData {
  name: string;
  category: number;
  tagline?: string;
  description?: string;
  primary_image?: File;
  primary_image_url?: string;
  email?: string;
  phone?: string;
  secondary_phone?: string;
  whatsapp?: string;
  website?: string;
  facebook_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
  youtube_url?: string;
  pinterest_url?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  state_province?: string; // Alias for state
  country?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  service_area?: string;
  price_range?: VendorPriceRange;
  min_price?: number;
  max_price?: number;
  price_min?: number; // Alias for min_price
  price_max?: number; // Alias for max_price
  currency?: string;
  deposit_percentage?: number;
  min_capacity?: number;
  max_capacity?: number;
  booking_status?: VendorBookingStatus;
  lead_time_days?: number;
  business_hours?: Record<string, { open: string; close: string; closed: boolean }>;
  years_in_business?: number;
  licenses?: string;
  awards?: string;
  insurance_info?: string;
  languages_spoken?: string;
  accepts_credit_card?: boolean;
  offers_payment_plan?: boolean;
  is_verified?: boolean;
  is_featured?: boolean;
  is_eco_friendly?: boolean;
  eco_certifications?: string;
  sort_order?: number;
}

// Vendor Review
export interface VendorReview {
  id: number;
  uid: string;
  vendor: number;
  vendor_name: string;
  user: number;
  user_name: string;
  rating: number;
  title: string;
  content: string;
  helpful_count: number;
  is_verified_purchase: boolean;
  created_at: string;
  updated_at: string;
}

export interface VendorReviewCreateData {
  vendor: number;
  rating: number;
  title?: string;
  content: string;
}

// Vendor Quote
export interface VendorQuote {
  id: number;
  uid: string;
  vendor: number;
  vendor_name: string;
  status: VendorQuoteStatus;
  status_display: string;
  description: string;
  quoted_amount?: number;
  deposit_amount?: number;
  deposit_due_date?: string;
  final_due_date?: string;
  notes: string;
  contract_file?: string;
  created_at: string;
  updated_at: string;
}

export interface VendorQuoteCreateData {
  vendor: number;
  description: string;
  notes?: string;
}

// Saved Vendor
export interface SavedVendor {
  id: number;
  uid: string;
  vendor: number;
  vendor_detail: VendorListItem;
  notes: string;
  created_at: string;
}

// Vendor Full Detail Response (for detail page - ONE API call)
export interface VendorFullData {
  vendor: Vendor;
  reviews: VendorReview[];
  is_saved: boolean;
}

// Vendor Dashboard Response
export interface VendorDashboardData {
  categories: VendorCategoryListItem[];
  featured_vendors: VendorListItem[];
  vendors: VendorListItem[];
  saved_vendor_ids: number[];
  stats: {
    total_vendors: number;
    total_categories: number;
    verified_vendors: number;
    eco_friendly_vendors: number;
    category_type_distribution: {
      type: VendorCategoryType;
      label: string;
      count: number;
    }[];
  };
}

// Vendor Filter Options
export interface VendorFilterOptions {
  categories: { id: number; name: string; slug: string }[];
  cities: string[];
  price_ranges: { value: string; label: string }[];
  booking_statuses: { value: string; label: string }[];
  sort_options: { value: string; label: string }[];
}

// Vendor Filters (for API calls)
export interface VendorFilters {
  category?: number;
  category_slug?: string;
  category_type?: VendorCategoryType;
  city?: string;
  country?: string;
  price_range?: VendorPriceRange;
  min_price?: number;
  max_price?: number;
  is_verified?: boolean;
  is_featured?: boolean;
  is_eco_friendly?: boolean;
  booking_status?: VendorBookingStatus;
  rating_min?: number;
  search?: string;
  sort_by?: "default" | "rating" | "price_low" | "price_high" | "name" | "newest" | "reviews";
}

// Category Filters
export interface VendorCategoryFilters {
  category_type?: VendorCategoryType;
  is_featured?: boolean;
  search?: string;
  compact?: boolean;
}
