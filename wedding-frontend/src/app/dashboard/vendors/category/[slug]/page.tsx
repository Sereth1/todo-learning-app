"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { VendorListItem, VendorCategory, VendorCategoryListItem, VendorFilters } from "@/types";
import { getVendorsByCategory, getVendorCategories, toggleSaveVendor, getVendors } from "@/actions/vendors";
import { VendorCard, VendorFiltersComponent } from "@/components/vendors";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Store } from "lucide-react";

export default function CategoryVendorsPage() {
  const params = useParams();
  const router = useRouter();
  const categorySlug = params.slug as string;

  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const [currentCategory, setCurrentCategory] = useState<VendorCategory | null>(null);
  const [categories, setCategories] = useState<VendorCategoryListItem[]>([]);
  const [savedVendorIds, setSavedVendorIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<VendorFilters>({});

  // Load initial data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [vendorsResult, categoriesResult] = await Promise.all([
          getVendorsByCategory(categorySlug),
          getVendorCategories({ compact: true }),
        ]);

        if (vendorsResult.success && vendorsResult.data) {
          setVendors(vendorsResult.data.vendors);
          setCurrentCategory(vendorsResult.data.category);
        }
        if (categoriesResult.success && categoriesResult.data) {
          setCategories(categoriesResult.data as unknown as VendorCategoryListItem[]);
        }
      } catch (error) {
        console.error("Failed to load vendors:", error);
        toast.error("Failed to load vendors");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [categorySlug]);

  // Handle filter changes - refetch from BE
  const handleFiltersChange = useCallback(async (newFilters: VendorFilters) => {
    setFilters(newFilters);
    
    // If we have filters, use getVendors with category filter
    if (currentCategory) {
      setIsLoading(true);
      const result = await getVendors({
        ...newFilters,
        category: currentCategory.id,
      });
      if (result.success && result.data) {
        setVendors(result.data);
      }
      setIsLoading(false);
    }
  }, [currentCategory]);

  // Handle save toggle
  const handleSaveToggle = useCallback(async (vendorId: number) => {
    const result = await toggleSaveVendor(vendorId);
    if (result.success) {
      setSavedVendorIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(vendorId)) {
          newSet.delete(vendorId);
          toast.success("Vendor removed from saved");
        } else {
          newSet.add(vendorId);
          toast.success("Vendor saved");
        }
        return newSet;
      });
    } else {
      toast.error("Failed to save vendor");
    }
  }, []);

  if (isLoading && !currentCategory) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/vendors">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentCategory?.name || "Category"}
            </h1>
            <p className="text-gray-500">
              {vendors.length} vendor{vendors.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>

        {/* Quick category switch */}
        <Select 
          value={categorySlug} 
          onValueChange={(value) => router.push(`/dashboard/vendors/category/${value}`)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.slug}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filters */}
      <VendorFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
        categories={categories}
        showCategoryFilter={false}
      />

      {/* Vendors Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : vendors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendors.map((vendor) => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              onSave={handleSaveToggle}
              isSaved={savedVendorIds.has(vendor.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            No vendors found
          </h3>
          <p className="text-gray-500 mb-6">
            No vendors match your current filters in this category
          </p>
          <Button 
            variant="outline" 
            onClick={() => handleFiltersChange({})}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
