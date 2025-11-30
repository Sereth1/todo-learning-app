"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Clock,
  DollarSign,
  ExternalLink,
  Flag,
  MapPin,
  MoreHorizontal,
  Pencil,
  Phone,
  Mail,
  Star,
  Trash2,
  User,
  Building,
  Plus,
  CheckCircle2,
  Circle,
  X,
  AlertCircle,
  ListChecks,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Todo, TodoListItem, TodoChecklist, TodoCategorySummary, TodoStatus, TodoPriority } from "@/types";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, isPast, isToday } from "date-fns";
import {
  createChecklist,
  deleteChecklist,
  toggleChecklist,
} from "@/actions/todos";
import { toast } from "sonner";

interface TodoDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todo: Todo | null;
  categories: TodoCategorySummary[];
  onEdit: (todo: Todo | TodoListItem) => void;
  onComplete: (todo: Todo | TodoListItem) => void;
  onDelete: (todo: Todo | TodoListItem) => void;
  onUpdate?: () => void;
}

const statusConfig: Record<
  TodoStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  not_started: {
    label: "Not Started",
    color: "bg-gray-100 text-gray-700",
    icon: <Circle className="h-4 w-4" />,
  },
  in_progress: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-700",
    icon: <Clock className="h-4 w-4" />,
  },
  waiting: {
    label: "Waiting",
    color: "bg-yellow-100 text-yellow-700",
    icon: <AlertCircle className="h-4 w-4" />,
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-700",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-700",
    icon: <X className="h-4 w-4" />,
  },
};

const priorityConfig: Record<TodoPriority, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-slate-100 text-slate-700" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-700" },
  high: { label: "High", color: "bg-orange-100 text-orange-700" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-700" },
};

