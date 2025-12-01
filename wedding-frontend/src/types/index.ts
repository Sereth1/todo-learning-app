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

