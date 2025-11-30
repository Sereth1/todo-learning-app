export const dynamic = "force-dynamic";

import { getGuestStats, getSeatingStats, getGuests } from "@/actions/wedding";
import { StatCard, StatGrid } from "@/components/wedding/StatCard";
import { Section, SectionHeader } from "@/components/wedding/Section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Heart,
  Baby,
  Armchair,
  LayoutGrid,
} from "lucide-react";
import type { Guest, GuestStats, SeatingStats } from "@/types";

export const metadata = {
  title: "Admin Dashboard | J & S Wedding",
  description: "Wedding planning dashboard",
};

export default async function AdminPage() {
  const [guestStats, seatingStats, guests] = await Promise.all([
    getGuestStats(),
    getSeatingStats(),
    getGuests(),
  ]) as [GuestStats | null, SeatingStats | null, Guest[]];

  return (
    <>
      {/* Header */}
      <section className="py-12 bg-linear-to-b from-secondary/50 to-background">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <h1 className="text-3xl md:text-4xl font-serif font-light text-foreground mb-2">
            Wedding Dashboard
          </h1>
          <p className="text-muted-foreground">
            Overview of your wedding planning progress
          </p>
        </div>
      </section>

      {/* Stats Grid */}
      <Section className="pt-8">
        <SectionHeader title="Guest Statistics" align="left" />
        
        {guestStats ? (
          <>
            <StatGrid columns={4}>
              <StatCard
                title="Total Invited"
                value={guestStats.total_invited}
                icon={Users}
              />
              <StatCard
                title="Confirmed"
                value={guestStats.confirmed}
                icon={UserCheck}
                description={`${guestStats.confirmation_rate}% of invites`}
              />
              <StatCard
                title="Pending"
                value={guestStats.pending}
                icon={Clock}
              />
              <StatCard
                title="Declined"
                value={guestStats.declined}
                icon={UserX}
              />
            </StatGrid>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              {/* Response Rate */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Response Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Responses Received</span>
                        <span className="font-medium">{guestStats.response_rate}%</span>
                      </div>
                      <Progress value={guestStats.response_rate} className="h-2" />
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-light text-green-600">{guestStats.confirmed}</p>
                        <p className="text-xs text-green-600">Confirmed</p>
                      </div>
                      <div className="text-center p-3 bg-amber-50 rounded-lg">
                        <p className="text-2xl font-light text-amber-600">{guestStats.pending}</p>
                        <p className="text-xs text-amber-600">Pending</p>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <p className="text-2xl font-light text-red-500">{guestStats.declined}</p>
                        <p className="text-xs text-red-500">Declined</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Expected Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <p className="text-5xl font-light text-primary mb-2">
                      {guestStats.total_expected_attendees}
                    </p>
                    <p className="text-muted-foreground">Total Expected Guests</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                      <Heart className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">{guestStats.plus_ones_coming}</p>
                        <p className="text-xs text-muted-foreground">Plus Ones</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                      <Baby className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">{guestStats.guests_with_children}</p>
                        <p className="text-xs text-muted-foreground">With Children</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No guest data available</p>
              <p className="text-sm">Start adding guests to see statistics</p>
            </CardContent>
          </Card>
        )}
      </Section>

      {/* Seating Stats */}
      {seatingStats && (
        <Section>
          <SectionHeader title="Seating Overview" align="left" />
          
          <StatGrid columns={4}>
            <StatCard
              title="Total Tables"
              value={seatingStats.total_tables}
              icon={LayoutGrid}
            />
            <StatCard
              title="Total Capacity"
              value={seatingStats.total_capacity}
              icon={Armchair}
            />
            <StatCard
              title="Guests Seated"
              value={seatingStats.total_seated}
              description={`${seatingStats.occupancy_rate}% occupancy`}
            />
            <StatCard
              title="Available Seats"
              value={seatingStats.seats_available}
            />
          </StatGrid>
        </Section>
      )}

      {/* Recent Guests */}
      <Section>
        <SectionHeader title="Recent Guests" align="left" />
        
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Name</th>
                    <th className="text-left p-4 font-medium">Email</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Plus One</th>
                  </tr>
                </thead>
                <tbody>
                  {guests.length > 0 ? (
                    guests.slice(0, 10).map((guest: Guest) => (
                      <tr key={guest.id} className="border-t">
                        <td className="p-4">
                          {guest.first_name} {guest.last_name}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {guest.email}
                        </td>
                        <td className="p-4">
                          <Badge
                            variant={
                              guest.attendance_status === "yes"
                                ? "default"
                                : guest.attendance_status === "no"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {guest.attendance_status === "yes"
                              ? "Confirmed"
                              : guest.attendance_status === "no"
                              ? "Declined"
                              : "Pending"}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {guest.is_plus_one_coming ? (
                            <Badge variant="outline">Yes</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">
                        No guests found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </Section>
    </>
  );
}
