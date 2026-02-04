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
