"use client";

import { useState } from "react";
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
import { format, formatDistanceToNow, isPast, isToday } from "date-fns";
import type { FilterOption, TodoGroup, SortOption as SortOptionType, GroupOption as GroupOptionType } from "@/actions/todos";

interface ListViewProps {
  // Data from backend
  todos: TodoListItem[];
  groupedTodos?: Record<string, TodoGroup> | null;
  categories: TodoCategorySummary[];
  totalCount: number;
  filteredCount: number;
  // Filter options from backend
  filters: {
    status: FilterOption[];
    priority: FilterOption[];
    category: FilterOption[];
  };
  sortOptions: SortOptionType[];
  groupOptions: GroupOptionType[];
  // Current filter state
  currentFilters: {
    status: string;
    priority: string;
    category: string;
    search: string;
    sort_by: string;
    sort_order: string;
    group_by: string;
  };
  // Filter change callbacks (these call backend)
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: string) => void;
  onCategoryChange: (category: string) => void;
  onSearchChange: (search: string) => void;
  onSortByChange: (sortBy: string) => void;
  onSortOrderChange: (sortOrder: "asc" | "desc") => void;
  onGroupByChange: (groupBy: string) => void;
  onClearFilters: () => void;
  // Todo action callbacks
  onTodoClick: (todo: TodoListItem) => void;
  onEdit: (todo: TodoListItem) => void;
  onComplete: (todo: TodoListItem) => void;
  onDelete: (todo: TodoListItem) => void;
  onTodoStatusChange?: (todo: TodoListItem, newStatus: TodoStatus) => void;
  onBulkUpdate?: (todoIds: number[], updates: Partial<TodoListItem>) => void;
}

const statusConfig: Record<TodoStatus, { label: string; color: string }> = {
  not_started: { label: "Not Started", color: "bg-gray-100 text-gray-700" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
  waiting: { label: "Waiting", color: "bg-yellow-100 text-yellow-700" },
  completed: { label: "Completed", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
};

const priorityConfig: Record<TodoPriority, { label: string; color: string }> = {
  urgent: { label: "Urgent", color: "text-red-500" },
  high: { label: "High", color: "text-orange-500" },
  medium: { label: "Medium", color: "text-blue-500" },
  low: { label: "Low", color: "text-slate-400" },
};

export function ListView({
  todos,
  groupedTodos,
  categories,
  totalCount,
  filteredCount,
  filters,
  sortOptions,
  groupOptions,
  currentFilters,
  onStatusChange,
  onPriorityChange,
  onCategoryChange,
  onSearchChange,
  onSortByChange,
  onGroupByChange,
  onClearFilters,
  onTodoClick,
  onEdit,
  onComplete,
  onDelete,
  onTodoStatusChange,
  onBulkUpdate,
}: ListViewProps) {
  const [selectedTodos, setSelectedTodos] = useState<Set<number>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [searchInput, setSearchInput] = useState(currentFilters.search || "");

  const hasActiveFilters =
    currentFilters.search ||
    (currentFilters.status !== "all" && currentFilters.status !== "") ||
    (currentFilters.priority !== "all" && currentFilters.priority !== "") ||
    (currentFilters.category !== "all" && currentFilters.category !== "");

  const isGroupExpanded = (groupKey: string) => !collapsedGroups.has(groupKey);

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTodos.size === todos.length) {
      setSelectedTodos(new Set());
    } else {
      setSelectedTodos(new Set(todos.map((t) => t.id)));
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

  // Debounced search
  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
    // Debounce the API call
    const timeoutId = setTimeout(() => {
      onSearchChange(value);
    }, 300);
    return () => clearTimeout(timeoutId);
  };

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

  // Render a single todo item
  const renderTodoItem = (todo: TodoListItem) => {
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
          className={cn("h-4 w-4 shrink-0", priorityConfig[todo.priority].color)}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {todo.is_pinned && <Pin className="h-3 w-3 text-blue-500" />}
            {todo.is_milestone && <Star className="h-3 w-3 text-purple-500" />}
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
            <Progress value={todo.checklist_progress.percent} className="h-1" />
          </div>
        )}

        {/* Status dropdown */}
        <div onClick={(e) => e.stopPropagation()}>
          <Select
            value={todo.status}
            onValueChange={(value) => {
              if (onTodoStatusChange && value !== todo.status) {
                onTodoStatusChange(todo, value as TodoStatus);
              }
            }}
          >
            <SelectTrigger
              className={cn(
                "h-7 w-[120px] text-xs border-0",
                statusConfig[todo.status].color
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusConfig).map(([value, { label }]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            placeholder="Search tasks..."
            className="pl-9"
          />
        </div>

        {/* Filters - using backend filter options */}
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={currentFilters.status || "all"}
            onValueChange={onStatusChange}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {filters.status.map((filter) => (
                <SelectItem key={filter.value} value={filter.value}>
                  <span className="flex items-center justify-between w-full gap-2">
                    {filter.label}
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {filter.count}
                    </Badge>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentFilters.priority || "all"}
            onValueChange={onPriorityChange}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              {filters.priority.map((filter) => (
                <SelectItem key={filter.value} value={filter.value}>
                  <span className="flex items-center justify-between w-full gap-2">
                    {filter.label}
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {filter.count}
                    </Badge>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentFilters.category || "all"}
            onValueChange={onCategoryChange}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {filters.category.map((filter) => (
                <SelectItem key={filter.value} value={filter.value}>
                  <span className="flex items-center gap-2 w-full">
                    {filter.color && (
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: filter.color }}
                      />
                    )}
                    {filter.label}
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {filter.count}
                    </Badge>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="h-6 w-px bg-border" />

          <Select
            value={currentFilters.group_by || "none"}
            onValueChange={onGroupByChange}
          >
            <SelectTrigger className="w-[130px]">
              <Folder className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
              {groupOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentFilters.sort_by || "default"}
            onValueChange={onSortByChange}
          >
            <SelectTrigger className="w-[130px]">
              <SortAsc className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
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
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedTodos(new Set())}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {filteredCount} task{filteredCount !== 1 ? "s" : ""}
          {hasActiveFilters && ` (filtered from ${totalCount})`}
        </span>
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedTodos.size === todos.length && todos.length > 0}
            onCheckedChange={toggleSelectAll}
          />
          <span>Select All</span>
        </div>
      </div>

      {/* Todo List - using backend grouped data if available */}
      <div className="space-y-4">
        {groupedTodos && Object.keys(groupedTodos).length > 0 ? (
          // Render grouped todos from backend
          Object.entries(groupedTodos).map(([, group]) => (
            <Collapsible
              key={group.key}
              open={isGroupExpanded(group.key)}
              onOpenChange={() => toggleGroup(group.key)}
            >
              <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                {isGroupExpanded(group.key) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                {group.color && (
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                )}
                <span className="font-medium">{group.label}</span>
                <Badge variant="secondary" className="ml-2">
                  {group.count}
                </Badge>
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-2">
                <div className="space-y-1 pl-6">
                  <AnimatePresence>
                    {group.todos.map((todo) => renderTodoItem(todo))}
                  </AnimatePresence>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))
        ) : (
          // Render flat list (no grouping)
          <div className="space-y-1">
            <AnimatePresence>
              {todos.map((todo) => renderTodoItem(todo))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Empty State */}
      {todos.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            {hasActiveFilters ? (
              <>
                <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No tasks match your filters</p>
                <p className="text-sm mt-1">Try adjusting your filters or search query</p>
                <Button variant="link" onClick={onClearFilters} className="mt-2">
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
