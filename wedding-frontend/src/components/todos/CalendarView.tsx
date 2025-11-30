"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { TodoListItem, TodoStatus } from "@/types";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
  todos: TodoListItem[];
  onTodoClick: (todo: TodoListItem) => void;
  onDateClick?: (date: Date) => void;
  weddingDate?: string;
}

const statusColors: Record<TodoStatus, string> = {
  not_started: "bg-slate-400",
  in_progress: "bg-blue-500",
  waiting: "bg-amber-500",
  completed: "bg-green-500",
  cancelled: "bg-gray-400",
};

export function CalendarView({
  todos,
  onTodoClick,
  onDateClick,
  weddingDate,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const weddingDateParsed = weddingDate ? parseISO(weddingDate) : null;

  // Group todos by date
  const todosByDate = useMemo(() => {
    const grouped: Record<string, TodoListItem[]> = {};
    todos.forEach((todo) => {
      if (todo.due_date) {
        const dateKey = todo.due_date;
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(todo);
      }
    });
    return grouped;
  }, [todos]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    onDateClick?.(date);
  };

  // Get todos for selected date
  const selectedDateTodos = selectedDate
    ? todosByDate[format(selectedDate, "yyyy-MM-dd")] || []
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {format(currentMonth, "MMMM yyyy")}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayTodos = todosByDate[dateKey] || [];
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);
              const isWeddingDay =
                weddingDateParsed && isSameDay(day, weddingDateParsed);

              // Count by status
              const completedCount = dayTodos.filter(
                (t) => t.status === "completed"
              ).length;
              const overdueCount = dayTodos.filter((t) => t.is_overdue).length;
              const urgentCount = dayTodos.filter(
                (t) => t.priority === "urgent" && t.status !== "completed"
              ).length;

              return (
                <button
                  key={dateKey}
                  onClick={() => handleDateClick(day)}
                  className={cn(
                    "relative min-h-[80px] p-1 rounded-lg border transition-all text-left",
                    isCurrentMonth
                      ? "bg-white hover:bg-gray-50"
                      : "bg-gray-50/50 text-muted-foreground",
                    isSelected && "ring-2 ring-primary",
                    isTodayDate && "border-primary",
                    isWeddingDay &&
                      "bg-pink-50 border-pink-300 ring-2 ring-pink-300"
                  )}
                >
                  {/* Date number */}
                  <div
                    className={cn(
                      "text-sm font-medium mb-1",
                      isTodayDate &&
                        "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center",
                      isWeddingDay && "text-pink-600"
                    )}
                  >
                    {format(day, "d")}
                  </div>

                  {/* Wedding day indicator */}
                  {isWeddingDay && (
                    <div className="text-[10px] text-pink-600 font-semibold mb-1">
                      💒 Wedding!
                    </div>
                  )}

                  {/* Todo indicators */}
                  {dayTodos.length > 0 && (
                    <div className="space-y-0.5">
                      {/* Show first 2-3 todos */}
                      {dayTodos.slice(0, 2).map((todo) => (
                        <div
                          key={todo.id}
                          className={cn(
                            "text-[10px] truncate px-1 py-0.5 rounded",
                            statusColors[todo.status],
                            "text-white"
                          )}
                          title={todo.title}
                        >
                          {todo.title}
                        </div>
                      ))}

                      {/* More indicator */}
                      {dayTodos.length > 2 && (
                        <div className="text-[10px] text-muted-foreground px-1">
                          +{dayTodos.length - 2} more
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status badges */}
                  {dayTodos.length > 0 && (
                    <div className="absolute bottom-1 right-1 flex gap-0.5">
                      {overdueCount > 0 && (
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                      )}
                      {urgentCount > 0 && (
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                      )}
                      {completedCount === dayTodos.length &&
                        dayTodos.length > 0 && (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-slate-400" />
              <span>To Do</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>Done</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span>Overdue</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected date details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {selectedDate ? format(selectedDate, "EEEE, MMM d") : "Select a date"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDate ? (
            selectedDateTodos.length > 0 ? (
              <div className="space-y-3">
                {selectedDateTodos.map((todo) => (
                  <button
                    key={todo.id}
                    onClick={() => onTodoClick(todo)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border hover:shadow-sm transition-all",
                      todo.status === "completed" && "opacity-60"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {todo.status === "completed" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                      ) : todo.is_overdue ? (
                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "font-medium truncate",
                            todo.status === "completed" && "line-through"
                          )}
                        >
                          {todo.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {todo.due_time && (
                            <span className="text-xs text-muted-foreground">
                              {todo.due_time}
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
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No tasks on this day</p>
                {onDateClick && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => onDateClick(selectedDate)}
                  >
                    Add Task
                  </Button>
                )}
              </div>
            )
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Click a date to see tasks</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CalendarView;
