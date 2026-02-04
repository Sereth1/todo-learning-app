"use server";

/**
 * Core wedding actions: CRUD, dashboard, current wedding management.
 * Split from the original monolithic wedding.ts for maintainability.
 */

import { cookies } from "next/headers";
import { authFetch } from "./auth";
import type { Wedding, WeddingCreateData, GuestStats, SeatingStats, WeddingEvent } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// ==============================
// Dashboard Data (single API call)
// ==============================

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
  } catch {
    return null;
  }
}

// ==============================
// Current Wedding Management
// ==============================

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

// ==============================
// Wedding CRUD
// ==============================

export async function getMyWeddings(): Promise<Wedding[]> {
  try {
    const response = await authFetch(`${API_URL}/wedding_planner/weddings/`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.results || data || [];
  } catch {
    return [];
  }
}

export async function getWedding(id: number): Promise<Wedding | null> {
  try {
    const response = await authFetch(`${API_URL}/wedding_planner/weddings/${id}/`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
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
  } catch {
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
  } catch {
    return { success: false, error: "Network error" };
  }
}

// ==============================
// PDF Report
// ==============================

export async function getWeddingReportPdfUrl(): Promise<string> {
  return `${API_URL}/wedding_planner/weddings/generate-report/`;
}
