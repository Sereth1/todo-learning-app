"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardData, DashboardData } from "@/actions/wedding";
import { Skeleton } from "@/components/ui/skeleton";
import { RSVPProgress } from "@/components/dashboard/RSVPProgress";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { SeatingOverview } from "@/components/dashboard/SeatingOverview";
import { NoWeddingState } from "@/components/dashboard/NoWeddingState";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { GuestStats } from "@/components/guests";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-48 lg:col-span-2" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { wedding } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!wedding) return;

      setIsLoading(true);
      try {
        // Single API call for all dashboard data
        const data = await getDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [wedding]);

  if (!wedding) {
    return <NoWeddingState />;
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const stats = dashboardData?.guest_stats;
  const seatingStats = dashboardData?.seating_stats;
  const mainEvent = dashboardData?.current_event || dashboardData?.events?.[0];
  const responseRate = stats ? Math.round(stats.response_rate) : 0;

  return (
    <div className="space-y-6">
      <DashboardHeader
        weddingName={wedding.display_name}
        daysUntilWedding={mainEvent?.days_until_wedding}
      />

      {/* Stats Grid - Reuse GuestStats component */}
      {stats && <GuestStats stats={stats} />}

      {/* Response Rate & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RSVPProgress
          confirmed={stats?.confirmed || 0}
          pending={stats?.pending || 0}
          declined={stats?.declined || 0}
          responseRate={responseRate}
        />
        <QuickActions />
      </div>

      {/* Seating Overview */}
      {seatingStats && <SeatingOverview stats={seatingStats} />}
    </div>
  );
}
