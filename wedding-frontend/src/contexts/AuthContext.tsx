"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { User, Wedding } from "@/types";

interface AuthContextType {
  user: User | null;
  wedding: Wedding | null;
  weddings: Wedding[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { email: string; password: string; first_name: string; last_name: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  selectWedding: (weddingId: number) => Promise<void>;
  refreshWeddings: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_PATHS = ["/", "/login", "/register", "/rsvp"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const isPublicPath = PUBLIC_PATHS.some(path => 
    pathname === path || pathname.startsWith("/rsvp/")
  );

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  const refreshWeddings = useCallback(async () => {
    try {
      const res = await fetch("/api/weddings");
      if (res.ok) {
        const data = await res.json();
        setWeddings(data.weddings || []);
        
        // Set current wedding if available
        if (data.currentWedding) {
          setWedding(data.currentWedding);
        } else if (data.weddings?.length > 0) {
          setWedding(data.weddings[0]);
        }
      }
    } catch {
      setWeddings([]);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await refreshUser();
      await refreshWeddings();
      setIsLoading(false);
    };
    init();
  }, [refreshUser, refreshWeddings]);

  useEffect(() => {
    if (!isLoading && !user && !isPublicPath) {
      router.push("/login");
    }
  }, [isLoading, user, isPublicPath, router]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        return { success: false, error: data.error || "Login failed" };
      }

      await refreshUser();
      await refreshWeddings();
      
      // Redirect based on weddings
      const weddingsRes = await fetch("/api/weddings");
      const weddingsData = await weddingsRes.json();
      
      if (weddingsData.weddings?.length > 0) {
        router.push("/dashboard");
      } else {
        router.push("/create-wedding");
      }
      
      return { success: true };
    } catch {
      return { success: false, error: "Network error" };
    }
  };

  const register = async (data: { email: string; password: string; first_name: string; last_name: string }) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await res.json();
      
      if (!res.ok) {
        return { success: false, error: resData.error || "Registration failed" };
      }

      await refreshUser();
      router.push("/create-wedding");
      
      return { success: true };
    } catch {
      return { success: false, error: "Network error" };
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setWedding(null);
    setWeddings([]);
    router.push("/");
  };

  const selectWedding = async (weddingId: number) => {
    try {
      await fetch("/api/weddings/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weddingId }),
      });
      
      const selected = weddings.find(w => w.id === weddingId);
      if (selected) {
        setWedding(selected);
      }
    } catch (error) {
      console.error("Select wedding error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        wedding,
        weddings,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
        selectWedding,
        refreshWeddings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
