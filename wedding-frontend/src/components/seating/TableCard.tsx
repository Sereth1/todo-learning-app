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
import { MoreHorizontal, Trash2, UserPlus, UserMinus } from "lucide-react";
import type { Table, Guest } from "@/types";

interface TableCardProps {
  table: Table;
  tableGuests: Guest[];
  unassignedCount: number;
  onAssign: (table: Table) => void;
  onDelete: (table: Table) => void;
  onUnassignGuest: (guestId: number) => void;
}

export function TableCard({
  table,
  tableGuests,
  unassignedCount,
  onAssign,
  onDelete,
  onUnassignGuest,
}: TableCardProps) {
  const isFull = tableGuests.length >= table.capacity;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{table.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={isFull ? "secondary" : "outline"}>
                {tableGuests.length} / {table.capacity}
              </Badge>
              {table.table_number && (
                <Badge variant="outline">#{table.table_number}</Badge>
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
        {table.description && (
          <p className="text-sm text-gray-500 mb-3">{table.description}</p>
        )}
        
        {tableGuests.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No guests assigned</p>
        ) : (
          <div className="space-y-2">
            {tableGuests.map((guest) => (
              <div 
                key={guest.id}
                className="flex items-center justify-between text-sm bg-gray-50 rounded-md px-2 py-1"
              >
                <span>{guest.first_name} {guest.last_name}</span>
                <button
                  onClick={() => onUnassignGuest(guest.id)}
                  className="text-gray-400 hover:text-red-500"
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
