"use client";

import { Users, UserCheck, Clock, UserX, Heart, Baby } from "lucide-react";
import { StatsCard } from "@/components/shared/StatsCard";
import type { GuestStats as GuestStatsType } from "@/types";

interface GuestStatsProps {
  stats: GuestStatsType;
}

export function GuestStats({ stats }: GuestStatsProps) {
  const totalInvited = stats.total_invited;
  const totalAttending = stats.total_expected_attendees;

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      <StatsCard
        title="Total Attending"
        value={totalAttending}
        icon={Users}
        iconColor="text-blue-500"
        description={`${totalInvited} invited`}
      />
      <StatsCard
        title="Confirmed"
        value={stats.confirmed}
        description="Guests confirmed"
        icon={UserCheck}
        iconColor="text-green-500"
      />
      <StatsCard
        title="Plus Ones"
        value={stats.plus_ones_coming}
        icon={Heart}
        iconColor="text-rose-500"
        description="Companions coming"
      />
      <StatsCard
        title="Children"
        value={stats.total_children || 0}
        icon={Baby}
        iconColor="text-purple-500"
        description={`${stats.guests_with_children} with kids`}
      />
      <StatsCard
        title="Pending"
        value={stats.pending}
        icon={Clock}
        iconColor="text-amber-500"
        description="Awaiting response"
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
