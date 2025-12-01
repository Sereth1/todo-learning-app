"use server";

import { apiRequest } from "./api";
import type {
  Notification,
  NotificationPreference,
  NotificationStats,
  CreateNotificationData,
  NotificationPreferenceUpdateData,
} from "@/types";

// ============================================================================
// Notifications
// ============================================================================

export type NotificationFilter = "all" | "read" | "unread";

export interface NotificationDashboardResponse {
  notifications: Notification[];
  stats: NotificationStats;
  filters: {
    is_read: NotificationFilter;
  };
}

/**
 * Get notifications + stats in a single call (optimized)
 * Use this for the notifications page and bell dropdown
 */
export async function getNotificationDashboard(params?: {
  wedding?: number;
  is_read?: NotificationFilter;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  
  if (params?.wedding) searchParams.set("wedding", params.wedding.toString());
  if (params?.is_read) searchParams.set("is_read", params.is_read);
  if (params?.limit) searchParams.set("limit", params.limit.toString());

  const queryString = searchParams.toString();
  const url = `/wedding_planner/notifications/dashboard/${queryString ? `?${queryString}` : ""}`;

  return apiRequest<NotificationDashboardResponse>(url);
}

/**
 * Get all notifications for the current user
 */
export async function getNotifications(params?: {
  wedding?: number;
  is_read?: boolean | NotificationFilter;
  notification_type?: string;
  priority?: string;
  limit?: number;
  offset?: number;
}) {
  const searchParams = new URLSearchParams();
  
  if (params?.wedding) searchParams.set("wedding", params.wedding.toString());
  if (params?.is_read !== undefined) {
    if (typeof params.is_read === "boolean") {
      searchParams.set("is_read", params.is_read ? "read" : "unread");
    } else {
      searchParams.set("is_read", params.is_read);
    }
  }
  if (params?.notification_type) searchParams.set("notification_type", params.notification_type);
  if (params?.priority) searchParams.set("priority", params.priority);
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  if (params?.offset) searchParams.set("offset", params.offset.toString());

  const queryString = searchParams.toString();
  const url = `/wedding_planner/notifications/${queryString ? `?${queryString}` : ""}`;

  return apiRequest<Notification[]>(url);
}

/**
 * Get a single notification by ID
 */
export async function getNotification(id: number) {
  return apiRequest<Notification>(`/wedding_planner/notifications/${id}/`);
}

/**
 * Create a new notification
 */
export async function createNotification(data: CreateNotificationData) {
  return apiRequest<Notification>("/wedding_planner/notifications/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Mark a single notification as read
 */
export async function markNotificationRead(id: number) {
  return apiRequest<Notification>(`/wedding_planner/notifications/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ is_read: true }),
  });
}

/**
 * Mark multiple notifications as read
 */
export async function markNotificationsRead(notificationIds: number[]) {
  return apiRequest<{ marked_count: number; notifications: Notification[] }>(
    "/wedding_planner/notifications/mark-read/",
    {
      method: "POST",
      body: JSON.stringify({ notification_ids: notificationIds }),
    }
  );
}

/**
 * Mark all notifications as read (optionally filtered by wedding)
 */
export async function markAllNotificationsRead(weddingId?: number) {
  return apiRequest<{ marked_count: number; notifications: Notification[] }>(
    "/wedding_planner/notifications/mark-read/",
    {
      method: "POST",
      body: JSON.stringify({
        mark_all: true,
        wedding: weddingId,
      }),
    }
  );
}

/**
 * Trigger check for todo notifications (due soon, due now, overdue)
 */
export async function checkTodoNotifications(weddingId?: number) {
  return apiRequest<{
    due_soon: number;
    due_now: number;
    overdue: number;
    total_created: number;
  }>("/wedding_planner/notifications/check-todos/", {
    method: "POST",
    body: JSON.stringify({ wedding: weddingId }),
  });
}

// ============================================================================
// Notification Preferences
// ============================================================================

/**
 * Get notification preferences for the current user
 */
export async function getNotificationPreferences(weddingId?: number) {
  const url = weddingId
    ? `/wedding_planner/notification-preferences/?wedding=${weddingId}`
    : "/wedding_planner/notification-preferences/";

  return apiRequest<NotificationPreference[]>(url);
}

/**
 * Get or create notification preferences for a wedding
 */
export async function getOrCreateNotificationPreference(weddingId: number) {
  return apiRequest<NotificationPreference>(
    `/wedding_planner/notification-preferences/get-or-create/?wedding=${weddingId}`
  );
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreference(
  id: number,
  data: NotificationPreferenceUpdateData
) {
  return apiRequest<NotificationPreference>(
    `/wedding_planner/notification-preferences/${id}/`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}
