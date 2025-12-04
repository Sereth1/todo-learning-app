"use server";

import { cookies } from "next/headers";
import { authFetch } from "./auth";
import type { Wedding, WeddingCreateData, Guest, GuestCreateData, WeddingEvent, Table, MealChoice, GuestStats, SeatingStats, SeatingGuest } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// ======================
// DASHBOARD DATA (Single API call)
// ======================

export interface DashboardData {
  guest_stats: GuestStats;
  seating_stats: SeatingStats;
  events: WeddingEvent[];
  current_event: WeddingEvent | null;
}

export async function getDashboardData(): Promise<DashboardData | null> {
  try {
    const weddingId = await getCurrentWeddingId();
    const url = weddingId 
      ? `${API_URL}/wedding_planner/weddings/dashboard-data/?wedding=${weddingId}`
      : `${API_URL}/wedding_planner/weddings/dashboard-data/`;
    
    const response = await authFetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Get dashboard data error:", error);
    return null;
  }
}

// ======================
// SEATING DASHBOARD DATA (Single API call for seating page)
// ======================

export interface SeatingDashboardData {
  tables: Table[];
  unassigned_guests: SeatingGuest[];
  summary: {
    total_tables: number;
    total_capacity: number;
    total_seated: number;
    seats_available: number;
    occupancy_rate: number;
    tables_full: number;
    vip_tables: number;
  };
}

export async function getSeatingDashboardData(): Promise<SeatingDashboardData | null> {
  try {
    const weddingId = await getCurrentWeddingId();
    if (!weddingId) return null;
    
    const response = await authFetch(`${API_URL}/wedding_planner/tables/dashboard/?wedding=${weddingId}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Get seating dashboard data error:", error);
    return null;
  }
}

// ======================
// Current wedding management
// ======================

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
    const data = await response.json();
    // Handle paginated response from DRF
    return data.results || data || [];
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
    
    const response = await authFetch(`${API_URL}/wedding_planner/guests/stats/?wedding=${weddingId}`);
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
    
    const response = await authFetch(`${API_URL}/wedding_planner/events/?wedding=${weddingId}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.results || data || [];
  } catch (error) {
    console.error("Get events error:", error);
    return [];
  }
}

export async function getCurrentEvent(): Promise<WeddingEvent | null> {
  try {
    const weddingId = await getCurrentWeddingId();
    if (!weddingId) return null;
    
    const response = await authFetch(`${API_URL}/wedding_planner/events/current/?wedding=${weddingId}`);
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
    
    const response = await authFetch(`${API_URL}/wedding_planner/tables/?wedding=${weddingId}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.results || data || [];
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

export async function assignSeat(
  guestData: { guest_id: number; attendee_type: string; child_id?: number },
  tableId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await authFetch(`${API_URL}/wedding_planner/seating/`, {
      method: "POST",
      body: JSON.stringify({
        guest: guestData.guest_id,
        table: tableId,
        attendee_type: guestData.attendee_type,
        child: guestData.child_id,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.error || error.detail || error.table?.[0] || "Failed to assign seat" };
    }

    return { success: true };
  } catch (error) {
    console.error("Assign seat error:", error);
    return { success: false, error: "Network error" };
  }
}

export async function unassignSeat(assignmentId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await authFetch(`${API_URL}/wedding_planner/seating/${assignmentId}/`, {
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

export async function getUnassignedGuests(): Promise<any[]> {
  try {
    const weddingId = await getCurrentWeddingId();
    if (!weddingId) return [];
    
    const response = await authFetch(`${API_URL}/wedding_planner/seating/unassigned-guests/?wedding=${weddingId}`);
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.guests || [];
  } catch (error) {
    console.error("Get unassigned guests error:", error);
    return [];
  }
}

export async function getSeatingStats(): Promise<SeatingStats | null> {
  try {
    const weddingId = await getCurrentWeddingId();
    if (!weddingId) return null;
    
    const response = await authFetch(`${API_URL}/wedding_planner/tables/summary/?wedding=${weddingId}`);
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
    
    const response = await authFetch(`${API_URL}/wedding_planner/meal-choices/?wedding=${weddingId}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.results || data || [];
  } catch (error) {
    console.error("Get meal choices error:", error);
    return [];
  }
}

export async function createMealChoice(
  data: Partial<MealChoice>,
  imageFile?: File | null
): Promise<{ success: boolean; meal?: MealChoice; error?: string }> {
  try {
    const weddingId = await getCurrentWeddingId();
    if (!weddingId) return { success: false, error: "No wedding selected" };

    // Use FormData if there's an image, otherwise use JSON
    if (imageFile) {
      const formData = new FormData();
      formData.append("name", data.name || "");
      formData.append("description", data.description || "");
      formData.append("meal_type", data.meal_type || "meat");
      formData.append("is_available", String(data.is_available ?? true));
      formData.append("wedding", String(weddingId));
      formData.append("image", imageFile);
      
      // Add allergens as JSON string
      if (data.contains_allergens) {
        formData.append("contains_allergens", JSON.stringify(data.contains_allergens));
      }

      const response = await authFetch(`${API_URL}/wedding_planner/meal-choices/`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return { success: false, error: error.detail || "Failed to create meal" };
      }

      const meal = await response.json();
      return { success: true, meal };
    }

    // No image - use regular JSON
    const response = await authFetch(`${API_URL}/wedding_planner/meal-choices/`, {
      method: "POST",
      body: JSON.stringify({ 
        ...data, 
        wedding: weddingId,
        contains_allergens: data.contains_allergens || [],
      }),
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

export async function getMealChoicesByGuestCode(guestCode: string): Promise<MealChoice[]> {
  try {
    const response = await fetch(`${API_URL}/wedding_planner/meal-choices/by-guest-code/${guestCode}/`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Get meal choices by guest code error:", error);
    return [];
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
    
    const response = await authFetch(`${API_URL}/wedding_planner/guests/send-bulk-reminders/?wedding=${weddingId}`, {
      method: "POST",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { success: false, error: error.detail || "Failed to send reminders" };
    }

    const resData = await response.json();
    return { success: true, count: resData.sent_successfully };
  } catch (error) {
    console.error("Send bulk reminders error:", error);
    return { success: false, error: "Network error" };
  }
}

// ======================
// PDF REPORT GENERATION
// ======================

export async function getWeddingReportPdfUrl(): Promise<string> {
  /**
   * Returns the URL for downloading the wedding report PDF.
   * The actual download is handled client-side to properly handle the file.
   */
  return `${API_URL}/wedding_planner/weddings/generate-report/`;
}
