"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getTodoDashboard,
  createTodo,
  updateTodo,
  deleteTodo,
  completeTodo,
  reopenTodo,
  togglePinTodo,
  createCategory,
  updateCategory,
  deleteCategory,
  TodoDashboardFilters,
  DashboardQueryParams,
  TodoGroup,
  SortOption,
  GroupOption,
  CurrentFilters,
} from "@/actions/todos";
import {
  TodoListItem,
  TodoCreateData,
  TodoUpdateData,
  TodoStats,
  TodoCategorySummary,
  TodoCategoryCreateData,
  TodoStatus,
} from "@/types";
import { toast } from "sonner";

// Helper to get status display text
const getStatusDisplay = (status: TodoStatus): string => {
  const displays: Record<TodoStatus, string> = {
    not_started: "Not Started",
    in_progress: "In Progress",
    waiting: "Waiting",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return displays[status] || status;
};

// ======================
// CONSOLIDATED TODO DASHBOARD HOOK
// ======================

/**
 * Consolidated hook that fetches todos, categories, stats, and filters in a single request.
 * All filtering, sorting, and grouping is done on the backend.
 */
export function useTodoDashboard(weddingId: number | null) {
  const [todos, setTodos] = useState<TodoListItem[]>([]);
  const [groupedTodos, setGroupedTodos] = useState<Record<string, TodoGroup> | null>(null);
  const [categories, setCategories] = useState<TodoCategorySummary[]>([]);
  const [stats, setStats] = useState<TodoStats | null>(null);
  const [filters, setFilters] = useState<TodoDashboardFilters | null>(null);
  const [sortOptions, setSortOptions] = useState<SortOption[]>([]);
  const [groupOptions, setGroupOptions] = useState<GroupOption[]>([]);
  const [currentFilters, setCurrentFilters] = useState<CurrentFilters | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Query params for backend filtering - use ref to avoid stale closures
  const [queryParams, setQueryParams] = useState<DashboardQueryParams>({
    group_by: "status", // Default grouping
  });

  // Fetch dashboard data from backend
  const fetchDashboard = useCallback(async (params?: DashboardQueryParams) => {
    if (!weddingId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Use provided params or empty object (initial load)
    const result = await getTodoDashboard(weddingId, params);

    if (result.success && result.data) {
      setTodos(result.data.todos);
      setGroupedTodos(result.data.grouped_todos || null);
      setCategories(result.data.categories);
      setStats(result.data.stats);
      setFilters(result.data.filters);
      setSortOptions(result.data.sort_options || []);
      setGroupOptions(result.data.group_options || []);
      setCurrentFilters(result.data.current_filters || null);
      setTotalCount(result.data.total_count || 0);
      setFilteredCount(result.data.filtered_count || 0);
    } else {
      setError(result.error || "Failed to fetch dashboard data");
    }

    setIsLoading(false);
  }, [weddingId]);

  // Update filters and refetch from backend
  const updateFilters = useCallback((newParams: Partial<DashboardQueryParams>) => {
    setQueryParams(prevParams => {
      const updatedParams = { ...prevParams, ...newParams };
      // Schedule fetch outside setState to avoid side effects in updater
      queueMicrotask(() => fetchDashboard(updatedParams));
      return updatedParams;
    });
  }, [fetchDashboard]);

  // Initial load
  useEffect(() => {
    fetchDashboard(queryParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weddingId]); // Only on wedding change, not on every queryParams change

  // CRUD Operations with optimistic updates
  const addTodo = useCallback(async (data: TodoCreateData) => {
    const result = await createTodo(data);
    if (result.success && result.data) {
      // Add to list - the backend now returns TodoListItem format
      setTodos((prev) => [result.data!, ...prev]);
      
      // Update stats optimistically
      setStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          total: prev.total + 1,
          status_counts: {
            ...prev.status_counts,
            [data.status || "not_started"]: (prev.status_counts[data.status || "not_started"] || 0) + 1,
          },
        };
      });
      
      toast.success("Task created");
      return result.data;
    } else {
      toast.error(result.error || "Failed to create task");
      return null;
    }
  }, []);

  const editTodo = useCallback(async (todoId: number, data: TodoUpdateData) => {
    // Optimistic update - update the todo in place
    const previousTodos = todos;
    const previousStats = stats;
    
    setTodos((prev) =>
      prev.map((todo) => {
        if (todo.id !== todoId) return todo;
        
        // Build updated todo with computed fields
        const updated: TodoListItem = { 
          ...todo, 
          ...data,
          // Update status display if status changed
          status_display: data.status ? getStatusDisplay(data.status) : todo.status_display,
        };
        
        return updated;
      })
    );

    // Update stats optimistically if status changed
    if (data.status && stats) {
      const oldTodo = todos.find(t => t.id === todoId);
      if (oldTodo && oldTodo.status !== data.status) {
        setStats({
          ...stats,
          status_counts: {
            ...stats.status_counts,
            [oldTodo.status]: Math.max(0, (stats.status_counts[oldTodo.status] || 0) - 1),
            [data.status]: (stats.status_counts[data.status] || 0) + 1,
          },
        });
      }
    }

    const result = await updateTodo(todoId, data);
    if (result.success && result.data) {
      // Success - optimistic update already applied
      return result.data;
    } else {
      // Revert on error
      setTodos(previousTodos);
      setStats(previousStats);
      toast.error(result.error || "Failed to update task");
      return null;
    }
  }, [todos, stats]);

  const removeTodo = useCallback(async (todoId: number) => {
    const previousTodos = todos;
    const todoToRemove = todos.find((t) => t.id === todoId);
    setTodos((prev) => prev.filter((todo) => todo.id !== todoId));

    // Update stats optimistically
    if (todoToRemove) {
      setStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          total: Math.max(0, prev.total - 1),
          status_counts: {
            ...prev.status_counts,
            [todoToRemove.status]: Math.max(0, (prev.status_counts[todoToRemove.status] || 0) - 1),
          },
        };
      });
    }

    const result = await deleteTodo(todoId);
    if (result.success) {
      toast.success("Task deleted");
      return true;
    } else {
      setTodos(previousTodos);
      toast.error(result.error || "Failed to delete task");
      return false;
    }
  }, [todos]);

  const markComplete = useCallback(async (todoId: number) => {
    // Optimistic update
    const previousTodos = todos;
    const previousStats = stats;
    const todoToComplete = todos.find(t => t.id === todoId);
    
    if (todoToComplete) {
      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === todoId 
            ? { ...todo, status: "completed" as TodoStatus, status_display: "Completed" } 
            : todo
        )
      );
      
      if (stats) {
        setStats({
          ...stats,
          completed: stats.completed + 1,
          status_counts: {
            ...stats.status_counts,
            [todoToComplete.status]: Math.max(0, (stats.status_counts[todoToComplete.status] || 0) - 1),
            completed: (stats.status_counts.completed || 0) + 1,
          },
        });
      }
    }
    
    const result = await completeTodo(todoId);
    if (result.success) {
      toast.success("Task completed! 🎉");
      return true;
    } else {
      // Revert
      setTodos(previousTodos);
      setStats(previousStats);
      toast.error(result.error || "Failed to complete task");
      return false;
    }
  }, [todos, stats]);

  const markReopen = useCallback(async (todoId: number) => {
    // Optimistic update
    const previousTodos = todos;
    const previousStats = stats;
    
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId 
          ? { ...todo, status: "not_started" as TodoStatus, status_display: "Not Started" } 
          : todo
      )
    );
    
    if (stats) {
      setStats({
        ...stats,
        completed: Math.max(0, stats.completed - 1),
        status_counts: {
          ...stats.status_counts,
          completed: Math.max(0, (stats.status_counts.completed || 0) - 1),
          not_started: (stats.status_counts.not_started || 0) + 1,
        },
      });
    }
    
    const result = await reopenTodo(todoId);
    if (result.success) {
      return true;
    } else {
      // Revert
      setTodos(previousTodos);
      setStats(previousStats);
      toast.error(result.error || "Failed to reopen task");
      return false;
    }
  }, [stats]);

  const togglePin = useCallback(async (todoId: number) => {
    // Optimistic update
    const previousTodos = todos;
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId ? { ...todo, is_pinned: !todo.is_pinned } : todo
      )
    );
    
    const result = await togglePinTodo(todoId);
    if (result.success && result.data) {
      return true;
    } else {
      // Revert
      setTodos(previousTodos);
      toast.error("Failed to toggle pin");
      return false;
    }
  }, []);

  // Category operations
  const addCategory = useCallback(async (data: TodoCategoryCreateData) => {
    const result = await createCategory(data);
    if (result.success && result.data) {
      setCategories((prev) => [...prev, result.data as TodoCategorySummary]);
      toast.success("Category created");
      return result.data;
    } else {
      toast.error(result.error || "Failed to create category");
      return null;
    }
  }, []);

  const editCategory = useCallback(async (categoryId: number, data: Partial<TodoCategoryCreateData>) => {
    const result = await updateCategory(categoryId, data);
    if (result.success && result.data) {
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId ? { ...cat, ...result.data } as TodoCategorySummary : cat
        )
      );
      toast.success("Category updated");
      return result.data;
    } else {
      toast.error(result.error || "Failed to update category");
      return null;
    }
  }, []);

  const removeCategory = useCallback(async (categoryId: number) => {
    const result = await deleteCategory(categoryId);
    if (result.success) {
      setCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
      toast.success("Category deleted");
      return true;
    } else {
      toast.error(result.error || "Failed to delete category");
      return false;
    }
  }, []);

  // Stable filter shortcut callbacks
  const setStatusFilter = useCallback((status: string) => updateFilters({ status }), [updateFilters]);
  const setPriorityFilter = useCallback((priority: string) => updateFilters({ priority }), [updateFilters]);
  const setCategoryFilter = useCallback((category: string) => updateFilters({ category }), [updateFilters]);
  const setSearch = useCallback((search: string) => updateFilters({ search }), [updateFilters]);
  const setSortBy = useCallback((sort_by: string) => updateFilters({ sort_by }), [updateFilters]);
  const setSortOrder = useCallback((sort_order: "asc" | "desc") => updateFilters({ sort_order }), [updateFilters]);
  const setGroupBy = useCallback((group_by: string) => updateFilters({ group_by }), [updateFilters]);
  const clearFilters = useCallback(() => updateFilters({ status: "all", priority: "all", category: "all", search: "" }), [updateFilters]);

  return {
    // Data
    todos,
    groupedTodos,
    categories,
    stats,
    filters,
    sortOptions,
    groupOptions,
    currentFilters,
    totalCount,
    filteredCount,
    isLoading,
    error,
    // Filter/sort/group actions (calls backend)
    updateFilters,
    setStatusFilter,
    setPriorityFilter,
    setCategoryFilter,
    setSearch,
    setSortBy,
    setSortOrder,
    setGroupBy,
    clearFilters,
    // Todo actions
    createTodo: addTodo,
    updateTodo: editTodo,
    deleteTodo: removeTodo,
    completeTodo: markComplete,
    reopenTodo: markReopen,
    togglePinTodo: togglePin,
    // Category actions
    createCategory: addCategory,
    updateCategory: editCategory,
    deleteCategory: removeCategory,
    // Refresh
    refreshDashboard: fetchDashboard,
    setTodos,
  };
}
