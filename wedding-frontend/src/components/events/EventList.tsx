"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, PartyPopper } from "lucide-react";
import type { WeddingEvent } from "@/types";
import { EventCard } from "./EventCard";

interface EventListProps {
  events: WeddingEvent[];
  onDelete: (event: WeddingEvent) => void;
  onEdit?: (event: WeddingEvent) => void;
  onAddClick: () => void;
}

export function EventList({ events, onDelete, onEdit, onAddClick }: EventListProps) {
  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <PartyPopper className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
          <p className="text-gray-500 mb-4">
            Start planning your wedding by adding your first event
          </p>
          <Button onClick={onAddClick} className="bg-rose-500 hover:bg-rose-600">
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Event
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
