// Todo Types

export type TodoStatus = "not_started" | "in_progress" | "waiting" | "completed" | "cancelled";
export type TodoPriority = "low" | "medium" | "high" | "urgent";
export type AttachmentType = "image" | "document" | "contract" | "receipt" | "inspiration" | "other";
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
