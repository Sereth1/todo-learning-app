import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { weddingApi } from '../api/wedding';
import type { Wedding } from '../types';
import { useAuth } from './AuthContext';

interface WeddingContextType {
  currentWedding: Wedding | null;
  weddings: Wedding[];
  isLoading: boolean;
  setCurrentWedding: (wedding: Wedding | null) => void;
  refreshWeddings: () => Promise<void>;
}

const WeddingContext = createContext<WeddingContextType | undefined>(undefined);

export const WeddingProvider = ({ children }: { children: ReactNode }) => {
  const [currentWedding, setCurrentWedding] = useState<Wedding | null>(null);
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      refreshWeddings();
    }
  }, [isAuthenticated]);

  const refreshWeddings = async () => {
    setIsLoading(true);
    try {
      const data = await weddingApi.getMyWeddings();
      setWeddings(data);
      
      // Auto-select first wedding if none selected
      if (data.length > 0 && !currentWedding) {
        setCurrentWedding(data[0]);
      }
    } catch (error) {
      console.error('Refresh weddings error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WeddingContext.Provider
      value={{
        currentWedding,
        weddings,
        isLoading,
        setCurrentWedding,
        refreshWeddings,
      }}
    >
      {children}
    </WeddingContext.Provider>
  );
};

export const useWedding = () => {
  const context = useContext(WeddingContext);
  if (!context) {
    throw new Error('useWedding must be used within WeddingProvider');
  }
  return context;
};
