"use client";

import { useState, useEffect, useCallback } from "react";
import { Vendor } from "@/types";
import { getVendor, toggleSaveVendor, checkVendorSaved } from "@/actions/vendors";
import { toast } from "sonner";

interface UseVendorOptions {
  onNotFound?: () => void;
}

interface UseVendorReturn {
  vendor: Vendor | null;
  isLoading: boolean;
  isSaved: boolean;
  toggleSave: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useVendor(
  vendorId: number | null,
  options?: UseVendorOptions
): UseVendorReturn {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const fetchVendor = useCallback(async () => {
    if (!vendorId) return;

    setIsLoading(true);
    try {
      const [vendorResult, savedResult] = await Promise.all([
        getVendor(vendorId),
        checkVendorSaved(vendorId),
      ]);

      if (vendorResult.success && vendorResult.data) {
        setVendor(vendorResult.data);
      } else {
        toast.error("Vendor not found");
        options?.onNotFound?.();
        return;
      }

      if (savedResult.success && savedResult.data) {
        setIsSaved(savedResult.data.saved);
      }
    } catch (error) {
      console.error("Failed to load vendor:", error);
      toast.error("Failed to load vendor");
    } finally {
      setIsLoading(false);
    }
  }, [vendorId, options]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  const toggleSave = useCallback(async () => {
    if (!vendorId) return;

    const result = await toggleSaveVendor(vendorId);
    if (result.success && result.data) {
      setIsSaved(result.data.saved);
      toast.success(result.data.saved ? "Vendor saved" : "Vendor removed from saved");
    } else {
      toast.error("Failed to update saved status");
    }
  }, [vendorId]);

  return {
    vendor,
    isLoading,
    isSaved,
    toggleSave,
    refetch: fetchVendor,
  };
}
