"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Vendor, VendorReview, VendorReviewCreateData } from "@/types";
import { getVendorFull, toggleSaveVendor, createVendorReview, markReviewHelpful } from "@/actions/vendors";
import { toast } from "sonner";

interface UseVendorOptions {
  onNotFound?: () => void;
}

interface UseVendorReturn {
  vendor: Vendor | null;
  reviews: VendorReview[];
  isLoading: boolean;
  isSaved: boolean;
  isSubmittingReview: boolean;
  toggleSave: () => Promise<void>;
  submitReview: (data: Omit<VendorReviewCreateData, "vendor">) => Promise<boolean>;
  markHelpful: (reviewId: number) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useVendor(
  vendorId: number | null,
  options?: UseVendorOptions
): UseVendorReturn {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [reviews, setReviews] = useState<VendorReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Use ref for options to avoid infinite re-render when caller doesn't memoize
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const fetchVendor = useCallback(async () => {
    if (!vendorId) return;

    setIsLoading(true);
    try {
      // Single API call for vendor, reviews, and saved status
      const result = await getVendorFull(vendorId);

      if (result.success && result.data) {
        setVendor(result.data.vendor);
        setReviews(result.data.reviews);
        setIsSaved(result.data.is_saved);
      } else {
        toast.error("Vendor not found");
        optionsRef.current?.onNotFound?.();
      }
    } catch {
      toast.error("Failed to load vendor");
    } finally {
      setIsLoading(false);
    }
  }, [vendorId]);

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

  const submitReview = useCallback(
    async (data: Omit<VendorReviewCreateData, "vendor">): Promise<boolean> => {
      if (!vendorId) return false;

      setIsSubmittingReview(true);
      try {
        const result = await createVendorReview({
          vendor: vendorId,
          ...data,
        });

        if (result.success && result.data) {
          setReviews((prev) => [result.data!, ...prev]);
          toast.success("Review submitted successfully");
          return true;
        } else {
          toast.error(result.error || "Failed to submit review");
          return false;
        }
      } catch {
        toast.error("Failed to submit review");
        return false;
      } finally {
        setIsSubmittingReview(false);
      }
    },
    [vendorId]
  );

  const markHelpful = useCallback(async (reviewId: number) => {
    const result = await markReviewHelpful(reviewId);
    if (result.success && result.data) {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, helpful_count: result.data!.helpful_count } : r
        )
      );
    }
  }, []);

  return {
    vendor,
    reviews,
    isLoading,
    isSaved,
    isSubmittingReview,
    toggleSave,
    submitReview,
    markHelpful,
    refetch: fetchVendor,
  };
}
