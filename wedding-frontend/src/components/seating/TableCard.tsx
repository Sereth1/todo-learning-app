"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, UserPlus, UserMinus, Users, Baby, UserPlus as PlusOneIcon } from "lucide-react";
import type { Table } from "@/types";

interface TableCardProps {
  table: Table;
  unassignedCount: number;
  onAssign: (table: Table) => void;
  onDelete: (table: Table) => void;
  onUnassignGuest: (assignmentId: number) => void;
}

export function TableCard({
  table,
  unassignedCount,
  onAssign,
  onDelete,
  onUnassignGuest,
}: TableCardProps) {
  const isFull = table.is_full;
  const assignments = table.guests || [];

  const getIcon = (type: string) => {
    switch (type) {
      case "child":
        return <Baby className="w-3 h-3 text-blue-600" />;
      case "plus_one":
        return <PlusOneIcon className="w-3 h-3 text-purple-600" />;
      default:
        return <Users className="w-3 h-3 text-green-600" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{table.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant={isFull ? "secondary" : "outline"}>
                {table.seats_taken} / {table.capacity}
              </Badge>
              {table.table_number && (
                <Badge variant="outline">#{table.table_number}</Badge>
              )}
              {table.is_vip && (
                <Badge className="bg-amber-100 text-amber-700">VIP</Badge>
              )}
              {table.table_category_display && (
                <Badge variant="secondary" className="text-xs">
                  {table.table_category_display}
                </Badge>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => onAssign(table)}
                disabled={isFull}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Guest
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(table)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {table.location && (
          <p className="text-sm text-muted-foreground mb-3">{table.location}</p>
        )}
        
        {assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No guests assigned</p>
        ) : (
          <div className="space-y-2">
            {assignments.map((assignment) => (
              <div 
                key={assignment.id}
                className="flex items-center justify-between text-sm bg-muted/50 rounded-md px-3 py-2 group hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {getIcon(assignment.attendee_type)}
                  <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                    <span className="truncate">{assignment.display_name}</span>
                    {assignment.attendee_type === "guest" && assignment.guest_type === "family" && assignment.family_relationship_display && (
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 flex-shrink-0">
                        {assignment.family_relationship_display}
                      </Badge>
                    )}
                    {assignment.attendee_type === "guest" && assignment.relationship_tier_display && (
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {assignment.relationship_tier_display}
                      </Badge>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onUnassignGuest(assignment.id)}
                  className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                >
                  <UserMinus className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {!isFull && unassignedCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3"
            onClick={() => onAssign(table)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Assign Guest
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
