"use client";

import { useState, useEffect, useCallback } from "react";
import { VendorOffer } from "@/types";
import {
  getVendorOffers,
  createVendorOffer,
  updateVendorOffer,
  deleteVendorOffer,
} from "@/actions/vendors";
import { toast } from "sonner";

interface UseVendorOffersReturn {
  offers: VendorOffer[];
  isLoading: boolean;
  isSaving: boolean;
  createOffer: (data: Partial<VendorOffer>) => Promise<boolean>;
  updateOffer: (id: number, data: Partial<VendorOffer>) => Promise<boolean>;
  deleteOffer: (id: number) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useVendorOffers(vendorId: number | null): UseVendorOffersReturn {
  const [offers, setOffers] = useState<VendorOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchOffers = useCallback(async () => {
    if (!vendorId) return;

    setIsLoading(true);
    try {
      const result = await getVendorOffers(vendorId);
      if (result.success && result.data) {
        setOffers(result.data as VendorOffer[]);
      }
    } catch (error) {
      console.error("Failed to load offers:", error);
    } finally {
      setIsLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const createOffer = useCallback(
    async (data: Partial<VendorOffer>): Promise<boolean> => {
      if (!vendorId) return false;

      setIsSaving(true);
      try {
        const result = await createVendorOffer({ ...data, vendor: vendorId });
        if (result.success && result.data) {
          setOffers((prev) => [...prev, result.data!]);
          toast.success("Offer created!");
          return true;
        } else {
          toast.error(result.error || "Failed to create offer");
          return false;
        }
      } catch {
        toast.error("Failed to create offer");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [vendorId]
  );

  const updateOfferById = useCallback(
    async (id: number, data: Partial<VendorOffer>): Promise<boolean> => {
      setIsSaving(true);
      try {
        const result = await updateVendorOffer(id, data);
        if (result.success && result.data) {
          setOffers((prev) => prev.map((o) => (o.id === id ? result.data! : o)));
          toast.success("Offer updated!");
          return true;
        } else {
          toast.error(result.error || "Failed to update offer");
          return false;
        }
      } catch {
        toast.error("Failed to update offer");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  const deleteOfferById = useCallback(async (id: number): Promise<boolean> => {
    try {
      const result = await deleteVendorOffer(id);
      if (result.success) {
        setOffers((prev) => prev.filter((o) => o.id !== id));
        toast.success("Offer deleted!");
        return true;
      } else {
        toast.error(result.error || "Failed to delete offer");
        return false;
      }
    } catch {
      toast.error("Failed to delete offer");
      return false;
    }
  }, []);

  return {
    offers,
    isLoading,
    isSaving,
    createOffer,
    updateOffer: updateOfferById,
    deleteOffer: deleteOfferById,
    refetch: fetchOffers,
  };
}
