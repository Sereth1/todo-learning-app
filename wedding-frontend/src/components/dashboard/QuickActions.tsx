"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Armchair, ArrowRight, LucideIcon } from "lucide-react";

interface QuickAction {
  label: string;
  href: string;
  icon: LucideIcon;
}

const defaultActions: QuickAction[] = [
  { label: "Add Guests", href: "/dashboard/guests/add", icon: Users },
  { label: "Manage Events", href: "/dashboard/events", icon: Calendar },
  { label: "Seating Chart", href: "/dashboard/seating", icon: Armchair },
];

interface QuickActionsProps {
  actions?: QuickAction[];
}

export function QuickActions({ actions = defaultActions }: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => (
          <Button 
            key={action.href}
            asChild 
            variant="outline" 
            className="w-full justify-between"
          >
            <Link href={action.href}>
              <span className="flex items-center gap-2">
                <action.icon className="h-4 w-4" />
                {action.label}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
