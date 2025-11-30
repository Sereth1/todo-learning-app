"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Users, Baby, UserPlus, ChevronDown, ChevronRight } from "lucide-react";
import type { Table, SeatingGuest } from "@/types";
import { cn } from "@/lib/utils";

interface AssignGuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: Table | null;
  unassignedGuests: SeatingGuest[];
  onAssign: (guestData: { guest_id: number; attendee_type: string; child_id?: number }) => void;
}

export function AssignGuestDialog({
  open,
  onOpenChange,
  table,
  unassignedGuests,
  onAssign,
}: AssignGuestDialogProps) {
  const [expandedGuests, setExpandedGuests] = useState<Set<number>>(new Set());

  // Build a map of all guests by their guest_id to handle cases where primary is assigned
  const groupedGuests = useMemo(() => {
    const guestMap = new Map<number, { primary: SeatingGuest | null; plusOne: SeatingGuest | null; children: SeatingGuest[]; isPlaceholder?: boolean }>();

    // First pass: collect all entities
    unassignedGuests.forEach((guest) => {
      const guestId = guest.guest_id;
      
      if (!guestMap.has(guestId)) {
        guestMap.set(guestId, { primary: null, plusOne: null, children: [] });
      }
      
      const group = guestMap.get(guestId)!;
      
      if (guest.type === "guest") {
        group.primary = guest;
      } else if (guest.type === "plus_one") {
        group.plusOne = guest;
      } else if (guest.type === "child") {
        group.children.push(guest);
      }
    });

    // Convert to array and handle orphaned plus ones/children
    return Array.from(guestMap.values()).map(group => {
      // If primary is missing but we have plus one or children, create a placeholder
      if (!group.primary && (group.plusOne || group.children.length > 0)) {
        const parentName = group.plusOne?.parent_guest || group.children[0]?.parent_guest || "Unknown";
        const guestId = group.plusOne?.guest_id || group.children[0]?.guest_id || 0;
        
        return {
          primary: {
            id: `placeholder-${guestId}`,
            guest_id: guestId,
            type: "guest" as const,
            name: parentName,
            email: "",
            guest_type: "assigned",
            is_primary: true,
            isPlaceholder: true,
          } as SeatingGuest & { isPlaceholder: boolean },
          plusOne: group.plusOne,
          children: group.children,
          isPlaceholder: true,
        };
      }
      return {
        primary: group.primary!,
        plusOne: group.plusOne,
        children: group.children,
        isPlaceholder: false,
      };
    }).filter(g => g.primary); // Only include groups that have at least a primary (real or placeholder)
  }, [unassignedGuests]);

  // Auto-expand placeholders when dialog opens or guests change
  useEffect(() => {
    if (open) {
      const placeholderIds = groupedGuests
        .filter(g => g.isPlaceholder)
        .map(g => g.primary.guest_id);
      
      if (placeholderIds.length > 0) {
        setExpandedGuests(new Set(placeholderIds));
      }
    }
  }, [open, groupedGuests]);

  const toggleExpanded = (guestId: number) => {
    const newExpanded = new Set(expandedGuests);
    if (newExpanded.has(guestId)) {
      newExpanded.delete(guestId);
    } else {
      newExpanded.add(guestId);
    }
    setExpandedGuests(newExpanded);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "child":
        return <Baby className="w-4 h-4" />;
      case "plus_one":
        return <UserPlus className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getBadgeVariant = (guest: SeatingGuest) => {
    if (guest.guest_type === "family") {
      if (guest.relationship_tier === "first") return "default";
      if (guest.relationship_tier === "second") return "secondary";
      return "outline";
    }
    return "outline";
  };

  const getTypeLabel = (guest: SeatingGuest) => {
    if (guest.type === "guest" && guest.guest_type === "family") {
      return guest.family_relationship_display || guest.guest_type_display;
    }
    return guest.type === "plus_one" ? "+1" : guest.type === "child" ? `Age ${guest.age}` : guest.guest_type_display;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Guest to {table?.name || `Table ${table?.table_number}`}</DialogTitle>
          <DialogDescription>
            Select a guest, plus one, or child to seat at this table. Click to expand and see family members.
          </DialogDescription>
        </DialogHeader>
        
        {unassignedGuests.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            All confirmed attendees have been assigned to tables
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-1 py-2">
            {groupedGuests.map((group) => {
              const isExpanded = expandedGuests.has(group.primary.guest_id);
              const hasFamily = group.plusOne || group.children.length > 0;
              const isPlaceholder = group.isPlaceholder;

              return (
                <div key={group.primary.id} className="border rounded-lg overflow-hidden">
                  {/* Primary Guest - only show if not a placeholder (already assigned) */}
                  {!isPlaceholder && (
                    <div className="flex items-center gap-2 p-3 hover:bg-muted/50 transition-colors">
                      <button
                        onClick={() => {
                          onAssign({
                            guest_id: group.primary.guest_id,
                            attendee_type: group.primary.type,
                          });
                          onOpenChange(false);
                        }}
                        className="flex-1 flex items-center gap-3 text-left"
                      >
                        <div className="flex-shrink-0">
                          {getIcon(group.primary.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">{group.primary.name}</p>
                            {group.primary.guest_type === "family" && group.primary.family_relationship_display && (
                              <Badge variant={getBadgeVariant(group.primary)} className="text-xs">
                                {group.primary.family_relationship_display}
                              </Badge>
                            )}
                            {group.primary.relationship_tier_display && (
                              <Badge variant="outline" className="text-xs">
                                {group.primary.relationship_tier_display}
                              </Badge>
                            )}
                            {!group.primary.family_relationship_display && group.primary.guest_type_display && (
                              <Badge variant="outline" className="text-xs">
                                {group.primary.guest_type_display}
                              </Badge>
                            )}
                          </div>
                          {group.primary.email && (
                            <p className="text-xs text-muted-foreground truncate">{group.primary.email}</p>
                          )}
                        </div>
                      </button>

                      {hasFamily && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(group.primary.guest_id)}
                          className="flex-shrink-0"
                        >
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* If placeholder, show a header indicating the primary is already assigned */}
                  {isPlaceholder && hasFamily && (
                    <div className="flex items-center gap-2 p-3 bg-muted/30">
                      <div className="flex-1 flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <Users className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-muted-foreground">
                            {group.primary.name}
                            <span className="text-xs ml-2">(already assigned)</span>
                          </p>
                          <p className="text-xs text-muted-foreground">Click below to assign family members</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(group.primary.guest_id)}
                        className="flex-shrink-0"
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                    </div>
                  )}

                  {/* Plus One & Children */}
                  {hasFamily && (isExpanded || isPlaceholder) && (
                    <div className="bg-muted/20 border-t">
                      {group.plusOne && (
                        <button
                          onClick={() => {
                            onAssign({
                              guest_id: group.plusOne!.guest_id,
                              attendee_type: group.plusOne!.type,
                            });
                            onOpenChange(false);
                          }}
                          className="w-full flex items-center gap-3 p-3 pl-10 hover:bg-muted/50 transition-colors text-left"
                        >
                          <div className="flex-shrink-0 text-purple-600">
                            <UserPlus className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{group.plusOne.name}</p>
                              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                                +1
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Invited by {group.primary.name}
                            </p>
                          </div>
                        </button>
                      )}

                      {group.children.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => {
                            onAssign({
                              guest_id: child.guest_id,
                              attendee_type: child.type,
                              child_id: child.child_id,
                            });
                            onOpenChange(false);
                          }}
                          className="w-full flex items-center gap-3 p-3 pl-10 hover:bg-muted/50 transition-colors text-left"
                        >
                          <div className="flex-shrink-0 text-blue-600">
                            <Baby className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{child.name}</p>
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                Age {child.age}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Child of {group.primary.name}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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
