"use client";

import { Users, UserCheck, Clock, UserX } from "lucide-react";
import { StatsCard } from "@/components/shared/StatsCard";
import type { GuestStats as GuestStatsType } from "@/types";

interface GuestStatsProps {
  stats: GuestStatsType;
}

export function GuestStats({ stats }: GuestStatsProps) {
  const total = stats.total_invited;
  const confirmationRate = total > 0 
    ? Math.round((stats.confirmed / total) * 100) 
    : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Guests"
        value={total}
        icon={Users}
        iconColor="text-blue-500"
      />
      <StatsCard
        title="Confirmed"
        value={stats.confirmed}
        description={`${confirmationRate}% of total`}
        icon={UserCheck}
        iconColor="text-green-500"
      />
      <StatsCard
        title="Pending"
        value={stats.pending}
        icon={Clock}
        iconColor="text-amber-500"
      />
      <StatsCard
        title="Declined"
        value={stats.declined}
        icon={UserX}
        iconColor="text-gray-500"
      />
    </div>
  );
}
