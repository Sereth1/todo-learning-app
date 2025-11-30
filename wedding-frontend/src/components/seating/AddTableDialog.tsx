"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TableFormData } from "@/hooks/use-seating";

interface AddTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: TableFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddTableDialog({
  open,
  onOpenChange,
  formData,
  onChange,
  onSelectChange,
  onSubmit,
}: AddTableDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Table</DialogTitle>
          <DialogDescription>
            Create a new table for your seating arrangement
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Table Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Head Table"
                value={formData.name}
                onChange={onChange}
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
                onChange={onChange}
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
              onChange={onChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="table_category">Guest Category (Optional)</Label>
            <Select
              value={formData.table_category || "none"}
              onValueChange={(value) => onSelectChange("table_category", value === "none" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific category</SelectItem>
                <SelectItem value="family">Family</SelectItem>
                <SelectItem value="family_tier_first">Family - 1st Tier (Immediate)</SelectItem>
                <SelectItem value="family_tier_second">Family - 2nd Tier (Close Extended)</SelectItem>
                <SelectItem value="family_tier_third">Family - 3rd Tier (Distant)</SelectItem>
                <SelectItem value="friend">Friends</SelectItem>
                <SelectItem value="coworker">Coworkers</SelectItem>
                <SelectItem value="neighbor">Neighbors</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="kids">Kids Table</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Helps organize and identify which guests belong at this table
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              placeholder="Near the dance floor"
              value={formData.description}
              onChange={onChange}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-rose-500 hover:bg-rose-600">
              Create Table
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
