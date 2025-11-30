"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Table, Guest } from "@/types";

interface AssignGuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: Table | null;
  unassignedGuests: Guest[];
  onAssign: (guestId: number) => void;
}

export function AssignGuestDialog({
  open,
  onOpenChange,
  table,
  unassignedGuests,
  onAssign,
}: AssignGuestDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Guest to {table?.name}</DialogTitle>
          <DialogDescription>
            Select a guest to seat at this table
          </DialogDescription>
        </DialogHeader>
        
        {unassignedGuests.length === 0 ? (
          <p className="text-center text-gray-500 py-4">
            All confirmed guests have been assigned to tables
          </p>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-2">
            {unassignedGuests.map((guest) => (
              <button
                key={guest.id}
                onClick={() => {
                  onAssign(guest.id);
                  onOpenChange(false);
                }}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 flex items-center justify-between"
              >
                <span>{guest.first_name} {guest.last_name}</span>
                <Badge variant="outline" className="text-green-600">Confirmed</Badge>
              </button>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
