"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Pencil, Trash2, Loader2, Users, MapPin, Table2 } from "lucide-react";
import { useRestaurantTables } from "@/hooks/use-restaurant-tables";

interface RestaurantTablesTabProps {
  accessCode: string;
}

export function RestaurantTablesTab({ accessCode }: RestaurantTablesTabProps) {
  const {
    tables,
    isLoading,
    isSaving,
    isDialogOpen,
    editingTable,
    formData,
    openDialog,
    handleDialogChange,
    updateFormField,
    handleSubmit,
    handleDelete,
  } = useRestaurantTables(accessCode);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Table2 className="h-5 w-5" />
            Tables
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Manage seating layout for the wedding
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Table
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingTable ? "Edit Table" : "Add New Table"}
                </DialogTitle>
                <DialogDescription>
                  {editingTable
                    ? "Update the table details"
                    : "Create a new table for the seating arrangement"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="table_number">Table Number</Label>
                    <Input
                      id="table_number"
                      type="number"
                      min={1}
                      placeholder="Auto"
                      value={formData.table_number || ""}
                      onChange={(e) =>
                        updateFormField(
                          "table_number",
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                    />
                    <p className="text-xs text-gray-500">Leave empty for auto</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity *</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min={1}
                      max={50}
                      required
                      value={formData.capacity}
                      onChange={(e) =>
                        updateFormField("capacity", parseInt(e.target.value) || 1)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Table Name (Optional)</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Rose Table, Family Table"
                    value={formData.name}
                    onChange={(e) => updateFormField("name", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Near dance floor, By the garden"
                    value={formData.location}
                    onChange={(e) => updateFormField("location", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special notes about this table"
                    value={formData.notes}
                    onChange={(e) => updateFormField("notes", e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="is_vip"
                    checked={formData.is_vip}
                    onCheckedChange={(checked) => updateFormField("is_vip", checked)}
                  />
                  <Label htmlFor="is_vip">VIP / Family Table</Label>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingTable ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {tables.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Table2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No tables yet</p>
            <p className="text-sm">Click &quot;Add Table&quot; to create your first table</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.map((table) => (
                <TableRow key={table.id}>
                  <TableCell className="font-medium">
                    #{table.table_number}
                    {table.is_vip && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        VIP
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{table.name || "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      {table.seats_taken}/{table.capacity}
                    </div>
                  </TableCell>
                  <TableCell>
                    {table.location ? (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-3 w-3" />
                        {table.location}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {table.is_full ? (
                      <Badge variant="secondary">Full</Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        {table.seats_available} available
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openDialog(table)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(table)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
