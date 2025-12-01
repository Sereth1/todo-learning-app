"use client";

import { useState, useEffect, useCallback } from "react";
import { VendorReview, VendorReviewCreateData } from "@/types";
import { getVendorReviews, createVendorReview, markReviewHelpful } from "@/actions/vendors";
import { toast } from "sonner";

interface UseVendorReviewsReturn {
  reviews: VendorReview[];
  isLoading: boolean;
  isSubmitting: boolean;
  submitReview: (data: Omit<VendorReviewCreateData, "vendor">) => Promise<boolean>;
  markHelpful: (reviewId: number) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useVendorReviews(vendorId: number | null): UseVendorReviewsReturn {
  const [reviews, setReviews] = useState<VendorReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!vendorId) return;

    setIsLoading(true);
    try {
      const result = await getVendorReviews(vendorId);
      if (result.success && result.data) {
        setReviews(result.data);
      }
    } catch (error) {
      console.error("Failed to load reviews:", error);
    } finally {
      setIsLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const submitReview = useCallback(
    async (data: Omit<VendorReviewCreateData, "vendor">): Promise<boolean> => {
      if (!vendorId) return false;

      setIsSubmitting(true);
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
        setIsSubmitting(false);
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
    reviews,
    isLoading,
    isSubmitting,
    submitReview,
    markHelpful,
    refetch: fetchReviews,
  };
}
