"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ============ Price Display ============

interface PriceDisplayProps {
  price: number;
  originalPrice?: number;
  currency?: string;
  discountPercentage?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const priceSizeClasses = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
};

export function PriceDisplay({
  price,
  originalPrice,
  currency = "EUR",
  discountPercentage,
  size = "md",
  className,
}: PriceDisplayProps) {
  const hasDiscount = originalPrice && originalPrice > price;
  const discount = discountPercentage || (hasDiscount ? Math.round((1 - price / originalPrice) * 100) : 0);

  return (
    <div className={cn("flex items-baseline gap-2 flex-wrap", className)}>
      <span className={cn("font-bold text-rose-600", priceSizeClasses[size])}>
        {currency} {price.toLocaleString()}
      </span>
      {hasDiscount && (
        <>
          <span className="text-sm text-gray-400 line-through">
            {currency} {originalPrice.toLocaleString()}
          </span>
          {discount > 0 && (
            <Badge className="bg-green-100 text-green-700">
              -{discount}%
            </Badge>
          )}
        </>
      )}
    </div>
  );
}

// ============ Price Range Badge ============

type PriceRange = "$" | "$$" | "$$$" | "$$$$";

interface PriceRangeBadgeProps {
  range: PriceRange;
  showLabel?: boolean;
  className?: string;
}

const priceRangeColors: Record<PriceRange, string> = {
  "$": "bg-green-100 text-green-700",
  "$$": "bg-blue-100 text-blue-700",
  "$$$": "bg-purple-100 text-purple-700",
  "$$$$": "bg-amber-100 text-amber-700",
};

const priceRangeLabels: Record<PriceRange, string> = {
  "$": "Budget",
  "$$": "Moderate",
  "$$$": "Premium",
  "$$$$": "Luxury",
};

export function PriceRangeBadge({ range, showLabel = false, className }: PriceRangeBadgeProps) {
  return (
    <Badge variant="secondary" className={cn(priceRangeColors[range], className)}>
      {range}
      {showLabel && ` - ${priceRangeLabels[range]}`}
    </Badge>
  );
}

// ============ Status Badge ============

type BookingStatus = "available" | "limited" | "booked";

interface StatusBadgeProps {
  status: BookingStatus;
  label?: string;
  className?: string;
}

const statusColors: Record<BookingStatus, string> = {
  available: "bg-green-100 text-green-700",
  limited: "bg-yellow-100 text-yellow-700",
  booked: "bg-red-100 text-red-700",
};

const statusLabels: Record<BookingStatus, string> = {
  available: "Available",
  limited: "Limited",
  booked: "Booked",
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <Badge variant="secondary" className={cn(statusColors[status], className)}>
      {label || statusLabels[status]}
    </Badge>
  );
}
