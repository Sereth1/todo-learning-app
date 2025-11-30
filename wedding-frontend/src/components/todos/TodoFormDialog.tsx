"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Star,
  X,
  GripVertical,
} from "lucide-react";
import {
  Todo,
  TodoCreateData,
  TodoUpdateData,
  TodoCategorySummary,
  TodoPriority,
  TodoStatus,
} from "@/types";
import { format } from "date-fns";

interface TodoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todo?: Todo | null;
  categories: TodoCategorySummary[];
  weddingId: number;
  onSave: (data: TodoCreateData | TodoUpdateData) => Promise<void>;
  defaultStatus?: TodoStatus;
  defaultDate?: Date;
  isSheet?: boolean;
}

const priorityOptions: { value: TodoPriority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "text-slate-500" },
  { value: "medium", label: "Medium", color: "text-blue-500" },
  { value: "high", label: "High", color: "text-orange-500" },
  { value: "urgent", label: "Urgent", color: "text-red-500" },
];

const statusOptions: { value: TodoStatus; label: string }[] = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting", label: "Waiting" },
  { value: "completed", label: "Completed" },
];

export function TodoFormDialog({
  open,
  onOpenChange,
  todo,
  categories,
  weddingId,
  onSave,
  defaultStatus,
  defaultDate,
  isSheet = false,
}: TodoFormDialogProps) {
  const isEditing = !!todo;

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<TodoStatus>("not_started");
  const [priority, setPriority] = useState<TodoPriority>("medium");
  const [categoryId, setCategoryId] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [isMilestone, setIsMilestone] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  // Cost & Vendor
  const [estimatedCost, setEstimatedCost] = useState("");
  const [actualCost, setActualCost] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [vendorContact, setVendorContact] = useState("");
  const [vendorEmail, setVendorEmail] = useState("");
  const [vendorPhone, setVendorPhone] = useState("");
  const [vendorNotes, setVendorNotes] = useState("");

  // Location
  const [location, setLocation] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [externalUrl, setExternalUrl] = useState("");

  // Checklist items (for new todos)
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");

  // Reset form when todo changes
  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDescription(todo.description || "");
      setNotes(todo.notes || "");
      setStatus(todo.status);
      setPriority(todo.priority);
      setCategoryId(todo.category?.toString() || "");
      setDueDate(todo.due_date || "");
      setDueTime(todo.due_time || "");
      setReminderDate(todo.reminder_date || "");
      setIsMilestone(todo.is_milestone);
      setIsPinned(todo.is_pinned);
      setEstimatedCost(todo.estimated_cost?.toString() || "");
      setActualCost(todo.actual_cost?.toString() || "");
      setVendorName(todo.vendor_name || "");
      setVendorContact(todo.vendor_contact || "");
      setVendorEmail(todo.vendor_email || "");
      setVendorPhone(todo.vendor_phone || "");
      setVendorNotes(todo.vendor_notes || "");
      setLocation(todo.location || "");
      setLocationUrl(todo.location_url || "");
      setExternalUrl(todo.external_url || "");
      setChecklistItems([]);
    } else {
      // Reset for new todo
      setTitle("");
      setDescription("");
      setNotes("");
      setStatus(defaultStatus || "not_started");
      setPriority("medium");
      setCategoryId("");
      setDueDate(defaultDate ? format(defaultDate, "yyyy-MM-dd") : "");
      setDueTime("");
      setReminderDate("");
      setIsMilestone(false);
      setIsPinned(false);
      setEstimatedCost("");
      setActualCost("");
      setVendorName("");
      setVendorContact("");
      setVendorEmail("");
      setVendorPhone("");
      setVendorNotes("");
      setLocation("");
      setLocationUrl("");
      setExternalUrl("");
      setChecklistItems([]);
    }
    setActiveTab("basic");
  }, [todo, defaultStatus, defaultDate, open]);

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setChecklistItems((prev) => [...prev, newChecklistItem.trim()]);
      setNewChecklistItem("");
    }
  };

  const removeChecklistItem = (index: number) => {
    setChecklistItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;

    setIsLoading(true);

    const data: TodoCreateData | TodoUpdateData = {
      wedding: weddingId,
      title: title.trim(),
      description: description.trim() || undefined,
      notes: notes.trim() || undefined,
      status,
      priority,
      category: categoryId && categoryId !== "none" ? parseInt(categoryId) : undefined,
      due_date: dueDate || undefined,
      due_time: dueTime || undefined,
      reminder_date: reminderDate || undefined,
      is_milestone: isMilestone,
      is_pinned: isPinned,
      estimated_cost: estimatedCost ? parseFloat(estimatedCost) : undefined,
      actual_cost: actualCost ? parseFloat(actualCost) : undefined,
      vendor_name: vendorName.trim() || undefined,
      vendor_contact: vendorContact.trim() || undefined,
      vendor_email: vendorEmail.trim() || undefined,
      vendor_phone: vendorPhone.trim() || undefined,
      vendor_notes: vendorNotes.trim() || undefined,
      location: location.trim() || undefined,
      location_url: locationUrl.trim() || undefined,
      external_url: externalUrl.trim() || undefined,
    };

    // Add checklist items for new todos
    if (!isEditing && checklistItems.length > 0) {
      (data as TodoCreateData).checklist_items = checklistItems.map(
        (title, order) => ({ title, order })
      );
    }

    try {
      await onSave(data);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const formContent = (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="vendor">Vendor</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
        </TabsList>

        {/* Basic Tab */}
        <TabsContent value="basic" className="space-y-4 mt-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
            />
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TodoStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TodoPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className={opt.color}>{opt.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Due Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_time">Due Time</Label>
              <Input
                id="due_time"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
              />
            </div>
          </div>

          {/* Flags */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="milestone"
                checked={isMilestone}
                onCheckedChange={setIsMilestone}
              />
              <Label htmlFor="milestone" className="flex items-center gap-1">
                <Star className="h-4 w-4 text-purple-500" />
                Milestone
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="pinned"
                checked={isPinned}
                onCheckedChange={setIsPinned}
              />
              <Label htmlFor="pinned">Pin to Top</Label>
            </div>
          </div>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4 mt-4">
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Private notes..."
              rows={3}
            />
          </div>

          {/* Reminder */}
          <div className="space-y-2">
            <Label htmlFor="reminder">Reminder Date</Label>
            <Input
              id="reminder"
              type="date"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
            />
          </div>

          {/* Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimated_cost">Estimated Cost (€)</Label>
              <Input
                id="estimated_cost"
                type="number"
                step="0.01"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actual_cost">Actual Cost (€)</Label>
              <Input
                id="actual_cost"
                type="number"
                step="0.01"
                value={actualCost}
                onChange={(e) => setActualCost(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Venue or address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location_url">Location URL (Maps)</Label>
            <Input
              id="location_url"
              value={locationUrl}
              onChange={(e) => setLocationUrl(e.target.value)}
              placeholder="https://maps.google.com/..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="external_url">External Link</Label>
            <Input
              id="external_url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </TabsContent>

        {/* Vendor Tab */}
        <TabsContent value="vendor" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="vendor_name">Vendor Name</Label>
            <Input
              id="vendor_name"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="Company or person name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor_contact">Contact Person</Label>
            <Input
              id="vendor_contact"
              value={vendorContact}
              onChange={(e) => setVendorContact(e.target.value)}
              placeholder="Contact name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendor_email">Email</Label>
              <Input
                id="vendor_email"
                type="email"
                value={vendorEmail}
                onChange={(e) => setVendorEmail(e.target.value)}
                placeholder="vendor@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor_phone">Phone</Label>
              <Input
                id="vendor_phone"
                type="tel"
                value={vendorPhone}
                onChange={(e) => setVendorPhone(e.target.value)}
                placeholder="+1 234 567 890"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor_notes">Vendor Notes</Label>
            <Textarea
              id="vendor_notes"
              value={vendorNotes}
              onChange={(e) => setVendorNotes(e.target.value)}
              placeholder="Notes about the vendor..."
              rows={3}
            />
          </div>
        </TabsContent>

        {/* Checklist Tab */}
        <TabsContent value="checklist" className="space-y-4 mt-4">
          {isEditing ? (
            <p className="text-sm text-muted-foreground">
              Edit checklist items in the task detail view.
            </p>
          ) : (
            <>
              {/* Add new item */}
              <div className="flex gap-2">
                <Input
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  placeholder="Add checklist item..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addChecklistItem();
                    }
                  }}
                />
                <Button type="button" onClick={addChecklistItem} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Items list */}
              <div className="space-y-2">
                {checklistItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Checkbox disabled />
                    <span className="flex-1">{item}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeChecklistItem(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {checklistItems.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No checklist items yet. Add items to break down this task.
                  </p>
                )}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );

  const footer = (
    <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={() => onOpenChange(false)}>
        Cancel
      </Button>
      <Button onClick={handleSubmit} disabled={!title.trim() || isLoading}>
        {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Create Task"}
      </Button>
    </div>
  );

  if (isSheet) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{isEditing ? "Edit Task" : "New Task"}</SheetTitle>
          </SheetHeader>
          <div className="py-4">{formContent}</div>
          <SheetFooter>{footer}</SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>
        {formContent}
        <DialogFooter>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TodoFormDialog;
