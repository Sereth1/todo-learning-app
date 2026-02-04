"use server";

import { authFetch } from "./auth";
import { getCurrentWeddingId } from "./wedding-core";
import type { WeddingEvent } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// ==============================
// Events
// ==============================

export async function getEvents(): Promise<WeddingEvent[]> {
  try {
    const weddingId = await getCurrentWeddingId();
    if (!weddingId) return [];

    const response = await authFetch(`${API_URL}/wedding_planner/events/?wedding=${weddingId}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.results || data || [];
  } catch {
    return [];
  }
}

export async function getCurrentEvent(): Promise<WeddingEvent | null> {
  try {
    const weddingId = await getCurrentWeddingId();
    if (!weddingId) return null;

    const response = await authFetch(`${API_URL}/wedding_planner/events/current/?wedding=${weddingId}`);
    if (!response.ok) {
      // Fallback: get the first event
      const events = await getEvents();
      return events.length > 0 ? events[0] : null;
    }
    return await response.json();
  } catch {
    return null;
  }
}

export async function createEvent(data: Partial<WeddingEvent>): Promise<{ success: boolean; event?: WeddingEvent; error?: string }> {
  try {
    const weddingId = await getCurrentWeddingId();
    if (!weddingId) return { success: false, error: "No wedding selected" };

    const response = await authFetch(`${API_URL}/wedding_planner/events/`, {
      method: "POST",
      body: JSON.stringify({ ...data, wedding: weddingId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.detail || "Failed to create event" };
    }

    const event = await response.json();
    return { success: true, event };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function updateEvent(id: number, data: Partial<WeddingEvent>): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await authFetch(`${API_URL}/wedding_planner/events/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.detail || "Failed to update event" };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function deleteEvent(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await authFetch(`${API_URL}/wedding_planner/events/${id}/`, {
      method: "DELETE",
    });

    if (!response.ok && response.status !== 204) {
      return { success: false, error: "Failed to delete event" };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Network error" };
  }
}
