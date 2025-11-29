"use server";

import { cookies } from "next/headers";
import type { User, AuthTokens, LoginCredentials, RegisterData } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Token management
export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("access_token")?.value || null;
}

export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("refresh_token")?.value || null;
}

export async function setTokens(tokens: AuthTokens): Promise<void> {
  const cookieStore = await cookies();
  
  // Set access token (short-lived)
  cookieStore.set("access_token", tokens.access, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60, // 1 hour
    path: "/",
  });
  
  // Set refresh token (longer-lived)
  cookieStore.set("refresh_token", tokens.refresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function clearTokens(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  cookieStore.delete("current_wedding_id");
}

// Auth API calls
export async function login(credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: credentials.email, // Django uses username, but our model uses email
        password: credentials.password,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { 
        success: false, 
        error: error.detail || "Invalid email or password" 
      };
    }

    const tokens: AuthTokens = await response.json();
    await setTokens(tokens);
    
    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "Network error. Please try again." };
  }
}

export async function register(data: RegisterData): Promise<{ success: boolean; error?: string }> {
  try {
    // First register the user
    const response = await fetch(`${API_URL}/auth/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      // Handle different error formats
      if (error.email) {
        return { success: false, error: error.email[0] };
      }
      if (error.password) {
        return { success: false, error: error.password[0] };
      }
      return { 
        success: false, 
        error: error.detail || error.message || "Registration failed" 
      };
    }

    // Auto-login after registration
    return await login({ email: data.email, password: data.password });
  } catch (error) {
    console.error("Register error:", error);
    return { success: false, error: "Network error. Please try again." };
  }
}

export async function logout(): Promise<void> {
  await clearTokens();
}

export async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return false;

    const response = await fetch(`${API_URL}/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      await clearTokens();
      return false;
    }

    const data = await response.json();
    const cookieStore = await cookies();
    
    cookieStore.set("access_token", data.access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60,
      path: "/",
    });

    return true;
  } catch (error) {
    console.error("Token refresh error:", error);
    return false;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const token = await getAccessToken();
    if (!token) return null;

    const response = await fetch(`${API_URL}/auth/me/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Try to refresh
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          return getCurrentUser();
        }
      }
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Get user error:", error);
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  return !!token;
}

// Helper for authenticated API calls
export async function authFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  let token = await getAccessToken();
  
  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  // If unauthorized, try refresh
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      token = await getAccessToken();
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    }
  }

  return response;
}
