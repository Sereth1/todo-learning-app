"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getGuestStats, getEvents, getSeatingStats } from "@/actions/wedding";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  UserCheck,
  Clock,
  UserX,
  Calendar,
  Armchair,
  Plus,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import type { GuestStats, WeddingEvent, SeatingStats } from "@/types";

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description,
  color = "rose" 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType;
  description?: string;
  color?: "rose" | "green" | "amber" | "blue";
}) {
  const colors = {
    rose: "bg-rose-50 text-rose-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {description && (
              <p className="text-xs text-gray-400 mt-1">{description}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colors[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { wedding } = useAuth();
  const [stats, setStats] = useState<GuestStats | null>(null);
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [seatingStats, setSeatingStats] = useState<SeatingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!wedding) return;
      
      setIsLoading(true);
      const [guestStats, eventsList, seating] = await Promise.all([
        getGuestStats(),
        getEvents(),
        getSeatingStats(),
      ]);
      
      setStats(guestStats);
      setEvents(eventsList);
      setSeatingStats(seating);
      setIsLoading(false);
    };

    loadData();
  }, [wedding]);

  if (!wedding) {
    return (
      <div className="text-center py-12">
        <Sparkles className="h-12 w-12 text-rose-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Wedding Selected</h2>
        <p className="text-gray-500 mb-4">Create your first wedding to get started</p>
        <Button asChild className="bg-rose-500 hover:bg-rose-600">
          <Link href="/create-wedding">
            <Plus className="mr-2 h-4 w-4" />
            Create Wedding
          </Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const mainEvent = events.find(e => e.is_active) || events[0];
  const responseRate = stats ? Math.round(stats.response_rate) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">
            {wedding.display_name}
          </h1>
          {mainEvent && (
            <p className="text-gray-500">
              {mainEvent.days_until_wedding > 0 
                ? `${mainEvent.days_until_wedding} days to go!`
                : mainEvent.days_until_wedding === 0
                ? "Today is the big day! 🎉"
                : "Wedding has passed"}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/guests">
              View All Guests
            </Link>
          </Button>
          <Button asChild className="bg-rose-500 hover:bg-rose-600">
            <Link href="/dashboard/guests/add">
              <Plus className="mr-2 h-4 w-4" />
              Add Guest
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Guests"
          value={stats?.total_invited || 0}
          icon={Users}
          description="Invited to your wedding"
        />
        <StatCard
          title="Confirmed"
          value={stats?.confirmed || 0}
          icon={UserCheck}
          color="green"
          description={`${stats?.total_expected_attendees || 0} total expected`}
        />
        <StatCard
          title="Pending"
          value={stats?.pending || 0}
          icon={Clock}
          color="amber"
          description="Awaiting response"
        />
        <StatCard
          title="Declined"
          value={stats?.declined || 0}
          icon={UserX}
          color="blue"
        />
      </div>

      {/* Response Rate & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Response Rate */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">RSVP Progress</CardTitle>
            <CardDescription>
              {responseRate}% of guests have responded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={responseRate} className="h-3 mb-4" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">{stats?.confirmed || 0}</p>
                <p className="text-sm text-gray-500">Attending</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{stats?.pending || 0}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats?.declined || 0}</p>
                <p className="text-sm text-gray-500">Declined</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href="/dashboard/guests/add">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Add Guests
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href="/dashboard/events">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Manage Events
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href="/dashboard/seating">
                <span className="flex items-center gap-2">
                  <Armchair className="h-4 w-4" />
                  Seating Chart
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Seating Overview */}
      {seatingStats && seatingStats.total_tables > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Seating Overview</CardTitle>
              <CardDescription>
                {seatingStats.total_seated} of {seatingStats.total_capacity} seats assigned
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
            <Progress 
              value={seatingStats.occupancy_rate} 
              className="h-3 mb-4" 
            />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{seatingStats.total_tables}</p>
                <p className="text-sm text-gray-500">Tables</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{seatingStats.total_seated}</p>
                <p className="text-sm text-gray-500">Seated</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{seatingStats.seats_available}</p>
                <p className="text-sm text-gray-500">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
