"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Vendor, VendorCategory, VendorCreateData, VendorPriceRange, VendorBookingStatus } from "@/types";
import { getVendor, updateVendor, getVendorCategories } from "@/actions/vendors";
import { toast } from "sonner";

export function useEditVendor(vendorId: number) {
  const router = useRouter();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [categories, setCategories] = useState<VendorCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<VendorCreateData>>({});

  // Load vendor and categories
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [vendorResult, categoriesResult] = await Promise.all([
          getVendor(vendorId),
          getVendorCategories(),
        ]);

        if (vendorResult.success && vendorResult.data) {
          setVendor(vendorResult.data);
          // Initialize form with vendor data
          setFormData({
            name: vendorResult.data.name,
            category: vendorResult.data.category,
            tagline: vendorResult.data.tagline,
            description: vendorResult.data.description,
            primary_image_url: vendorResult.data.primary_image_url,
            email: vendorResult.data.email,
            phone: vendorResult.data.phone,
            website: vendorResult.data.website,
            address_line1: vendorResult.data.address,
            address_line2: vendorResult.data.address_line_2,
            city: vendorResult.data.city,
            state: vendorResult.data.state,
            postal_code: vendorResult.data.postal_code,
            country: vendorResult.data.country,
            price_range: vendorResult.data.price_range,
            min_price: vendorResult.data.min_price,
            max_price: vendorResult.data.max_price,
            currency: vendorResult.data.currency,
            booking_status: vendorResult.data.booking_status,
            is_verified: vendorResult.data.is_verified,
            is_featured: vendorResult.data.is_featured,
            is_eco_friendly: vendorResult.data.is_eco_friendly,
            years_in_business: vendorResult.data.years_in_business,
            instagram_url: vendorResult.data.instagram_url,
            facebook_url: vendorResult.data.facebook_url,
            pinterest_url: vendorResult.data.pinterest_url,
            tiktok_url: vendorResult.data.tiktok_url,
            youtube_url: vendorResult.data.youtube_url,
          });
        } else {
          toast.error("Vendor not found");
          router.push("/dashboard/vendors");
        }

        if (categoriesResult.success && categoriesResult.data) {
          setCategories(categoriesResult.data);
        }
      } catch (error) {
        console.error("Failed to load vendor:", error);
        toast.error("Failed to load vendor");
      } finally {
        setIsLoading(false);
      }
    }

    if (vendorId) {
      loadData();
    }
  }, [vendorId, router]);

  // Form handlers
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: type === "number" ? (value ? parseFloat(value) : undefined) : value,
      }));
    },
    []
  );

  const handleSelectChange = useCallback(
    (name: string) => (value: string) => {
      if (name === "category") {
        setFormData((prev) => ({ ...prev, category: parseInt(value) }));
      } else if (name === "price_range") {
        setFormData((prev) => ({ ...prev, price_range: value as VendorPriceRange }));
      } else if (name === "booking_status") {
        setFormData((prev) => ({ ...prev, booking_status: value as VendorBookingStatus }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    },
    []
  );

  const handleCheckboxChange = useCallback(
    (name: string) => (checked: boolean) => {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      setIsSaving(true);

      try {
        const result = await updateVendor(vendorId, formData);
        if (result.success) {
          toast.success("Vendor updated successfully!");
          router.push(`/dashboard/vendors/${vendorId}`);
        } else {
          toast.error(result.error || "Failed to update vendor");
        }
      } catch {
        toast.error("Failed to update vendor");
      } finally {
        setIsSaving(false);
      }
    },
    [vendorId, formData, router]
  );

  return {
    vendor,
    categories,
    formData,
    isLoading,
    isSaving,
    handleChange,
    handleSelectChange,
    handleCheckboxChange,
    handleSubmit,
  };
}
