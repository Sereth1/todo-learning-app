"use client";

/**
 * WeddingContext - thin wrapper around AuthContext for dashboard use.
 *
 * Previously this maintained its own separate wedding state (weddings list,
 * selectedWedding, localStorage persistence) which duplicated AuthContext.
 * Now it delegates entirely to AuthContext, providing a consistent interface
 * for dashboard components without duplicate state management.
 *
 * This keeps the WeddingProvider in the dashboard layout for future
 * dashboard-specific state if needed, while eliminating the state duplication bug
 * where selecting a wedding in one context didn't update the other.
 */

import { createContext, useContext, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import type { Wedding } from "@/types";

interface WeddingContextType {
  weddings: Wedding[];
  selectedWedding: Wedding | null;
  setSelectedWedding: (wedding: Wedding | null) => void;
  isLoading: boolean;
  error: string | null;
  refreshWeddings: () => Promise<void>;
}

const WeddingContext = createContext<WeddingContextType | undefined>(undefined);

export function WeddingProvider({ children }: { children: ReactNode }) {
  const { wedding, weddings, selectWedding, refreshWeddings, isLoading } = useAuth();

  const setSelectedWedding = (w: Wedding | null) => {
    if (w) {
      selectWedding(w.id);
    }
  };

  return (
    <WeddingContext.Provider
      value={{
        weddings,
        selectedWedding: wedding,
        setSelectedWedding,
        isLoading,
        error: null,
        refreshWeddings,
      }}
    >
      {children}
    </WeddingContext.Provider>
  );
}

export function useWedding() {
  const context = useContext(WeddingContext);
  if (context === undefined) {
    throw new Error("useWedding must be used within a WeddingProvider");
  }
  return context;
}
