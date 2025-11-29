"use server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Guest Actions
export async function getGuestByCode(code: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/wedding_planner/guests/by-code/${code}/`, {
      cache: "no-store",
    });
    if (!res.ok) {
      if (res.status === 404) return { error: "Guest not found" };
      throw new Error("Failed to fetch guest");
    }
    return await res.json();
  } catch {
    return { error: "Failed to fetch guest" };
  }
}

export async function getGuests() {
  try {
    const res = await fetch(`${API_BASE_URL}/wedding_planner/guests/`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch guests");
    return await res.json();
  } catch {
    return [];
  }
}

export async function getGuestStats() {
  try {
    const res = await fetch(`${API_BASE_URL}/wedding_planner/guests/stats/`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch stats");
    return await res.json();
  } catch {
    return null;
  }
}

export async function submitRSVP(guestId: number, data: {
  attending: boolean;
  is_plus_one_coming?: boolean;
  has_children?: boolean;
}) {
  try {
    const res = await fetch(`${API_BASE_URL}/wedding_planner/guests/${guestId}/rsvp/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to submit RSVP");
    return await res.json();
  } catch {
    return { error: "Failed to submit RSVP" };
  }
}

// Event Actions
export async function getCurrentEvent() {
  try {
    const res = await fetch(`${API_BASE_URL}/wedding_planner/events/current/`, {
      cache: "no-store",
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error("Failed to fetch event");
    }
    return await res.json();
  } catch {
    return null;
  }
}

export async function getEventCountdown(eventId: number) {
  try {
    const res = await fetch(`${API_BASE_URL}/wedding_planner/events/${eventId}/countdown/`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch countdown");
    return await res.json();
  } catch {
    return null;
  }
}

// Meal Actions
export async function getMealChoices() {
  try {
    const res = await fetch(`${API_BASE_URL}/wedding_planner/meal-choices/`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch meals");
    return await res.json();
  } catch {
    return [];
  }
}

export async function getMealsByType() {
  try {
    const res = await fetch(`${API_BASE_URL}/wedding_planner/meal-choices/by-type/`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch meals");
    return await res.json();
  } catch {
    return {};
  }
}

export async function getMealSummary() {
  try {
    const res = await fetch(`${API_BASE_URL}/wedding_planner/meal-selections/summary/`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch summary");
    return await res.json();
  } catch {
    return null;
  }
}

// Seating Actions
export async function getTables() {
  try {
    const res = await fetch(`${API_BASE_URL}/wedding_planner/tables/`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch tables");
    return await res.json();
  } catch {
    return [];
  }
}

export async function getSeatingStats() {
  try {
    const res = await fetch(`${API_BASE_URL}/wedding_planner/tables/summary/`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch stats");
    return await res.json();
  } catch {
    return null;
  }
}

export async function getUnassignedGuests() {
  try {
    const res = await fetch(`${API_BASE_URL}/wedding_planner/seating/unassigned-guests/`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch unassigned guests");
    return await res.json();
  } catch {
    return { count: 0, guests: [] };
  }
}

export async function assignGuestToTable(tableId: number, guestId: number, seatNumber?: number) {
  try {
    const res = await fetch(`${API_BASE_URL}/wedding_planner/tables/${tableId}/assign-guest/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guest_id: guestId, seat_number: seatNumber }),
    });
    if (!res.ok) throw new Error("Failed to assign guest");
    return await res.json();
  } catch {
    return { error: "Failed to assign guest" };
  }
}

// Reminder Actions
export async function sendReminder(guestId: number, deadline: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/wedding_planner/guests/${guestId}/send-reminder/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deadline }),
    });
    if (!res.ok) throw new Error("Failed to send reminder");
    return await res.json();
  } catch {
    return { error: "Failed to send reminder" };
  }
}

export async function sendBulkReminders(deadline: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/wedding_planner/guests/send-bulk-reminders/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deadline }),
    });
    if (!res.ok) throw new Error("Failed to send reminders");
    return await res.json();
  } catch {
    return { error: "Failed to send reminders" };
  }
}

// Create Guest Action (for testing/admin)
export async function createGuest(data: {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}) {
  try {
    const res = await fetch(`${API_BASE_URL}/wedding_planner/guests/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create guest");
    return await res.json();
  } catch {
    return { error: "Failed to create guest" };
  }
}

// Create Event Action (for testing/admin)
export async function createEvent(data: {
  name: string;
  event_date: string;
  venue_name: string;
  venue_address: string;
  rsvp_deadline: string;
  is_active?: boolean;
}) {
  try {
    const res = await fetch(`${API_BASE_URL}/wedding_planner/events/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, is_active: data.is_active ?? true }),
    });
    if (!res.ok) throw new Error("Failed to create event");
    return await res.json();
  } catch {
    return { error: "Failed to create event" };
  }
}

// Delete Guest Action
export async function deleteGuest(guestId: number) {
  try {
    const res = await fetch(`${API_BASE_URL}/wedding_planner/guests/${guestId}/`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete guest");
    return { success: true };
  } catch {
    return { error: "Failed to delete guest" };
  }
}

// Update Guest Action
export async function updateGuest(guestId: number, data: Partial<{
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  attendance_status: string;
  is_plus_one_coming: boolean;
  has_children: boolean;
}>) {
  try {
    const res = await fetch(`${API_BASE_URL}/wedding_planner/guests/${guestId}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update guest");
    return await res.json();
  } catch {
    return { error: "Failed to update guest" };
  }
}

