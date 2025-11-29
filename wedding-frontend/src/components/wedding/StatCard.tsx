"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  className,
}: StatCardProps) {
  const trendColors = {
    up: "text-green-600",
    down: "text-red-500",
    neutral: "text-muted-foreground",
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-light text-foreground">{value}</p>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
            {trend && trendValue && (
              <p className={cn("text-sm font-medium", trendColors[trend])}>
                {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
              </p>
            )}
          </div>
          {Icon && (
            <div className="p-3 bg-primary/10 rounded-xl">
              <Icon className="w-6 h-6 text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface StatGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatGrid({ children, columns = 4, className }: StatGridProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {children}
    </div>
  );
}
