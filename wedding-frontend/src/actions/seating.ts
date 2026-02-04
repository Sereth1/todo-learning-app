"use server";

import { authFetch } from "./auth";
import { getCurrentWeddingId } from "./wedding-core";
import type { Table, SeatingStats, SeatingGuest } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// ==============================
// Seating Dashboard (single API call)
// ==============================

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
  } catch {
    return null;
  }
}

// ==============================
// Tables
// ==============================

export async function getTables(): Promise<Table[]> {
  try {
    const weddingId = await getCurrentWeddingId();
    if (!weddingId) return [];

    const response = await authFetch(`${API_URL}/wedding_planner/tables/?wedding=${weddingId}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.results || data || [];
  } catch {
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
  } catch {
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
  } catch {
    return { success: false, error: "Network error" };
  }
}

// ==============================
// Seating Assignments
// ==============================

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
  } catch {
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
  } catch {
    return { success: false, error: "Network error" };
  }
}

export async function getUnassignedGuests(): Promise<SeatingGuest[]> {
  try {
    const weddingId = await getCurrentWeddingId();
    if (!weddingId) return [];

    const response = await authFetch(`${API_URL}/wedding_planner/seating/unassigned-guests/?wedding=${weddingId}`);
    if (!response.ok) return [];

    const data = await response.json();
    return data.guests || [];
  } catch {
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
  } catch {
    return null;
  }
}
