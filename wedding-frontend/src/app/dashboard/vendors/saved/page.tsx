"use client";

import { useEffect, useState, useCallback } from "react";
import { SavedVendor, VendorCategoryListItem } from "@/types";
import { getSavedVendors, unsaveVendor, getVendorCategories } from "@/actions/vendors";
import { VendorCard } from "@/components/vendors";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Heart, Store } from "lucide-react";

export default function SavedVendorsPage() {
  const [savedVendors, setSavedVendors] = useState<SavedVendor[]>([]);
  const [categories, setCategories] = useState<VendorCategoryListItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  // Load data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [savedResult, categoriesResult] = await Promise.all([
          getSavedVendors(),
          getVendorCategories({ compact: true }),
        ]);

        if (savedResult.success && savedResult.data) {
          setSavedVendors(savedResult.data);
        }
        if (categoriesResult.success && categoriesResult.data) {
          setCategories(categoriesResult.data as unknown as VendorCategoryListItem[]);
        }
      } catch (error) {
        console.error("Failed to load saved vendors:", error);
        toast.error("Failed to load saved vendors");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Handle filter by category
  useEffect(() => {
    async function filterByCategory() {
      if (selectedCategory === "all") {
        const result = await getSavedVendors();
        if (result.success && result.data) {
          setSavedVendors(result.data);
        }
      } else {
        const result = await getSavedVendors(parseInt(selectedCategory));
        if (result.success && result.data) {
          setSavedVendors(result.data);
        }
      }
    }
    if (!isLoading) {
      filterByCategory();
    }
  }, [selectedCategory, isLoading]);

  // Handle unsave
  const handleUnsave = useCallback(async (vendorId: number) => {
    const savedItem = savedVendors.find(s => s.vendor === vendorId);
    if (!savedItem) return;

    const result = await unsaveVendor(savedItem.id);
    if (result.success) {
      setSavedVendors(prev => prev.filter(s => s.vendor !== vendorId));
      toast.success("Vendor removed from saved");
    } else {
      toast.error("Failed to remove vendor");
    }
  }, [savedVendors]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-8 w-48" />
        </div>
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
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Heart className="h-6 w-6 text-rose-500 fill-rose-500" />
              Saved Vendors
            </h1>
            <p className="text-gray-500">
              {savedVendors.length} vendor{savedVendors.length !== 1 ? "s" : ""} saved
            </p>
          </div>
        </div>

        {/* Category Filter */}
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Vendors Grid */}
      {savedVendors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedVendors.map((saved) => (
            <VendorCard
              key={saved.id}
              vendor={saved.vendor_detail}
              onSave={handleUnsave}
              isSaved={true}
            />
          ))}
        </div>
      ) : (
        <Card className="py-16">
          <CardContent className="flex flex-col items-center text-center">
            <Heart className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No saved vendors yet
            </h3>
            <p className="text-gray-500 mb-6 max-w-md">
              Start browsing vendors and save the ones you like to compare them later
            </p>
            <Link href="/dashboard/vendors">
              <Button className="bg-rose-500 hover:bg-rose-600">
                <Store className="h-4 w-4 mr-2" />
                Browse Vendors
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
