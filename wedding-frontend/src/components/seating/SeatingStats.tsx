"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CircleDot, Users, UserPlus } from "lucide-react";

interface SeatingStatsProps {
  tablesCount: number;
  assignedSeats: number;
  totalSeats: number;
  unassignedCount: number;
}

export function SeatingStats({ tablesCount, assignedSeats, totalSeats, unassignedCount }: SeatingStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <CircleDot className="h-8 w-8 text-rose-500" />
            <div>
              <p className="text-2xl font-bold">{tablesCount}</p>
              <p className="text-sm text-gray-500">Tables</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{assignedSeats} / {totalSeats}</p>
              <p className="text-sm text-gray-500">Seats Filled</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <UserPlus className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{unassignedCount}</p>
              <p className="text-sm text-gray-500">Unassigned Guests</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
