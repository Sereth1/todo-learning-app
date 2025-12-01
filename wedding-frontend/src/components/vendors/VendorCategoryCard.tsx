"use client";

import { VendorCategoryListItem, VendorCategoryType } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Church,
  Camera,
  UtensilsCrossed,
  Sparkles,
  Flower2,
  Music,
  ClipboardList,
  Shirt,
  FileText,
  Car,
  Scale,
  Gift,
  Hotel,
  Plane,
  MoreHorizontal,
} from "lucide-react";

interface VendorCategoryCardProps {
  category: VendorCategoryListItem;
  isSelected?: boolean;
  onClick?: () => void;
}

// Map category types to icons
const categoryIcons: Record<VendorCategoryType, React.ComponentType<{ className?: string }>> = {
  venue: Church,
  photography: Camera,
  catering: UtensilsCrossed,
  beauty: Sparkles,
  decor: Flower2,
  entertainment: Music,
  planning: ClipboardList,
  fashion: Shirt,
  stationery: FileText,
  transportation: Car,
  officiant: Scale,
  gifts: Gift,
  accommodation: Hotel,
  honeymoon: Plane,
  other: MoreHorizontal,
};

// Map category types to colors
const categoryColors: Record<VendorCategoryType, { bg: string; text: string; border: string }> = {
  venue: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  photography: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  catering: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
  beauty: { bg: "bg-pink-50", text: "text-pink-600", border: "border-pink-200" },
  decor: { bg: "bg-green-50", text: "text-green-600", border: "border-green-200" },
  entertainment: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-200" },
  planning: { bg: "bg-teal-50", text: "text-teal-600", border: "border-teal-200" },
  fashion: { bg: "bg-rose-50", text: "text-rose-600", border: "border-rose-200" },
  stationery: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
  transportation: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" },
  officiant: { bg: "bg-cyan-50", text: "text-cyan-600", border: "border-cyan-200" },
  gifts: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
  accommodation: { bg: "bg-sky-50", text: "text-sky-600", border: "border-sky-200" },
  honeymoon: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
  other: { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" },
};

export function VendorCategoryCard({ 
  category, 
  isSelected = false,
  onClick 
}: VendorCategoryCardProps) {
  const Icon = categoryIcons[category.category_type] || MoreHorizontal;
  const colors = categoryColors[category.category_type] || categoryColors.other;

  const content = (
    <Card 
      className={cn(
        "group cursor-pointer transition-all hover:shadow-md",
        isSelected && "ring-2 ring-rose-500",
        colors.border
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn(
          "p-3 rounded-lg transition-colors",
          colors.bg,
          "group-hover:scale-105 transition-transform"
        )}>
          <Icon className={cn("h-6 w-6", colors.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">
            {category.name}
          </h3>
          <p className="text-sm text-gray-500">
            {category.vendor_count} vendor{category.vendor_count !== 1 ? "s" : ""}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  if (onClick) {
    return content;
  }

  return (
    <Link href={`/dashboard/vendors?category=${category.slug}`}>
      {content}
    </Link>
  );
}

// Category grid component for displaying multiple categories
interface VendorCategoryGridProps {
  categories: VendorCategoryListItem[];
  selectedCategory?: string;
  onSelectCategory?: (slug: string | undefined) => void;
  columns?: 2 | 3 | 4;
}

export function VendorCategoryGrid({ 
  categories, 
  selectedCategory,
  onSelectCategory,
  columns = 3 
}: VendorCategoryGridProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns])}>
      {onSelectCategory && (
        <Card 
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            !selectedCategory && "ring-2 ring-rose-500"
          )}
          onClick={() => onSelectCategory(undefined)}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-lg bg-gray-100">
              <MoreHorizontal className="h-6 w-6 text-gray-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">All Categories</h3>
              <p className="text-sm text-gray-500">
                View all vendors
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      {categories.map((category) => (
        <VendorCategoryCard
          key={category.id}
          category={category}
          isSelected={selectedCategory === category.slug}
          onClick={onSelectCategory ? () => onSelectCategory(category.slug) : undefined}
        />
      ))}
    </div>
  );
}