export function TodoDetailSheet({
  open,
  onOpenChange,
  todo,
  categories,
  onEdit,
  onComplete,
  onDelete,
  onUpdate,
}: TodoDetailSheetProps) {
  const [checklists, setChecklists] = useState<TodoChecklist[]>([]);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);

  useEffect(() => {
    if (todo?.checklist_items) {
      setChecklists(todo.checklist_items);
    }
  }, [todo]);

  if (!todo) return null;

  const category = categories.find((c) => c.id === todo.category);
  const isOverdue =
    todo.due_date && isPast(new Date(todo.due_date)) && todo.status !== "completed";
  const isDueToday = todo.due_date && isToday(new Date(todo.due_date));

  const handleToggleChecklist = async (checklistId: number, completed: boolean) => {
    try {
      await toggleChecklist(checklistId);
      setChecklists((prev) =>
        prev.map((item) =>
          item.id === checklistId
            ? {
                ...item,
                is_completed: completed,
                completed_at: completed ? new Date().toISOString() : undefined,
              }
            : item
        )
      );
      onUpdate?.();
    } catch {
      toast.error("Failed to update checklist item");
    }
  };

  const handleAddChecklistItem = async () => {
    if (!newItemTitle.trim()) return;
    setIsAddingItem(true);

    try {
      const result = await createChecklist({
        todo: todo.id,
        title: newItemTitle.trim(),
        order: checklists.length,
      });

      if (result.success && result.data) {
        setChecklists((prev) => [...prev, result.data!]);
        setNewItemTitle("");
        onUpdate?.();
        toast.success("Checklist item added");
      } else {
        toast.error(result.error || "Failed to add item");
      }
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleDeleteChecklistItem = async (checklistId: number) => {
    try {
      await deleteChecklist(checklistId);
      setChecklists((prev) => prev.filter((item) => item.id !== checklistId));
      onUpdate?.();
      toast.success("Checklist item removed");
    } catch {
      toast.error("Failed to delete item");
    }
  };

  const completedItems = checklists.filter((c) => c.is_completed).length;
  const totalItems = checklists.length;
  const checklistProgress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl p-0">
        {/* Header */}
        <div className="p-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                {todo.is_pinned && (
                  <Badge variant="outline" className="text-xs">
                    Pinned
                  </Badge>
                )}
                {todo.is_milestone && (
                  <Badge className="bg-purple-100 text-purple-700 text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Milestone
                  </Badge>
                )}
              </div>
              <SheetTitle className="text-xl">{todo.title}</SheetTitle>
              {category && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </div>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    onEdit(todo);
                    onOpenChange(false);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                {todo.status !== "completed" && (
                  <DropdownMenuItem
                    onClick={() => {
                      onComplete(todo);
                      onOpenChange(false);
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark Complete
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => {
                    onDelete(todo);
                    onOpenChange(false);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Status & Priority Badges */}
          <div className="flex items-center gap-2 mt-4">
            <Badge className={cn("gap-1", statusConfig[todo.status].color)}>
              {statusConfig[todo.status].icon}
              {statusConfig[todo.status].label}
            </Badge>
            <Badge className={priorityConfig[todo.priority].color}>
              <Flag className="h-3 w-3 mr-1" />
              {priorityConfig[todo.priority].label}
            </Badge>
            {isOverdue && (
              <Badge className="bg-red-100 text-red-700">
                <AlertCircle className="h-3 w-3 mr-1" />
                Overdue
              </Badge>
            )}
            {isDueToday && !isOverdue && (
              <Badge className="bg-amber-100 text-amber-700">Due Today</Badge>
            )}
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="p-6 space-y-6">
            {/* Description */}
            {todo.description && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Description
                </h4>
                <p className="text-sm whitespace-pre-wrap">{todo.description}</p>
              </div>
            )}

            {/* Due Date & Time */}
            {(todo.due_date || todo.due_time) && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Due</h4>
                <div className="flex items-center gap-4 text-sm">
                  {todo.due_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span
                        className={cn(
                          isOverdue && "text-red-600 font-medium",
                          isDueToday && "text-amber-600 font-medium"
                        )}
                      >
                        {format(new Date(todo.due_date), "EEEE, MMMM d, yyyy")}
                      </span>
                    </div>
                  )}
                  {todo.due_time && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{todo.due_time}</span>
                    </div>
                  )}
                </div>
                {todo.due_date && (
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(todo.due_date), { addSuffix: true })}
                  </p>
                )}
              </div>
            )}

            <Separator />

            {/* Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ListChecks className="h-4 w-4" />
                  Checklist
                </h4>
                {totalItems > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {completedItems}/{totalItems} complete
                  </span>
                )}
              </div>

              {totalItems > 0 && (
                <Progress value={checklistProgress} className="h-2" />
              )}

              <div className="space-y-2">
                {checklists.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 group"
                  >
                    <Checkbox
                      checked={item.is_completed}
                      onCheckedChange={(checked) =>
                        handleToggleChecklist(item.id, checked as boolean)
                      }
                    />
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        item.is_completed && "line-through text-muted-foreground"
                      )}
                    >
                      {item.title}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => handleDeleteChecklistItem(item.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Add new item */}
              <div className="flex gap-2">
                <Input
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  placeholder="Add checklist item..."
                  className="text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddChecklistItem();
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleAddChecklistItem}
                  disabled={!newItemTitle.trim() || isAddingItem}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Cost Information */}
            {(todo.estimated_cost || todo.actual_cost) && (
              <>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Budget
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {todo.estimated_cost && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Estimated</p>
                        <p className="text-lg font-semibold">
                          €{todo.estimated_cost.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {todo.actual_cost && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Actual</p>
                        <p className="text-lg font-semibold">
                          €{todo.actual_cost.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                  {todo.estimated_cost && todo.actual_cost && (
                    <p
                      className={cn(
                        "text-xs",
                        todo.actual_cost > todo.estimated_cost
                          ? "text-red-600"
                          : "text-green-600"
                      )}
                    >
                      {todo.actual_cost > todo.estimated_cost ? "Over" : "Under"}{" "}
                      budget by €
                      {Math.abs(
                        todo.actual_cost - todo.estimated_cost
                      ).toLocaleString()}
                    </p>
                  )}
                </div>
                <Separator />
              </>
            )}

            {/* Vendor Information */}
            {todo.vendor_name && (
              <>
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Vendor
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{todo.vendor_name}</span>
                    </div>
                    {todo.vendor_contact && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{todo.vendor_contact}</span>
                      </div>
                    )}
                    {todo.vendor_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`mailto:${todo.vendor_email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {todo.vendor_email}
                        </a>
                      </div>
                    )}
                    {todo.vendor_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`tel:${todo.vendor_phone}`}
                          className="text-blue-600 hover:underline"
                        >
                          {todo.vendor_phone}
                        </a>
                      </div>
                    )}
                    {todo.vendor_notes && (
                      <p className="text-muted-foreground mt-2">{todo.vendor_notes}</p>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Location */}
            {todo.location && (
              <>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </h4>
                  <p className="text-sm">{todo.location}</p>
                  {todo.location_url && (
                    <a
                      href={todo.location_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      View on Map
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <Separator />
              </>
            )}

            {/* External Link */}
            {todo.external_url && (
              <>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    External Link
                  </h4>
                  <a
                    href={todo.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {todo.external_url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <Separator />
              </>
            )}

            {/* Notes */}
            {todo.notes && (
              <>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                    {todo.notes}
                  </p>
                </div>
                <Separator />
              </>
            )}

            {/* Metadata */}
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>Created {format(new Date(todo.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
              {todo.completed_at && (
                <p>
                  Completed{" "}
                  {format(new Date(todo.completed_at), "MMM d, yyyy 'at' h:mm a")}
                </p>
              )}
              {todo.reminder_date && (
                <p className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Reminder set for {format(new Date(todo.reminder_date), "MMM d, yyyy")}
                </p>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export default TodoDetailSheet;
