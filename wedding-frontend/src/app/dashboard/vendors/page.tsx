"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VendorDashboardData, VendorListItem, VendorFilters } from "@/types";
import { getVendorDashboard, getVendors, toggleSaveVendor, getSavedVendors } from "@/actions/vendors";
import { VendorCard, VendorFiltersComponent } from "@/components/vendors";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Store,
  BadgeCheck,
  Leaf,
  TrendingUp,
  Heart,
  Grid3X3,
  List,
  RefreshCw,
  Plus,
} from "lucide-react";
import Link from "next/link";

export default function VendorsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [dashboardData, setDashboardData] = useState<VendorDashboardData | null>(null);
  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const [savedVendorIds, setSavedVendorIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState<VendorFilters>({
    category_slug: searchParams.get("category") || undefined,
    search: searchParams.get("search") || undefined,
    sort_by: "default",
  });

  // Load dashboard data
  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      try {
        const [dashboardResult, savedResult] = await Promise.all([
          getVendorDashboard(),
          getSavedVendors(),
        ]);
        
        if (dashboardResult.success && dashboardResult.data) {
          setDashboardData(dashboardResult.data);
        }
        
        if (savedResult.success && savedResult.data) {
          setSavedVendorIds(new Set(savedResult.data.map(s => s.vendor)));
        }
      } catch (error) {
        console.error("Failed to load dashboard:", error);
        toast.error("Failed to load vendor data");
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, []);

  // Load vendors when filters change
  useEffect(() => {
    async function loadVendors() {
      setIsLoadingVendors(true);
      try {
        const result = await getVendors(filters);
        if (result.success && result.data) {
          setVendors(result.data);
        }
      } catch (error) {
        console.error("Failed to load vendors:", error);
      } finally {
        setIsLoadingVendors(false);
      }
    }
    loadVendors();
  }, [filters]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: VendorFilters) => {
    setFilters(newFilters);
    
    // Update URL params
    const params = new URLSearchParams();
    if (newFilters.category_slug) params.set("category", newFilters.category_slug);
    if (newFilters.search) params.set("search", newFilters.search);
    
    const queryString = params.toString();
    router.push(`/dashboard/vendors${queryString ? `?${queryString}` : ""}`, { scroll: false });
  }, [router]);

  // Handle save/unsave vendor
  const handleToggleSave = useCallback(async (vendorId: number) => {
    const result = await toggleSaveVendor(vendorId);
    if (result.success && result.data) {
      setSavedVendorIds(prev => {
        const newSet = new Set(prev);
        if (result.data?.saved) {
          newSet.add(vendorId);
          toast.success("Vendor saved to favorites");
        } else {
          newSet.delete(vendorId);
          toast.success("Vendor removed from favorites");
        }
        return newSet;
      });
    } else {
      toast.error("Failed to update favorites");
    }
  }, []);

  if (isLoading) {
    return <VendorsLoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-500 mt-1">
            Find and manage vendors for your wedding
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/vendors/saved">
            <Button variant="outline">
              <Heart className="h-4 w-4 mr-2" />
              Saved ({savedVendorIds.size})
            </Button>
          </Link>
          <Link href="/dashboard/vendors/quotes">
            <Button variant="outline">
              My Quotes
            </Button>
          </Link>
          <Link href="/dashboard/vendors/new">
            <Button className="bg-rose-500 hover:bg-rose-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Vendor
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {dashboardData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-100 rounded-lg">
                  <Store className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{dashboardData.stats.total_vendors}</p>
                  <p className="text-sm text-gray-500">Total Vendors</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BadgeCheck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{dashboardData.stats.verified_vendors}</p>
                  <p className="text-sm text-gray-500">Verified</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Leaf className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{dashboardData.stats.eco_friendly_vendors}</p>
                  <p className="text-sm text-gray-500">Eco-Friendly</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{dashboardData.stats.total_categories}</p>
                  <p className="text-sm text-gray-500">Categories</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="browse" className="space-y-6">
        <TabsList>
          <TabsTrigger value="browse">Browse Vendors</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
        </TabsList>

        {/* Browse Tab */}
        <TabsContent value="browse" className="space-y-6">
          {/* Filters */}
          <VendorFiltersComponent
            filters={filters}
            onFiltersChange={handleFiltersChange}
            categories={dashboardData?.categories.map(c => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
            })) || []}
          />

          {/* View Toggle */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {vendors.length} vendor{vendors.length !== 1 ? "s" : ""} found
            </p>
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Vendor Grid */}
          {isLoadingVendors ? (
            <div className={viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
            }>
              {[...Array(6)].map((_, i) => (
                <VendorCardSkeleton key={i} compact={viewMode === "list"} />
              ))}
            </div>
          ) : vendors.length === 0 ? (
            <Card className="py-12">
              <CardContent className="flex flex-col items-center text-center">
                <Store className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No vendors found
                </h3>
                <p className="text-gray-500 mb-4">
                  Try adjusting your filters or search terms
                </p>
                <Button variant="outline" onClick={() => handleFiltersChange({})}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
            }>
              {vendors.map((vendor) => (
                <VendorCard
                  key={vendor.id}
                  vendor={vendor}
                  onSave={handleToggleSave}
                  isSaved={savedVendorIds.has(vendor.id)}
                  compact={viewMode === "list"}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Featured Tab */}
        <TabsContent value="featured" className="space-y-6">
          {dashboardData?.featured_vendors && dashboardData.featured_vendors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardData.featured_vendors.map((vendor) => (
                <VendorCard
                  key={vendor.id}
                  vendor={vendor}
                  onSave={handleToggleSave}
                  isSaved={savedVendorIds.has(vendor.id)}
                />
              ))}
            </div>
          ) : (
            <Card className="py-12">
              <CardContent className="flex flex-col items-center text-center">
                <TrendingUp className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No featured vendors yet
                </h3>
                <p className="text-gray-500">
                  Check back later for featured vendors
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Loading skeleton components
function VendorsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      
      <Skeleton className="h-10 w-full max-w-md" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <VendorCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function VendorCardSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <Card className="flex flex-row overflow-hidden">
        <Skeleton className="w-32 h-32" />
        <div className="flex-1 p-3 space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-24" />
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-4/3 w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="p-4 border-t flex justify-between">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-8 w-16" />
      </div>
    </Card>
  );
}
