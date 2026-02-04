"use server";

import { authFetch } from "./auth";
import { getCurrentWeddingId } from "./wedding-core";
import type { Guest, GuestCreateData, GuestStats } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// ==============================
// Guest Management
// ==============================

export interface GuestFilters {
  status?: string;
  guest_type?: string;
  search?: string;
}

export async function getGuests(filters?: GuestFilters): Promise<Guest[]> {
  try {
    const weddingId = await getCurrentWeddingId();
    if (!weddingId) return [];

    const params = new URLSearchParams();
    params.set("wedding", weddingId.toString());

    if (filters?.status && filters.status !== "all") {
      params.set("status", filters.status);
    }
    if (filters?.guest_type && filters.guest_type !== "all") {
      params.set("guest_type", filters.guest_type);
    }
    if (filters?.search) {
      params.set("search", filters.search);
    }

    const response = await authFetch(`${API_URL}/wedding_planner/guests/?${params.toString()}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.results || data || [];
  } catch {
    return [];
  }
}

export async function getGuest(id: number): Promise<Guest | null> {
  try {
    const response = await authFetch(`${API_URL}/wedding_planner/guests/${id}/`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function createGuest(data: GuestCreateData): Promise<{ success: boolean; guest?: Guest; error?: string }> {
  try {
    const weddingId = await getCurrentWeddingId();
    if (!weddingId) return { success: false, error: "No wedding selected" };

    const response = await authFetch(`${API_URL}/wedding_planner/guests/`, {
      method: "POST",
      body: JSON.stringify({ ...data, wedding: weddingId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.detail || error.email?.[0] || "Failed to create guest" };
    }

    const guest = await response.json();
    return { success: true, guest };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function updateGuest(id: number, data: Partial<Guest>): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await authFetch(`${API_URL}/wedding_planner/guests/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.detail || "Failed to update guest" };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function deleteGuest(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await authFetch(`${API_URL}/wedding_planner/guests/${id}/`, {
      method: "DELETE",
    });

    if (!response.ok && response.status !== 204) {
      return { success: false, error: "Failed to delete guest" };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function getGuestStats(): Promise<GuestStats | null> {
  try {
    const weddingId = await getCurrentWeddingId();
    if (!weddingId) return null;

    const response = await authFetch(`${API_URL}/wedding_planner/guests/stats/?wedding=${weddingId}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// ==============================
// Public RSVP (no auth required)
// ==============================

export async function getGuestByCode(code: string): Promise<Guest | null> {
  try {
    const response = await fetch(`${API_URL}/wedding_planner/guests/by-code/${code}/`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function submitRSVP(userCode: string, data: {
  attending: boolean;
  is_plus_one_coming?: boolean;
  plus_one_name?: string;
  has_children?: boolean;
  children?: Array<{ first_name: string; age: number }>;
  dietary_restrictions?: string;
  meal_choice_id?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/wedding_planner/guests/public-rsvp/${userCode}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.detail || error.error || "Failed to submit RSVP" };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Network error" };
  }
}

// ==============================
// Reminders
// ==============================

export async function sendReminder(guestId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await authFetch(`${API_URL}/wedding_planner/guests/${guestId}/send-reminder/`, {
      method: "POST",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.detail || "Failed to send reminder" };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function sendBulkReminders(): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const weddingId = await getCurrentWeddingId();
    if (!weddingId) return { success: false, error: "No wedding selected" };

    const response = await authFetch(`${API_URL}/wedding_planner/guests/send-bulk-reminders/?wedding=${weddingId}`, {
      method: "POST",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.detail || "Failed to send reminders" };
    }

    const resData = await response.json();
    return { success: true, count: resData.sent_successfully };
  } catch {
    return { success: false, error: "Network error" };
  }
}
