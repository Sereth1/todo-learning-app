"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CircleDot } from "lucide-react";
import type { Table, Guest } from "@/types";
import { TableCard } from "./TableCard";

interface TableListProps {
  tables: Table[];
  getTableGuests: (tableId: number) => Guest[];
  unassignedCount: number;
  onAssign: (table: Table) => void;
  onDelete: (table: Table) => void;
  onUnassignGuest: (guestId: number) => void;
  onAddClick: () => void;
}

export function TableList({
  tables,
  getTableGuests,
  unassignedCount,
  onAssign,
  onDelete,
  onUnassignGuest,
  onAddClick,
}: TableListProps) {
  if (tables.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CircleDot className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tables yet</h3>
          <p className="text-gray-500 mb-4">
            Create tables to start arranging your seating
          </p>
          <Button onClick={onAddClick} className="bg-rose-500 hover:bg-rose-600">
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Table
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tables.map((table) => (
        <TableCard
          key={table.id}
          table={table}
          tableGuests={getTableGuests(table.id)}
          unassignedCount={unassignedCount}
          onAssign={onAssign}
          onDelete={onDelete}
          onUnassignGuest={onUnassignGuest}
        />
      ))}
    </div>
  );
}
