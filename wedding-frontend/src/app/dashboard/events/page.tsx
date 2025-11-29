"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getEvents, createEvent, deleteEvent } from "@/actions/wedding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  Calendar, 
  MapPin, 
  Clock, 
  MoreHorizontal,
  Pencil,
  Trash2,
  Sparkles,
  PartyPopper,
} from "lucide-react";
import { toast } from "sonner";
import type { WeddingEvent } from "@/types";

export default function EventsPage() {
  const { wedding } = useAuth();
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; event: WeddingEvent | null }>({
    open: false,
    event: null,
  });
  const [formData, setFormData] = useState({
    name: "",
    event_date: "",
    event_time: "",
    venue_name: "",
    venue_address: "",
    ceremony_time: "",
    reception_time: "",
    dress_code: "",
    rsvp_deadline: "",
  });

  useEffect(() => {
    const loadEvents = async () => {
      if (!wedding) return;
      setIsLoading(true);
      const data = await getEvents();
      setEvents(data);
      setIsLoading(false);
    };
    loadEvents();
  }, [wedding]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      event_date: "",
      event_time: "",
      venue_name: "",
      venue_address: "",
      ceremony_time: "",
      reception_time: "",
      dress_code: "",
      rsvp_deadline: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.event_date || !formData.venue_name) {
      toast.error("Please fill in required fields");
      return;
    }

    const result = await createEvent({
      name: formData.name,
      event_date: formData.event_date,
      event_time: formData.event_time || "00:00",
      venue_name: formData.venue_name,
      venue_address: formData.venue_address || undefined,
      ceremony_time: formData.ceremony_time || undefined,
      reception_time: formData.reception_time || undefined,
      dress_code: formData.dress_code || undefined,
      rsvp_deadline: formData.rsvp_deadline || undefined,
    });

    if (result.success && result.event) {
      setEvents(prev => [...prev, result.event!]);
      toast.success("Event created successfully!");
      setShowAddDialog(false);
      resetForm();
    } else {
      toast.error(result.error || "Failed to create event");
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.event) return;
    
    const result = await deleteEvent(deleteModal.event.id);
    if (result.success) {
      setEvents(prev => prev.filter(e => e.id !== deleteModal.event!.id));
      toast.success("Event deleted successfully");
    } else {
      toast.error(result.error || "Failed to delete event");
    }
    setDeleteModal({ open: false, event: null });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const isUpcoming = (dateStr: string) => {
    return new Date(dateStr) >= new Date();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4">
          {[1, 2].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Events</h1>
          <p className="text-gray-500">{events.length} event{events.length !== 1 ? "s" : ""} planned</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-rose-500 hover:bg-rose-600">
              <Plus className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Event</DialogTitle>
              <DialogDescription>
                Create a new event for your wedding celebration
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Event Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Wedding Ceremony"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event_date">Date *</Label>
                  <Input
                    id="event_date"
                    name="event_date"
                    type="date"
                    value={formData.event_date}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event_time">Start Time</Label>
                  <Input
                    id="event_time"
                    name="event_time"
                    type="time"
                    value={formData.event_time}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue_name">Venue Name *</Label>
                <Input
                  id="venue_name"
                  name="venue_name"
                  placeholder="Grand Ballroom"
                  value={formData.venue_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue_address">Venue Address</Label>
                <Input
                  id="venue_address"
                  name="venue_address"
                  placeholder="123 Main St, City, State"
                  value={formData.venue_address}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ceremony_time">Ceremony Time</Label>
                  <Input
                    id="ceremony_time"
                    name="ceremony_time"
                    type="time"
                    value={formData.ceremony_time}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reception_time">Reception Time</Label>
                  <Input
                    id="reception_time"
                    name="reception_time"
                    type="time"
                    value={formData.reception_time}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dress_code">Dress Code</Label>
                  <Input
                    id="dress_code"
                    name="dress_code"
                    placeholder="Black Tie"
                    value={formData.dress_code}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rsvp_deadline">RSVP Deadline</Label>
                  <Input
                    id="rsvp_deadline"
                    name="rsvp_deadline"
                    type="date"
                    value={formData.rsvp_deadline}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-rose-500 hover:bg-rose-600">
                  Create Event
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <PartyPopper className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
            <p className="text-gray-500 mb-4">
              Start planning your wedding by adding your first event
            </p>
            <Button onClick={() => setShowAddDialog(true)} className="bg-rose-500 hover:bg-rose-600">
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden">
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
                        {isUpcoming(event.event_date) ? (
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
                        <DropdownMenuItem>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteModal({ open: true, event })}
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
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModal.open} onOpenChange={(open) => setDeleteModal({ open, event: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteModal.event?.name}&quot;? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModal({ open: false, event: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
