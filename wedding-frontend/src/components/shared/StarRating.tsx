"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

const sizeClasses = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-6 w-6",
};

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  showValue = false,
  interactive = false,
  onRatingChange,
  className,
}: StarRatingProps) {
  const stars = Array.from({ length: maxRating }, (_, i) => i + 1);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex">
        {stars.map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            className={cn(
              interactive && "cursor-pointer hover:scale-110 transition-transform",
              !interactive && "cursor-default"
            )}
            onClick={() => interactive && onRatingChange?.(star)}
          >
            <Star
              className={cn(
                sizeClasses[size],
                "transition-colors",
                star <= rating
                  ? "fill-amber-400 text-amber-400"
                  : "text-gray-300",
                interactive && star > rating && "hover:text-amber-200"
              )}
            />
          </button>
        ))}
      </div>
      {showValue && (
        <span className="font-medium text-sm ml-1">
          {typeof rating === "number" ? rating.toFixed(1) : "0.0"}
        </span>
      )}
    </div>
  );
}

// Rating labels helper
export function getRatingLabel(rating: number): string {
  if (rating === 1) return "Poor";
  if (rating === 2) return "Fair";
  if (rating === 3) return "Good";
  if (rating === 4) return "Very Good";
  if (rating === 5) return "Excellent";
  return "";
}
