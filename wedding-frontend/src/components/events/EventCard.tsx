"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MapPin, 
  Clock, 
  MoreHorizontal,
  Pencil,
  Trash2,
  Sparkles,
  Calendar,
} from "lucide-react";
import type { WeddingEvent } from "@/types";

interface EventCardProps {
  event: WeddingEvent;
  onEdit?: (event: WeddingEvent) => void;
  onDelete: (event: WeddingEvent) => void;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(timeStr: string) {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function isUpcoming(dateStr: string) {
  return new Date(dateStr) >= new Date();
}

export function EventCard({ event, onEdit, onDelete }: EventCardProps) {
  const upcoming = isUpcoming(event.event_date);

  return (
    <Card className="overflow-hidden">
      <div className="flex">
        {/* Date Sidebar */}
        <div className="w-24 bg-rose-50 flex flex-col items-center justify-center p-4 border-r">
          <span className="text-3xl font-bold text-rose-600">
            {new Date(event.event_date).getDate()}
          </span>
          <span className="text-sm text-rose-500 uppercase">
            {new Date(event.event_date).toLocaleDateString("en-US", { month: "short" })}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(event.event_date).getFullYear()}
          </span>
        </div>

        {/* Event Details */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                {upcoming ? (
                  <Badge className="bg-green-100 text-green-700">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Upcoming
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-500">
                    Past
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {formatDate(event.event_date)}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(event)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(event)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-rose-400" />
              <span>{event.venue_name}</span>
            </div>
            {event.event_time && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-rose-400" />
                <span>{formatTime(event.event_time)}</span>
              </div>
            )}
            {event.dress_code && (
              <div className="flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-rose-400" />
                <span>{event.dress_code}</span>
              </div>
            )}
            {event.rsvp_deadline && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-rose-400" />
                <span>RSVP by {new Date(event.rsvp_deadline).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {event.venue_address && (
            <p className="mt-2 text-sm text-gray-500">{event.venue_address}</p>
          )}

          {(event.ceremony_time || event.reception_time) && (
            <div className="mt-3 flex gap-4 text-sm">
              {event.ceremony_time && (
                <Badge variant="outline">
                  Ceremony: {formatTime(event.ceremony_time)}
                </Badge>
              )}
              {event.reception_time && (
                <Badge variant="outline">
                  Reception: {formatTime(event.reception_time)}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
