"use server";

import { authFetch } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Generic API request helper that wraps authFetch with consistent response format
 */
export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;
    const response = await authFetch(url, options);

    if (!response.ok) {
      let errorMessage = "Request failed";
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.error || JSON.stringify(errorData);
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      return { success: false, error: errorMessage };
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return { success: true };
    }

    const data = await response.json();
    // Handle DRF paginated response
    const result = data.results !== undefined ? data.results : data;
    return { success: true, data: result as T };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    console.error("API request error:", message);
    return { success: false, error: message };
  }
}

/**
 * Public API request (no authentication required)
 */
export async function publicApiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;
    
    // Don't set Content-Type for FormData - browser will set it with boundary
    const isFormData = options?.body instanceof FormData;
    const headers: HeadersInit = isFormData 
      ? { ...options?.headers }
      : { "Content-Type": "application/json", ...options?.headers };
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = "Request failed";
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.error || JSON.stringify(errorData);
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      return { success: false, error: errorMessage };
    }

    if (response.status === 204) {
      return { success: true };
    }

    const data = await response.json();
    const result = data.results !== undefined ? data.results : data;
    return { success: true, data: result as T };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    console.error("Public API request error:", message);
    return { success: false, error: message };
  }
}
