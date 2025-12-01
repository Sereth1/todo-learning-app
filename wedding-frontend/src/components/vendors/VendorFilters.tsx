"use client";

import { useState, useCallback } from "react";
import { VendorFilters, VendorPriceRange, VendorBookingStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, 
  SlidersHorizontal, 
  X,
  Star,
} from "lucide-react";

interface VendorFiltersProps {
  filters: VendorFilters;
  onFiltersChange: (filters: VendorFilters) => void;
  categories?: { id: number; name: string; slug: string }[];
  cities?: string[];
  showCategoryFilter?: boolean;
}

const priceRanges: { value: VendorPriceRange; label: string }[] = [
  { value: "$", label: "Budget ($)" },
  { value: "$$", label: "Moderate ($$)" },
  { value: "$$$", label: "Premium ($$$)" },
  { value: "$$$$", label: "Luxury ($$$$)" },
];

const bookingStatuses: { value: VendorBookingStatus; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "limited", label: "Limited Availability" },
  { value: "booked", label: "Fully Booked" },
];

const sortOptions = [
  { value: "default", label: "Featured & Rating" },
  { value: "rating", label: "Highest Rated" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "name", label: "Name A-Z" },
  { value: "newest", label: "Newest First" },
  { value: "reviews", label: "Most Reviews" },
];

const ratingOptions = [
  { value: 0, label: "Any rating" },
  { value: 3, label: "3+ Stars" },
  { value: 3.5, label: "3.5+ Stars" },
  { value: 4, label: "4+ Stars" },
  { value: 4.5, label: "4.5+ Stars" },
];

export function VendorFiltersComponent({
  filters,
  onFiltersChange,
  categories = [],
  cities = [],
  showCategoryFilter = true,
}: VendorFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<VendorFilters>(filters);

  // Count active filters
  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => 
      value !== undefined && 
      value !== "" && 
      key !== "sort_by" &&
      key !== "search"
  ).length;

  const handleSearchChange = useCallback((value: string) => {
    onFiltersChange({ ...filters, search: value || undefined });
  }, [filters, onFiltersChange]);

  const handleSortChange = useCallback((value: string) => {
    onFiltersChange({ 
      ...filters, 
      sort_by: value as VendorFilters["sort_by"] 
    });
  }, [filters, onFiltersChange]);

  const handleApplyFilters = useCallback(() => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  }, [localFilters, onFiltersChange]);

  const handleClearFilters = useCallback(() => {
    const clearedFilters: VendorFilters = {
      search: filters.search,
      sort_by: filters.sort_by,
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  }, [filters.search, filters.sort_by, onFiltersChange]);

  const handleRemoveFilter = useCallback((key: keyof VendorFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  return (
    <div className="space-y-4">
      {/* Search and Sort Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search vendors..."
            value={filters.search || ""}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Sort */}
        <Select 
          value={filters.sort_by || "default"} 
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filter Button */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="relative">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge 
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-rose-500"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filter Vendors</SheetTitle>
              <SheetDescription>
                Narrow down your search with these filters
              </SheetDescription>
            </SheetHeader>

            <div className="py-6 space-y-6">
              {/* Category Filter */}
              {showCategoryFilter && categories.length > 0 && (
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={localFilters.category?.toString() || ""}
                    onValueChange={(value) => 
                      setLocalFilters({
                        ...localFilters,
                        category: value ? parseInt(value) : undefined,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* City Filter */}
              {cities.length > 0 && (
                <div className="space-y-2">
                  <Label>City</Label>
                  <Select
                    value={localFilters.city || ""}
                    onValueChange={(value) =>
                      setLocalFilters({
                        ...localFilters,
                        city: value || undefined,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All cities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All cities</SelectItem>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Price Range */}
              <div className="space-y-2">
                <Label>Price Range</Label>
                <Select
                  value={localFilters.price_range || ""}
                  onValueChange={(value) =>
                    setLocalFilters({
                      ...localFilters,
                      price_range: (value || undefined) as VendorPriceRange | undefined,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any price</SelectItem>
                    {priceRanges.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Booking Status */}
              <div className="space-y-2">
                <Label>Availability</Label>
                <Select
                  value={localFilters.booking_status || ""}
                  onValueChange={(value) =>
                    setLocalFilters({
                      ...localFilters,
                      booking_status: (value || undefined) as VendorBookingStatus | undefined,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any availability</SelectItem>
                    {bookingStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Minimum Rating */}
              <div className="space-y-2">
                <Label>Minimum Rating</Label>
                <Select
                  value={localFilters.rating_min?.toString() || "0"}
                  onValueChange={(value) =>
                    setLocalFilters({
                      ...localFilters,
                      rating_min: parseFloat(value) > 0 ? parseFloat(value) : undefined,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any rating" />
                  </SelectTrigger>
                  <SelectContent>
                    {ratingOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        <div className="flex items-center gap-1">
                          {option.value > 0 && (
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          )}
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <Label>Features</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="verified"
                      checked={localFilters.is_verified || false}
                      onCheckedChange={(checked) =>
                        setLocalFilters({
                          ...localFilters,
                          is_verified: checked ? true : undefined,
                        })
                      }
                    />
                    <label htmlFor="verified" className="text-sm">
                      Verified vendors only
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="featured"
                      checked={localFilters.is_featured || false}
                      onCheckedChange={(checked) =>
                        setLocalFilters({
                          ...localFilters,
                          is_featured: checked ? true : undefined,
                        })
                      }
                    />
                    <label htmlFor="featured" className="text-sm">
                      Featured vendors only
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="eco"
                      checked={localFilters.is_eco_friendly || false}
                      onCheckedChange={(checked) =>
                        setLocalFilters({
                          ...localFilters,
                          is_eco_friendly: checked ? true : undefined,
                        })
                      }
                    />
                    <label htmlFor="eco" className="text-sm">
                      Eco-friendly vendors only
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <SheetFooter className="flex flex-row gap-3">
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="flex-1"
              >
                Clear All
              </Button>
              <Button 
                onClick={handleApplyFilters}
                className="flex-1 bg-rose-500 hover:bg-rose-600"
              >
                Apply Filters
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.category && (
            <Badge variant="secondary" className="gap-1">
              Category: {categories.find(c => c.id === filters.category)?.name}
              <button onClick={() => handleRemoveFilter("category")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.city && (
            <Badge variant="secondary" className="gap-1">
              City: {filters.city}
              <button onClick={() => handleRemoveFilter("city")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.price_range && (
            <Badge variant="secondary" className="gap-1">
              Price: {filters.price_range}
              <button onClick={() => handleRemoveFilter("price_range")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.booking_status && (
            <Badge variant="secondary" className="gap-1">
              {bookingStatuses.find(s => s.value === filters.booking_status)?.label}
              <button onClick={() => handleRemoveFilter("booking_status")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.rating_min && (
            <Badge variant="secondary" className="gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {filters.rating_min}+
              <button onClick={() => handleRemoveFilter("rating_min")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.is_verified && (
            <Badge variant="secondary" className="gap-1">
              Verified
              <button onClick={() => handleRemoveFilter("is_verified")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.is_featured && (
            <Badge variant="secondary" className="gap-1">
              Featured
              <button onClick={() => handleRemoveFilter("is_featured")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.is_eco_friendly && (
            <Badge variant="secondary" className="gap-1">
              Eco-friendly
              <button onClick={() => handleRemoveFilter("is_eco_friendly")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
