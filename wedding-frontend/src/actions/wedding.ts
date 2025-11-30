"use server";

import { cookies } from "next/headers";
import { authFetch } from "./auth";
import type { Wedding, WeddingCreateData, Guest, GuestCreateData, WeddingEvent, Table, MealChoice, GuestStats, SeatingStats } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Current wedding management
export async function setCurrentWedding(weddingId: number): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("current_wedding_id", weddingId.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function getCurrentWeddingId(): Promise<number | null> {
  const cookieStore = await cookies();
  const id = cookieStore.get("current_wedding_id")?.value;
  return id ? parseInt(id) : null;
}

// Wedding CRUD
export async function getMyWeddings(): Promise<Wedding[]> {
  try {
    const response = await authFetch(`${API_URL}/wedding_planner/weddings/`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Get weddings error:", error);
    return [];
  }
}

export async function getWedding(id: number): Promise<Wedding | null> {
  try {
    const response = await authFetch(`${API_URL}/wedding_planner/weddings/${id}/`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Get wedding error:", error);
    return null;
  }
}

export async function getCurrentWedding(): Promise<Wedding | null> {
  const weddingId = await getCurrentWeddingId();
  if (!weddingId) return null;
  return getWedding(weddingId);
}

export async function createWedding(data: WeddingCreateData): Promise<{ success: boolean; wedding?: Wedding; error?: string }> {
  try {
    const response = await authFetch(`${API_URL}/wedding_planner/weddings/`, {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.detail || error.slug?.[0] || "Failed to create wedding" };
    }

    const wedding = await response.json();
    await setCurrentWedding(wedding.id);
    return { success: true, wedding };
  } catch (error) {
    console.error("Create wedding error:", error);
    return { success: false, error: "Network error" };
  }
}

export async function updateWedding(id: number, data: Partial<WeddingCreateData>): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await authFetch(`${API_URL}/wedding_planner/weddings/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.detail || "Failed to update wedding" };
    }

    return { success: true };
  } catch (error) {
    console.error("Update wedding error:", error);
    return { success: false, error: "Network error" };
  }
}

// Guest management
export async function getGuests(): Promise<Guest[]> {
  try {
    const weddingId = await getCurrentWeddingId();
    if (!weddingId) return [];
    
    const response = await authFetch(`${API_URL}/wedding_planner/weddings/${weddingId}/guests/`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Get guests error:", error);
    return [];
  }
}

export async function getGuest(id: number): Promise<Guest | null> {
  try {
    const response = await authFetch(`${API_URL}/wedding_planner/guests/${id}/`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Get guest error:", error);
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
  } catch (error) {
    console.error("Create guest error:", error);
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
  } catch (error) {
    console.error("Update guest error:", error);
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
  } catch (error) {
    console.error("Delete guest error:", error);
    return { success: false, error: "Network error" };
  }
}

export async function getGuestStats(): Promise<GuestStats | null> {
  try {
    const weddingId = await getCurrentWeddingId();
    if (!weddingId) return null;
    
    const response = await authFetch(`${API_URL}/wedding_planner/weddings/${weddingId}/guest-stats/`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Get guest stats error:", error);
    return null;
  }
}

// Events
export async function getEvents(): Promise<WeddingEvent[]> {
  try {
    const weddingId = await getCurrentWeddingId();
    if (!weddingId) return [];
    
    const response = await authFetch(`${API_URL}/wedding_planner/weddings/${weddingId}/events/`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Get events error:", error);
    return [];
  }
}

export async function getCurrentEvent(): Promise<WeddingEvent | null> {
  try {
    const weddingId = await getCurrentWeddingId();
    if (!weddingId) return null;
    
    const response = await authFetch(`${API_URL}/wedding_planner/weddings/${weddingId}/events/current/`);
    if (!response.ok) {
      // Try to get the first event as a fallback
      const events = await getEvents();
      return events.length > 0 ? events[0] : null;
    }
    return await response.json();
  } catch (error) {
    console.error("Get current event error:", error);
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
  } catch (error) {
    console.error("Create event error:", error);
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
  } catch (error) {
    console.error("Update event error:", error);
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
  } catch (error) {
    console.error("Delete event error:", error);
    return { success: false, error: "Network error" };
  }
}

// Tables
export async function getTables(): Promise<Table[]> {
  try {
    const weddingId = await getCurrentWeddingId();
    if (!weddingId) return [];
    
    const response = await authFetch(`${API_URL}/wedding_planner/weddings/${weddingId}/tables/`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Get tables error:", error);
    return [];
  }
}

export async function createTable(data: Partial<Table>): Promise<{ success: boolean; table?: Table; error?: string }> {
  try {
    const weddingId = await getCurrentWeddingId();
    if (!weddingId) return { success: false, error: "No wedding selected" };
    
    const response = await authFetch(`${API_URL}/wedding_planner/tables/`, {
      method: "POST",
      body: JSON.stringify({ ...data, wedding: weddingId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.detail || "Failed to create table" };
    }

    const table = await response.json();
    return { success: true, table };
  } catch (error) {
    console.error("Create table error:", error);
    return { success: false, error: "Network error" };
  }
}

export async function deleteTable(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await authFetch(`${API_URL}/wedding_planner/tables/${id}/`, {
      method: "DELETE",
    });

    if (!response.ok && response.status !== 204) {
      return { success: false, error: "Failed to delete table" };
    }

    return { success: true };
  } catch (error) {
    console.error("Delete table error:", error);
    return { success: false, error: "Network error" };
  }
}

export async function assignSeat(guestId: number, tableId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await authFetch(`${API_URL}/wedding_planner/seating/`, {
      method: "POST",
      body: JSON.stringify({ guest: guestId, table: tableId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.detail || error.table?.[0] || "Failed to assign seat" };
    }

    return { success: true };
  } catch (error) {
    console.error("Assign seat error:", error);
    return { success: false, error: "Network error" };
  }
}

export async function unassignSeat(guestId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await authFetch(`${API_URL}/wedding_planner/seating/by-guest/${guestId}/`, {
      method: "DELETE",
    });

    if (!response.ok && response.status !== 204) {
      return { success: false, error: "Failed to unassign seat" };
    }

    return { success: true };
  } catch (error) {
    console.error("Unassign seat error:", error);
    return { success: false, error: "Network error" };
  }
}

export async function getSeatingStats(): Promise<SeatingStats | null> {
  try {
    const weddingId = await getCurrentWeddingId();
    if (!weddingId) return null;
    
    const response = await authFetch(`${API_URL}/wedding_planner/weddings/${weddingId}/seating-stats/`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Get seating stats error:", error);
    return null;
  }
}

// Meals
export async function getMealChoices(): Promise<MealChoice[]> {
  try {
    const weddingId = await getCurrentWeddingId();
    if (!weddingId) return [];
    
    const response = await authFetch(`${API_URL}/wedding_planner/weddings/${weddingId}/meal-choices/`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Get meal choices error:", error);
    return [];
  }
}

export async function createMealChoice(data: Partial<MealChoice>): Promise<{ success: boolean; meal?: MealChoice; error?: string }> {
  try {
    const weddingId = await getCurrentWeddingId();
    if (!weddingId) return { success: false, error: "No wedding selected" };
    
    const response = await authFetch(`${API_URL}/wedding_planner/meal-choices/`, {
      method: "POST",
      body: JSON.stringify({ ...data, wedding: weddingId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.detail || "Failed to create meal" };
    }

    const meal = await response.json();
    return { success: true, meal };
  } catch (error) {
    console.error("Create meal error:", error);
    return { success: false, error: "Network error" };
  }
}

export async function deleteMealChoice(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await authFetch(`${API_URL}/wedding_planner/meal-choices/${id}/`, {
      method: "DELETE",
    });

    if (!response.ok && response.status !== 204) {
      return { success: false, error: "Failed to delete meal" };
    }

    return { success: true };
  } catch (error) {
    console.error("Delete meal error:", error);
    return { success: false, error: "Network error" };
  }
}

// Public RSVP (no auth)
export async function getGuestByCode(code: string): Promise<Guest | null> {
  try {
    const response = await fetch(`${API_URL}/wedding_planner/guests/by-code/${code}/`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Get guest by code error:", error);
    return null;
  }
}

export async function submitRSVP(guestId: number, data: { 
  attendance_status: string; 
  is_plus_one_coming?: boolean;
  has_children?: boolean;
  meal_choice?: number;
  dietary_restrictions?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/wedding_planner/guests/${guestId}/rsvp/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.detail || "Failed to submit RSVP" };
    }

    return { success: true };
  } catch (error) {
    console.error("Submit RSVP error:", error);
    return { success: false, error: "Network error" };
  }
}

// Send reminders
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
  } catch (error) {
    console.error("Send reminder error:", error);
    return { success: false, error: "Network error" };
  }
}

export async function sendBulkReminders(): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const weddingId = await getCurrentWeddingId();
    if (!weddingId) return { success: false, error: "No wedding selected" };
    
    const response = await authFetch(`${API_URL}/wedding_planner/weddings/${weddingId}/send-bulk-reminders/`, {
      method: "POST",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.detail || "Failed to send reminders" };
    }

    const resData = await response.json();
    return { success: true, count: resData.count };
  } catch (error) {
    console.error("Send bulk reminders error:", error);
    return { success: false, error: "Network error" };
  }
}
