"use client";

import { useState, useMemo } from "react";
import { useDebounce } from "./use-debounce";

interface UseSearchOptions<T> {
  data: T[];
  searchFields: (keyof T)[];
  debounceMs?: number;
}

export function useSearch<T>({ data, searchFields, debounceMs = 300 }: UseSearchOptions<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, debounceMs);

  const filteredData = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return data;
    }

    const query = debouncedQuery.toLowerCase();
    
    return data.filter((item) =>
      searchFields.some((field) => {
        const value = item[field];
        if (typeof value === "string") {
          return value.toLowerCase().includes(query);
        }
        if (typeof value === "number") {
          return value.toString().includes(query);
        }
        return false;
      })
    );
  }, [data, debouncedQuery, searchFields]);

  return {
    searchQuery,
    setSearchQuery,
    filteredData,
    isSearching: searchQuery !== debouncedQuery,
    hasResults: filteredData.length > 0,
    resultCount: filteredData.length,
  };
}

// Hook for filtering by multiple criteria
interface UseFiltersOptions<T> {
  data: T[];
  initialFilters?: Partial<Record<keyof T, unknown>>;
}

export function useFilters<T>({ data, initialFilters = {} }: UseFiltersOptions<T>) {
  const [filters, setFilters] = useState<Partial<Record<keyof T, unknown>>>(initialFilters);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === undefined || value === null || value === "") {
          return true;
        }
        const itemValue = item[key as keyof T];
        if (Array.isArray(value)) {
          return value.includes(itemValue);
        }
        return itemValue === value;
      });
    });
  }, [data, filters]);

  const setFilter = (key: keyof T, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const clearFilter = (key: keyof T) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return {
    filters,
    filteredData,
    setFilter,
    setFilters,
    clearFilters,
    clearFilter,
    activeFilterCount: Object.values(filters).filter((v) => v !== undefined && v !== null && v !== "").length,
  };
}
