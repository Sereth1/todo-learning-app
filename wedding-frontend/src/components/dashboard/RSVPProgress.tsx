"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface RSVPProgressProps {
  confirmed: number;
  pending: number;
  declined: number;
  responseRate: number;
}

export function RSVPProgress({ confirmed, pending, declined, responseRate }: RSVPProgressProps) {
  return (
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
            <p className="text-2xl font-bold text-green-600">{confirmed}</p>
            <p className="text-sm text-gray-500">Attending</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-600">{pending}</p>
            <p className="text-sm text-gray-500">Pending</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">{declined}</p>
            <p className="text-sm text-gray-500">Declined</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
