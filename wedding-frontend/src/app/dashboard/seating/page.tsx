"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getTables, getGuests, createTable, deleteTable, assignSeat, unassignSeat } from "@/actions/wedding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  MoreHorizontal,
  Trash2,
  Users,
  CircleDot,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { toast } from "sonner";
import type { Table, Guest } from "@/types";

export default function SeatingPage() {
  const { wedding } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState<{ open: boolean; table: Table | null }>({
    open: false,
    table: null,
  });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; table: Table | null }>({
    open: false,
    table: null,
  });
  const [formData, setFormData] = useState({
    name: "",
    capacity: "8",
    table_number: "",
    description: "",
  });

  useEffect(() => {
    const loadData = async () => {
      if (!wedding) return;
      setIsLoading(true);
      const [tablesData, guestsData] = await Promise.all([
        getTables(),
        getGuests(),
      ]);
      setTables(tablesData);
      setGuests(guestsData);
      setIsLoading(false);
    };
    loadData();
  }, [wedding]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      capacity: "8",
      table_number: "",
      description: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.capacity) {
      toast.error("Please fill in required fields");
      return;
    }

    const result = await createTable({
      name: formData.name,
      capacity: parseInt(formData.capacity),
      table_number: formData.table_number ? parseInt(formData.table_number) : undefined,
      description: formData.description || undefined,
    });

    if (result.success && result.table) {
      setTables(prev => [...prev, result.table!]);
      toast.success("Table created successfully!");
      setShowAddDialog(false);
      resetForm();
    } else {
      toast.error(result.error || "Failed to create table");
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.table) return;
    
    const result = await deleteTable(deleteModal.table.id);
    if (result.success) {
      setTables(prev => prev.filter(t => t.id !== deleteModal.table!.id));
      toast.success("Table deleted successfully");
    } else {
      toast.error(result.error || "Failed to delete table");
    }
    setDeleteModal({ open: false, table: null });
  };

  const handleAssignGuest = async (guestId: number) => {
    if (!assignDialog.table) return;
    
    const result = await assignSeat(guestId, assignDialog.table.id);
    if (result.success) {
      // Refresh data
      const [tablesData, guestsData] = await Promise.all([
        getTables(),
        getGuests(),
      ]);
      setTables(tablesData);
      setGuests(guestsData);
      toast.success("Guest assigned to table!");
    } else {
      toast.error(result.error || "Failed to assign guest");
    }
  };

  const handleUnassignGuest = async (guestId: number) => {
    const result = await unassignSeat(guestId);
    if (result.success) {
      // Refresh data
      const [tablesData, guestsData] = await Promise.all([
        getTables(),
        getGuests(),
      ]);
      setTables(tablesData);
      setGuests(guestsData);
      toast.success("Guest removed from table");
    } else {
      toast.error(result.error || "Failed to remove guest");
    }
  };

  // Get unassigned confirmed guests
  const unassignedGuests = guests.filter(g => 
    g.attendance_status === "yes" && !g.table_assignment
  );

  // Get guests assigned to a specific table
  const getTableGuests = (tableId: number) => {
    return guests.filter(g => g.table_assignment === tableId);
  };

  const totalSeats = tables.reduce((sum, t) => sum + t.capacity, 0);
  const assignedSeats = tables.reduce((sum, t) => sum + (t.seats_taken || 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Seating</h1>
          <p className="text-gray-500">{tables.length} tables, {totalSeats} total seats</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-rose-500 hover:bg-rose-600">
              <Plus className="mr-2 h-4 w-4" />
              Add Table
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Table</DialogTitle>
              <DialogDescription>
                Create a new table for your seating arrangement
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Table Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Head Table"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="table_number">Table Number</Label>
                  <Input
                    id="table_number"
                    name="table_number"
                    type="number"
                    placeholder="1"
                    value={formData.table_number}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity *</Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.capacity}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="Near the dance floor"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-rose-500 hover:bg-rose-600">
                  Create Table
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CircleDot className="h-8 w-8 text-rose-500" />
              <div>
                <p className="text-2xl font-bold">{tables.length}</p>
                <p className="text-sm text-gray-500">Tables</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{assignedSeats} / {totalSeats}</p>
                <p className="text-sm text-gray-500">Seats Filled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <UserPlus className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{unassignedGuests.length}</p>
                <p className="text-sm text-gray-500">Unassigned Guests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Grid */}
      {tables.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CircleDot className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tables yet</h3>
            <p className="text-gray-500 mb-4">
              Create tables to start arranging your seating
            </p>
            <Button onClick={() => setShowAddDialog(true)} className="bg-rose-500 hover:bg-rose-600">
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Table
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map((table) => {
            const tableGuests = getTableGuests(table.id);
            const isFull = tableGuests.length >= table.capacity;
            
            return (
              <Card key={table.id}>
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
                          onClick={() => setAssignDialog({ open: true, table })}
                          disabled={isFull}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Assign Guest
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteModal({ open: true, table })}
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
                            onClick={() => handleUnassignGuest(guest.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <UserMinus className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {!isFull && unassignedGuests.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => setAssignDialog({ open: true, table })}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Assign Guest
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Assign Guest Dialog */}
      <Dialog open={assignDialog.open} onOpenChange={(open) => setAssignDialog({ open, table: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Guest to {assignDialog.table?.name}</DialogTitle>
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
                    handleAssignGuest(guest.id);
                    setAssignDialog({ open: false, table: null });
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
            <Button variant="outline" onClick={() => setAssignDialog({ open: false, table: null })}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModal.open} onOpenChange={(open) => setDeleteModal({ open, table: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Table</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteModal.table?.name}&quot;? 
              All seating assignments will be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModal({ open: false, table: null })}>
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
