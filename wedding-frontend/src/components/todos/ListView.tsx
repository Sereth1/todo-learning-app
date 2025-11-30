"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Filter,
  Flag,
  Folder,
  MoreHorizontal,
  Pencil,
  Pin,
  Search,
  SortAsc,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { TodoListItem, TodoCategorySummary, TodoStatus, TodoPriority } from "@/types";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, isPast, isToday, isTomorrow, isThisWeek } from "date-fns";

interface ListViewProps {
  todos: TodoListItem[];
  categories: TodoCategorySummary[];
  onTodoClick: (todo: TodoListItem) => void;
  onEdit: (todo: TodoListItem) => void;
  onComplete: (todo: TodoListItem) => void;
  onDelete: (todo: TodoListItem) => void;
  onBulkUpdate?: (todoIds: number[], updates: Partial<TodoListItem>) => void;
}

type SortOption = "due_date" | "priority" | "created_at" | "title" | "category";
type GroupOption = "none" | "status" | "category" | "priority" | "due_date";
type FilterStatus = "all" | TodoStatus;
type FilterPriority = "all" | TodoPriority;

const statusConfig: Record<TodoStatus, { label: string; color: string }> = {
  not_started: { label: "Not Started", color: "bg-gray-100 text-gray-700" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
  waiting: { label: "Waiting", color: "bg-yellow-100 text-yellow-700" },
  completed: { label: "Completed", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
};

const priorityConfig: Record<TodoPriority, { label: string; color: string; order: number }> = {
  urgent: { label: "Urgent", color: "text-red-500", order: 0 },
  high: { label: "High", color: "text-orange-500", order: 1 },
  medium: { label: "Medium", color: "text-blue-500", order: 2 },
  low: { label: "Low", color: "text-slate-400", order: 3 },
};

export function ListView({
  todos,
  categories,
  onTodoClick,
  onEdit,
  onComplete,
  onDelete,
  onBulkUpdate,
}: ListViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("due_date");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sortDesc, _setSortDesc] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupOption>("status");
  const [selectedTodos, setSelectedTodos] = useState<Set<number>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["all"]));

  // Filter todos
  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      // Search - only search fields that exist on TodoListItem
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches =
          todo.title.toLowerCase().includes(query) ||
          todo.category_name?.toLowerCase().includes(query) ||
          todo.assigned_to_name?.toLowerCase().includes(query);
        if (!matches) return false;
      }

      // Status filter
      if (statusFilter !== "all" && todo.status !== statusFilter) return false;

      // Priority filter
      if (priorityFilter !== "all" && todo.priority !== priorityFilter) return false;

      // Category filter
      if (categoryFilter !== "all" && todo.category?.toString() !== categoryFilter)
        return false;

      return true;
    });
  }, [todos, searchQuery, statusFilter, priorityFilter, categoryFilter]);

  // Sort todos
  const sortedTodos = useMemo(() => {
    return [...filteredTodos].sort((a, b) => {
      // Pinned items always first
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;

      let comparison = 0;
      switch (sortBy) {
        case "due_date":
          if (!a.due_date && !b.due_date) comparison = 0;
          else if (!a.due_date) comparison = 1;
          else if (!b.due_date) comparison = -1;
          else comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          break;
        case "priority":
          comparison = priorityConfig[a.priority].order - priorityConfig[b.priority].order;
          break;
        case "created_at":
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "category":
          const catA = categories.find((c) => c.id === a.category)?.name || "";
          const catB = categories.find((c) => c.id === b.category)?.name || "";
          comparison = catA.localeCompare(catB);
          break;
      }

      return sortDesc ? -comparison : comparison;
    });
  }, [filteredTodos, sortBy, sortDesc, categories]);

  // Group todos
  const groupedTodos = useMemo(() => {
    if (groupBy === "none") {
      return { "All Tasks": sortedTodos };
    }

    const groups: Record<string, TodoListItem[]> = {};

    sortedTodos.forEach((todo) => {
      let groupKey: string;

      switch (groupBy) {
        case "status":
          groupKey = statusConfig[todo.status].label;
          break;
        case "category":
          const cat = categories.find((c) => c.id === todo.category);
          groupKey = cat?.name || "Uncategorized";
          break;
        case "priority":
          groupKey = priorityConfig[todo.priority].label;
          break;
        case "due_date":
          if (!todo.due_date) {
            groupKey = "No Due Date";
          } else {
            const date = new Date(todo.due_date);
            if (isPast(date) && !isToday(date)) {
              groupKey = "Overdue";
            } else if (isToday(date)) {
              groupKey = "Today";
            } else if (isTomorrow(date)) {
              groupKey = "Tomorrow";
            } else if (isThisWeek(date)) {
              groupKey = "This Week";
            } else {
              groupKey = "Later";
            }
          }
          break;
        default:
          groupKey = "All";
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(todo);
    });

    return groups;
  }, [sortedTodos, groupBy, categories]);

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTodos.size === filteredTodos.length) {
      setSelectedTodos(new Set());
    } else {
      setSelectedTodos(new Set(filteredTodos.map((t) => t.id)));
    }
  };

  const toggleSelectTodo = (todoId: number) => {
    setSelectedTodos((prev) => {
      const next = new Set(prev);
      if (next.has(todoId)) {
        next.delete(todoId);
      } else {
        next.add(todoId);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setCategoryFilter("all");
  };

  const hasActiveFilters =
    searchQuery || statusFilter !== "all" || priorityFilter !== "all" || categoryFilter !== "all";

  const getDueDateDisplay = (todo: TodoListItem) => {
    if (!todo.due_date) return null;

    const date = new Date(todo.due_date);
    const isOverdue = isPast(date) && !isToday(date) && todo.status !== "completed";
    const isDueToday = isToday(date);

    return (
      <span
        className={cn(
          "text-xs flex items-center gap-1",
          isOverdue && "text-red-600 font-medium",
          isDueToday && "text-amber-600 font-medium",
          !isOverdue && !isDueToday && "text-muted-foreground"
        )}
      >
        <Calendar className="h-3 w-3" />
        {isOverdue
          ? `Overdue (${formatDistanceToNow(date)})`
          : isDueToday
          ? "Today"
          : format(date, "MMM d")}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as FilterStatus)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(statusConfig).map(([value, { label }]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={priorityFilter}
            onValueChange={(v) => setPriorityFilter(v as FilterPriority)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              {Object.entries(priorityConfig).map(([value, { label }]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={categoryFilter}
            onValueChange={setCategoryFilter}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="h-6 w-px bg-border" />

          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupOption)}>
            <SelectTrigger className="w-[130px]">
              <Folder className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Grouping</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="category">Category</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="due_date">Due Date</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[130px]">
              <SortAsc className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="due_date">Due Date</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="created_at">Created</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="category">Category</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedTodos.size > 0 && (
        <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
          <span className="text-sm font-medium">{selectedTodos.size} selected</span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (onBulkUpdate) {
                  onBulkUpdate(Array.from(selectedTodos), { status: "completed" });
                }
                setSelectedTodos(new Set());
              }}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Complete
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSelectedTodos(new Set())}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filteredTodos.length} task{filteredTodos.length !== 1 ? "s" : ""}
          {hasActiveFilters && ` (filtered from ${todos.length})`}
        </span>
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedTodos.size === filteredTodos.length && filteredTodos.length > 0}
            onCheckedChange={toggleSelectAll}
          />
          <span>Select All</span>
        </div>
      </div>

      {/* Todo List */}
      <div className="space-y-4">
        {Object.entries(groupedTodos).map(([groupName, groupTodos]) => (
          <Collapsible
            key={groupName}
            open={expandedGroups.has(groupName) || expandedGroups.has("all")}
            onOpenChange={() => toggleGroup(groupName)}
          >
            <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-gray-50 rounded-lg">
              {expandedGroups.has(groupName) || expandedGroups.has("all") ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <span className="font-medium">{groupName}</span>
              <Badge variant="secondary" className="ml-2">
                {groupTodos.length}
              </Badge>
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-2">
              <div className="space-y-1 pl-6">
                <AnimatePresence>
                  {groupTodos.map((todo) => {
                    const category = categories.find((c) => c.id === todo.category);

                    return (
                      <motion.div
                        key={todo.id}
                        layout
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border hover:shadow-sm transition-all cursor-pointer group",
                          todo.status === "completed" && "bg-gray-50 opacity-60",
                          todo.is_pinned && "border-blue-200 bg-blue-50/30"
                        )}
                        onClick={() => onTodoClick(todo)}
                      >
                        {/* Checkbox */}
                        <Checkbox
                          checked={selectedTodos.has(todo.id)}
                          onCheckedChange={() => toggleSelectTodo(todo.id)}
                          onClick={(e) => e.stopPropagation()}
                        />

                        {/* Priority indicator */}
                        <Flag
                          className={cn(
                            "h-4 w-4 shrink-0",
                            priorityConfig[todo.priority].color
                          )}
                        />

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {todo.is_pinned && (
                              <Pin className="h-3 w-3 text-blue-500" />
                            )}
                            {todo.is_milestone && (
                              <Star className="h-3 w-3 text-purple-500" />
                            )}
                            <span
                              className={cn(
                                "font-medium truncate",
                                todo.status === "completed" && "line-through"
                              )}
                            >
                              {todo.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            {category && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: category.color }}
                                />
                                {category.name}
                              </span>
                            )}
                            {getDueDateDisplay(todo)}
                            {todo.checklist_progress && todo.checklist_progress.total > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {todo.checklist_progress.completed}/{todo.checklist_progress.total} items
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Progress */}
                        {todo.checklist_progress && todo.checklist_progress.total > 0 && (
                          <div className="w-16 shrink-0">
                            <Progress
                              value={todo.checklist_progress.percent}
                              className="h-1"
                            />
                          </div>
                        )}

                        {/* Status badge */}
                        <Badge
                          className={cn("shrink-0", statusConfig[todo.status].color)}
                        >
                          {statusConfig[todo.status].label}
                        </Badge>

                        {/* Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(todo);
                              }}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {todo.status !== "completed" && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onComplete(todo);
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Complete
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(todo);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>

      {/* Empty State */}
      {filteredTodos.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            {hasActiveFilters ? (
              <>
                <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No tasks match your filters</p>
                <p className="text-sm mt-1">Try adjusting your filters or search query</p>
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Clear all filters
                </Button>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No tasks yet</p>
                <p className="text-sm mt-1">Create your first task to get started</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ListView;
