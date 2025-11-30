"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { EventFormData } from "@/hooks/use-events";

interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: EventFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddEventDialog({
  open,
  onOpenChange,
  formData,
  onChange,
  onSubmit,
}: AddEventDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Event</DialogTitle>
          <DialogDescription>
            Create a new event for your wedding celebration
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Event Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Wedding Ceremony"
              value={formData.name}
              onChange={onChange}
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
                onChange={onChange}
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
                onChange={onChange}
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
              onChange={onChange}
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
              onChange={onChange}
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
                onChange={onChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reception_time">Reception Time</Label>
              <Input
                id="reception_time"
                name="reception_time"
                type="time"
                value={formData.reception_time}
                onChange={onChange}
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
                onChange={onChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rsvp_deadline">RSVP Deadline</Label>
              <Input
                id="rsvp_deadline"
                name="rsvp_deadline"
                type="date"
                value={formData.rsvp_deadline}
                onChange={onChange}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-rose-500 hover:bg-rose-600">
              Create Event
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
