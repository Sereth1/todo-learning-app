"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  Clock,
  MoreHorizontal,
  Pin,
  PinOff,
  CheckCircle2,
  RotateCcw,
  Trash2,
  Edit,
  AlertCircle,
  Star,
  ChevronRight,
  GripVertical,
  List,
} from "lucide-react";
import { TodoListItem, TodoStatus, TodoPriority } from "@/types";
import { format, formatDistanceToNow, isToday, isTomorrow } from "date-fns";
import { cn } from "@/lib/utils";

interface TodoCardProps {
  todo: TodoListItem;
  onComplete?: (id: number) => void;
  onReopen?: (id: number) => void;
  onTogglePin?: (id: number) => void;
  onEdit?: (todo: TodoListItem) => void;
  onDelete?: (id: number) => void;
  onClick?: (todo: TodoListItem) => void;
  isSelected?: boolean;
  onSelect?: (id: number, selected: boolean) => void;
  isDragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
  compact?: boolean;
}

const statusConfig: Record<
  TodoStatus,
  { label: string; color: string; bgColor: string }
> = {
  not_started: {
    label: "Not Started",
    color: "text-slate-600",
    bgColor: "bg-slate-100",
  },
  in_progress: {
    label: "In Progress",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  waiting: {
    label: "Waiting",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  completed: {
    label: "Completed",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-gray-500",
    bgColor: "bg-gray-100",
  },
};

const priorityConfig: Record<
  TodoPriority,
  { label: string; color: string; icon?: React.ReactNode }
> = {
  low: { label: "Low", color: "text-slate-500" },
  medium: { label: "Medium", color: "text-blue-500" },
  high: { label: "High", color: "text-orange-500" },
  urgent: {
    label: "Urgent",
    color: "text-red-500",
    icon: <AlertCircle className="h-3 w-3" />,
  },
};

export function TodoCard({
  todo,
  onComplete,
  onReopen,
  onTogglePin,
  onEdit,
  onDelete,
  onClick,
  isSelected,
  onSelect,
  isDragging,
  dragHandleProps,
  compact = false,
}: TodoCardProps) {
  const isCompleted = todo.status === "completed";
  const isCancelled = todo.status === "cancelled";
  const status = statusConfig[todo.status];
  const priority = priorityConfig[todo.priority];

  const dueInfo = useMemo(() => {
    if (!todo.due_date) return null;

    const dueDate = new Date(todo.due_date);
    const isOverdue = todo.is_overdue;

    if (isToday(dueDate)) {
      return { label: "Due today", color: "text-amber-600", urgent: true };
    }
    if (isTomorrow(dueDate)) {
      return { label: "Due tomorrow", color: "text-blue-600", urgent: false };
    }
    if (isOverdue) {
      return {
        label: `Overdue by ${formatDistanceToNow(dueDate)}`,
        color: "text-red-600",
        urgent: true,
      };
    }
    return {
      label: format(dueDate, "MMM d, yyyy"),
      color: "text-muted-foreground",
      urgent: false,
    };
  }, [todo.due_date, todo.is_overdue]);

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3 bg-white rounded-lg border hover:shadow-sm transition-all cursor-pointer",
          isDragging && "opacity-50 shadow-lg",
          isCompleted && "opacity-60",
          todo.is_pinned && "border-amber-300 bg-amber-50/30"
        )}
        onClick={() => onClick?.(todo)}
      >
        {dragHandleProps && (
          <div {...dragHandleProps} className="cursor-grab">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}

        <Checkbox
          checked={isCompleted}
          onCheckedChange={(checked) => {
            if (checked && !isCompleted) {
              onComplete?.(todo.id);
            } else if (!checked && isCompleted) {
              onReopen?.(todo.id);
            }
          }}
          onClick={(e) => e.stopPropagation()}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {todo.is_pinned && <Pin className="h-3 w-3 text-amber-500" />}
            {todo.is_milestone && <Star className="h-3 w-3 text-purple-500" />}
            <span
              className={cn(
                "font-medium truncate",
                isCompleted && "line-through text-muted-foreground"
              )}
            >
              {todo.title}
            </span>
          </div>
        </div>

        {todo.category_color && (
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: todo.category_color }}
          />
        )}

        {priority.icon && (
          <span className={priority.color}>{priority.icon}</span>
        )}

        {dueInfo && (
          <span className={cn("text-xs whitespace-nowrap", dueInfo.color)}>
            {dueInfo.label}
          </span>
        )}
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all cursor-pointer group",
        isDragging && "opacity-50 shadow-lg rotate-2",
        isCompleted && "opacity-75",
        todo.is_pinned && "border-amber-300 ring-1 ring-amber-200",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={() => onClick?.(todo)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Selection checkbox */}
          {onSelect && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect(todo.id, !!checked)}
              onClick={(e) => e.stopPropagation()}
              className="mt-1"
            />
          )}

          {/* Drag handle */}
          {dragHandleProps && (
            <div
              {...dragHandleProps}
              className="cursor-grab mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          )}

          {/* Completion checkbox */}
          <Checkbox
            checked={isCompleted}
            onCheckedChange={(checked) => {
              if (checked && !isCompleted) {
                onComplete?.(todo.id);
              } else if (!checked && isCompleted) {
                onReopen?.(todo.id);
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="mt-1"
          />

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {todo.is_pinned && (
                  <Pin className="h-4 w-4 text-amber-500 shrink-0" />
                )}
                {todo.is_milestone && (
                  <Star className="h-4 w-4 text-purple-500 shrink-0" />
                )}
                <h3
                  className={cn(
                    "font-semibold",
                    isCompleted && "line-through text-muted-foreground"
                  )}
                >
                  {todo.title}
                </h3>
              </div>

              {/* Actions menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!isCompleted && !isCancelled && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onComplete?.(todo.id);
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Mark Complete
                    </DropdownMenuItem>
                  )}
                  {(isCompleted || isCancelled) && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onReopen?.(todo.id);
                      }}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reopen
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin?.(todo.id);
                    }}
                  >
                    {todo.is_pinned ? (
                      <>
                        <PinOff className="h-4 w-4 mr-2" />
                        Unpin
                      </>
                    ) : (
                      <>
                        <Pin className="h-4 w-4 mr-2" />
                        Pin to Top
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(todo);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(todo.id);
                    }}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={cn(status.bgColor, status.color)}>
                {status.label}
              </Badge>

              {todo.category_name && (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1"
                  style={{
                    borderColor: todo.category_color,
                    color: todo.category_color,
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: todo.category_color }}
                  />
                  {todo.category_name}
                </Badge>
              )}

              {priority.icon && (
                <Badge variant="outline" className={cn("gap-1", priority.color)}>
                  {priority.icon}
                  {priority.label}
                </Badge>
              )}
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {dueInfo && (
                <div className={cn("flex items-center gap-1", dueInfo.color)}>
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{dueInfo.label}</span>
                </div>
              )}

              {todo.due_time && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{todo.due_time}</span>
                </div>
              )}

              {todo.assigned_to_name && (
                <span className="text-xs">
                  Assigned to {todo.assigned_to_name}
                </span>
              )}
            </div>

            {/* Progress bar for subtasks/checklist */}
            {(todo.checklist_progress.total > 0 ||
              todo.subtask_count.total > 0) && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <List className="h-3 w-3" />
                    <span>
                      {todo.checklist_progress.completed + todo.subtask_count.completed}/
                      {todo.checklist_progress.total + todo.subtask_count.total} items
                    </span>
                  </div>
                  <span>{todo.progress_percent}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${todo.progress_percent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Cost info */}
            {todo.estimated_cost && (
              <div className="text-sm text-muted-foreground">
                Est. €{todo.estimated_cost.toLocaleString()}
              </div>
            )}
          </div>

          {/* Arrow for detail view */}
          <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

export default TodoCard;
