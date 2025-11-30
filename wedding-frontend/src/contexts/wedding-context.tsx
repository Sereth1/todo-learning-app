"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { Wedding } from "@/types";
import { getMyWeddings } from "@/actions/wedding";

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
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [selectedWedding, setSelectedWedding] = useState<Wedding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeddings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getMyWeddings();
      setWeddings(data);
      // Auto-select first wedding if none selected
      if (data.length > 0 && !selectedWedding) {
        setSelectedWedding(data[0]);
      }
    } catch {
      setError("Failed to fetch weddings");
    } finally {
      setIsLoading(false);
    }
  }, [selectedWedding]);

  useEffect(() => {
    fetchWeddings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save selected wedding to localStorage
  useEffect(() => {
    if (selectedWedding) {
      localStorage.setItem("selectedWeddingId", selectedWedding.id.toString());
    }
  }, [selectedWedding]);

  // Restore selected wedding from localStorage on mount
  useEffect(() => {
    const savedId = localStorage.getItem("selectedWeddingId");
    if (savedId && weddings.length > 0) {
      const wedding = weddings.find((w) => w.id === parseInt(savedId));
      if (wedding) {
        setSelectedWedding(wedding);
      }
    }
  }, [weddings]);

  return (
    <WeddingContext.Provider
      value={{
        weddings,
        selectedWedding,
        setSelectedWedding,
        isLoading,
        error,
        refreshWeddings: fetchWeddings,
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
