"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Star,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { TodoListItem, TodoTimelineGroup } from "@/types";
import {
  format,
  parseISO,
  differenceInDays,
  isPast,
  isThisMonth,
} from "date-fns";
import { cn } from "@/lib/utils";

interface TimelineViewProps {
  todos: TodoListItem[];
  timelineGroups?: TodoTimelineGroup[];
  weddingDate?: string;
  onTodoClick: (todo: TodoListItem) => void;
  onComplete: (id: number) => void;
}

export function TimelineView({
  todos,
  timelineGroups,
  weddingDate,
  onTodoClick,
  onComplete,
}: TimelineViewProps) {
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const weddingDateParsed = weddingDate ? parseISO(weddingDate) : null;
  const today = new Date();

  // Group todos by month if not provided
  const groups = useMemo(() => {
    if (timelineGroups) return timelineGroups;

    const grouped: Record<string, TodoListItem[]> = {};
    const noDate: TodoListItem[] = [];

    todos.forEach((todo) => {
      if (todo.due_date) {
        const monthKey = format(parseISO(todo.due_date), "yyyy-MM");
        if (!grouped[monthKey]) {
          grouped[monthKey] = [];
        }
        grouped[monthKey].push(todo);
      } else {
        noDate.push(todo);
      }
    });

    const result: TodoTimelineGroup[] = Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, todos]) => ({
        month,
        todos: todos.sort((a, b) => {
          if (!a.due_date || !b.due_date) return 0;
          return a.due_date.localeCompare(b.due_date);
        }),
      }));

    if (noDate.length > 0) {
      result.push({ month: "no_date", label: "No Due Date", todos: noDate });
    }

    return result;
  }, [todos, timelineGroups]);

  const toggleMonth = (month: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(month)) {
        next.delete(month);
      } else {
        next.add(month);
      }
      return next;
    });
  };

  // Calculate days until wedding
  const daysUntilWedding = weddingDateParsed
    ? differenceInDays(weddingDateParsed, today)
    : null;

  return (
    <div className="space-y-6">
      {/* Wedding countdown */}
      {weddingDateParsed && daysUntilWedding !== null && daysUntilWedding >= 0 && (
        <Card className="bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-pink-600 font-medium">
                  Wedding Day 💒
                </p>
                <p className="text-2xl font-bold text-pink-700">
                  {format(weddingDateParsed, "EEEE, MMMM d, yyyy")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-pink-600">
                  {daysUntilWedding}
                </p>
                <p className="text-sm text-pink-500">
                  {daysUntilWedding === 1 ? "day" : "days"} to go
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gray-200" />

        <div className="space-y-6">
          {groups.map((group, groupIndex) => {
            const isNoDate = group.month === "no_date";
            const monthDate = isNoDate ? null : parseISO(`${group.month}-01`);
            const isCurrentMonth = monthDate && isThisMonth(monthDate);
            const isPastMonth = monthDate && isPast(monthDate) && !isCurrentMonth;
            const isExpanded =
              expandedMonths.has(group.month) || isCurrentMonth || groupIndex < 3;

            // Calculate progress for month
            const completedCount = group.todos.filter(
              (t) => t.status === "completed"
            ).length;
            const totalCount = group.todos.length;
            const progressPercent =
              totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            // Count milestones and overdue
            const milestoneCount = group.todos.filter(
              (t) => t.is_milestone
            ).length;
            const overdueCount = group.todos.filter(
              (t) => t.is_overdue && t.status !== "completed"
            ).length;

            return (
              <div key={group.month} className="relative">
                {/* Month header */}
                <button
                  onClick={() => toggleMonth(group.month)}
                  className={cn(
                    "flex items-center gap-3 w-full text-left group",
                    "hover:bg-gray-50 rounded-lg p-2 -ml-2 transition-colors"
                  )}
                >
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      "relative z-10 w-10 h-10 rounded-full flex items-center justify-center",
                      "border-4 border-white shadow-sm",
                      isCurrentMonth
                        ? "bg-primary text-primary-foreground"
                        : isPastMonth
                        ? progressPercent === 100
                          ? "bg-green-500 text-white"
                          : "bg-gray-300"
                        : "bg-gray-100"
                    )}
                  >
                    {progressPercent === 100 ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : isNoDate ? (
                      <Clock className="h-5 w-5" />
                    ) : (
                      <Calendar className="h-5 w-5" />
                    )}
                  </div>

                  {/* Month info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">
                        {isNoDate
                          ? group.label
                          : format(monthDate!, "MMMM yyyy")}
                      </h3>
                      {isCurrentMonth && (
                        <Badge variant="default" className="text-xs">
                          Current
                        </Badge>
                      )}
                      {milestoneCount > 0 && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Star className="h-3 w-3" />
                          {milestoneCount} milestone
                          {milestoneCount > 1 ? "s" : ""}
                        </Badge>
                      )}
                      {overdueCount > 0 && (
                        <Badge variant="destructive" className="text-xs gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {overdueCount} overdue
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm text-muted-foreground">
                        {completedCount}/{totalCount} tasks completed
                      </span>
                      <Progress value={progressPercent} className="w-24 h-1.5" />
                    </div>
                  </div>

                  {/* Expand/collapse */}
                  <div className="text-muted-foreground">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </div>
                </button>

                {/* Tasks */}
                {isExpanded && (
                  <div className="ml-12 mt-2 space-y-2">
                    {group.todos.map((todo) => (
                      <button
                        key={todo.id}
                        onClick={() => onTodoClick(todo)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border bg-white",
                          "hover:shadow-sm transition-all group/item",
                          todo.status === "completed" && "opacity-60 bg-gray-50",
                          todo.is_overdue &&
                            todo.status !== "completed" &&
                            "border-red-200 bg-red-50/30"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              if (todo.status !== "completed") {
                                onComplete(todo.id);
                              }
                            }}
                            className="mt-0.5"
                          >
                            <Checkbox
                              checked={todo.status === "completed"}
                              className="pointer-events-none"
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {todo.is_milestone && (
                                <Star className="h-4 w-4 text-purple-500 shrink-0" />
                              )}
                              <span
                                className={cn(
                                  "font-medium",
                                  todo.status === "completed" && "line-through"
                                )}
                              >
                                {todo.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {todo.due_date && (
                                <span className="text-xs text-muted-foreground">
                                  {format(parseISO(todo.due_date), "MMM d")}
                                  {todo.due_time && ` at ${todo.due_time}`}
                                </span>
                              )}
                              {todo.category_name && (
                                <Badge
                                  variant="outline"
                                  className="text-xs"
                                  style={{
                                    borderColor: todo.category_color,
                                    color: todo.category_color,
                                  }}
                                >
                                  {todo.category_name}
                                </Badge>
                              )}
                              {todo.priority === "urgent" && (
                                <Badge variant="destructive" className="text-xs">
                                  Urgent
                                </Badge>
                              )}
                              {todo.priority === "high" && (
                                <Badge
                                  variant="outline"
                                  className="text-xs text-orange-600 border-orange-300"
                                >
                                  High Priority
                                </Badge>
                              )}
                            </div>

                            {/* Progress */}
                            {(todo.checklist_progress.total > 0 ||
                              todo.subtask_count.total > 0) && (
                              <div className="flex items-center gap-2 mt-2">
                                <Progress
                                  value={todo.progress_percent}
                                  className="w-20 h-1"
                                />
                                <span className="text-xs text-muted-foreground">
                                  {todo.progress_percent}%
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Status indicator */}
                          <div>
                            {todo.status === "completed" ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : todo.is_overdue ? (
                              <AlertCircle className="h-5 w-5 text-red-500" />
                            ) : todo.status === "in_progress" ? (
                              <Clock className="h-5 w-5 text-blue-500" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-300" />
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty state */}
      {groups.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No tasks yet</p>
          <p className="text-sm">Create tasks with due dates to see your timeline</p>
        </div>
      )}
    </div>
  );
}

export default TimelineView;
