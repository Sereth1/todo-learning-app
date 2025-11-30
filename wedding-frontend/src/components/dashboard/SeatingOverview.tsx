"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight } from "lucide-react";
import type { SeatingStats } from "@/types";

interface SeatingOverviewProps {
  stats: SeatingStats;
}

export function SeatingOverview({ stats }: SeatingOverviewProps) {
  if (stats.total_tables === 0) return null;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Seating Overview</CardTitle>
          <CardDescription>
            {stats.total_seated} of {stats.total_capacity} seats assigned
          </CardDescription>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/seating">
            Manage
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Progress value={stats.occupancy_rate} className="h-3 mb-4" />
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{stats.total_tables}</p>
            <p className="text-sm text-gray-500">Tables</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{stats.total_seated}</p>
            <p className="text-sm text-gray-500">Seated</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600">{stats.seats_available}</p>
            <p className="text-sm text-gray-500">Available</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
