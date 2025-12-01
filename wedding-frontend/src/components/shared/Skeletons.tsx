"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ============ Page Skeleton ============

interface PageSkeletonProps {
  children?: React.ReactNode;
  className?: string;
}

export function PageSkeleton({ children, className }: PageSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {children}
    </div>
  );
}

// ============ Detail Page Skeleton ============

export function DetailPageSkeleton() {
  return (
    <PageSkeleton>
      <Skeleton className="h-10 w-32" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="w-20 h-20 rounded-lg" />
            ))}
          </div>
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
      <Skeleton className="h-12 w-full max-w-md" />
      <Skeleton className="h-64 w-full" />
    </PageSkeleton>
  );
}

// ============ Card Skeleton ============

interface CardSkeletonProps {
  compact?: boolean;
  className?: string;
}

export function CardSkeleton({ compact = false, className }: CardSkeletonProps) {
  if (compact) {
    return (
      <Card className={cn("flex flex-row overflow-hidden", className)}>
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
    <Card className={cn("overflow-hidden", className)}>
      <Skeleton className="aspect-4/3 w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </Card>
  );
}

// ============ Grid Skeleton ============

interface GridSkeletonProps {
  count?: number;
  columns?: number;
  CardComponent?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export function GridSkeleton({ 
  count = 6, 
  columns = 3,
  CardComponent = CardSkeleton,
  className,
}: GridSkeletonProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  }[columns] || "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={cn("grid gap-6", gridCols, className)}>
      {[...Array(count)].map((_, i) => (
        <CardComponent key={i} />
      ))}
    </div>
  );
}

// ============ Stats Skeleton ============

interface StatsSkeletonProps {
  count?: number;
  className?: string;
}

export function StatsSkeleton({ count = 4, className }: StatsSkeletonProps) {
  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      {[...Array(count)].map((_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
  );
}

// ============ Form Skeleton ============

export function FormSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
        <Skeleton className="h-10" />
        <Skeleton className="h-24" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      </CardContent>
    </Card>
  );
}

// Alias for vendor detail page
export { DetailPageSkeleton as VendorDetailSkeleton };
