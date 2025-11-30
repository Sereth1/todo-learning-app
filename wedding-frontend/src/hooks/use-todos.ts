"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getTodos,
  getTodoStats,
  getTodoDashboard,
  getCategories,
  getCategorySummary,
  createTodo,
  updateTodo,
  deleteTodo,
  completeTodo,
  reopenTodo,
  togglePinTodo,
  bulkUpdateTodos,
  createCategory,
  updateCategory,
  deleteCategory,
  TodoFilters,
} from "@/actions/todos";
import {
  TodoListItem,
  TodoCreateData,
  TodoUpdateData,
  TodoStats,
  TodoCategory,
  TodoCategorySummary,
  TodoCategoryCreateData,
  TodoBulkUpdateData,
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
 * Consolidated hook that fetches todos, categories, and stats in a single request.
 * This reduces API calls from 3+ to just 1.
 */
export function useTodoDashboard(weddingId: number | null) {
  const [todos, setTodos] = useState<TodoListItem[]>([]);
  const [categories, setCategories] = useState<TodoCategorySummary[]>([]);
  const [stats, setStats] = useState<TodoStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!weddingId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await getTodoDashboard(weddingId);

    if (result.success && result.data) {
      setTodos(result.data.todos);
      setCategories(result.data.categories);
      setStats(result.data.stats);
    } else {
      setError(result.error || "Failed to fetch dashboard data");
    }

    setIsLoading(false);
  }, [weddingId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // CRUD Operations with optimistic updates
  const addTodo = async (data: TodoCreateData) => {
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
  };

  const editTodo = async (todoId: number, data: TodoUpdateData) => {
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
  };

  const removeTodo = async (todoId: number) => {
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
  };

  const markComplete = async (todoId: number) => {
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
  };

  const markReopen = async (todoId: number) => {
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
  };

  const togglePin = async (todoId: number) => {
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
  };

  // Category operations
  const addCategory = async (data: TodoCategoryCreateData) => {
    const result = await createCategory(data);
    if (result.success && result.data) {
      setCategories((prev) => [...prev, result.data as TodoCategorySummary]);
      toast.success("Category created");
      return result.data;
    } else {
      toast.error(result.error || "Failed to create category");
      return null;
    }
  };

  const editCategory = async (categoryId: number, data: Partial<TodoCategoryCreateData>) => {
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
  };

  const removeCategory = async (categoryId: number) => {
    const result = await deleteCategory(categoryId);
    if (result.success) {
      setCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
      toast.success("Category deleted");
      return true;
    } else {
      toast.error(result.error || "Failed to delete category");
      return false;
    }
  };

  return {
    // Data
    todos,
    categories,
    stats,
    isLoading,
    error,
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

// ======================
// TODOS HOOK (Legacy - for filtered views)
// ======================

export function useTodos(weddingId: number | null, filters?: TodoFilters) {
  const [todos, setTodos] = useState<TodoListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stringify filters once for dependency tracking
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  const fetchTodos = useCallback(async () => {
    if (!weddingId) return;

    setIsLoading(true);
    setError(null);

    const result = await getTodos(weddingId, filters);

    if (result.success && result.data) {
      setTodos(result.data);
    } else {
      setError(result.error || "Failed to fetch todos");
    }

    setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weddingId, filtersKey]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const addTodo = async (data: TodoCreateData) => {
    const result = await createTodo(data);
    if (result.success && result.data) {
      // Optimistic update - add to list
      setTodos((prev) => [result.data as TodoListItem, ...prev]);
      toast.success("Todo created");
      return result.data;
    } else {
      toast.error(result.error || "Failed to create todo");
      return null;
    }
  };

  const editTodo = async (todoId: number, data: TodoUpdateData) => {
    // Optimistic update
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId ? { ...todo, ...data } as TodoListItem : todo
      )
    );

    const result = await updateTodo(todoId, data);
    if (result.success && result.data) {
      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === todoId ? (result.data as TodoListItem) : todo
        )
      );
      return result.data;
    } else {
      // Revert on error
      fetchTodos();
      toast.error(result.error || "Failed to update todo");
      return null;
    }
  };

  const removeTodo = async (todoId: number) => {
    // Optimistic update
    const previousTodos = todos;
    setTodos((prev) => prev.filter((todo) => todo.id !== todoId));

    const result = await deleteTodo(todoId);
    if (result.success) {
      toast.success("Todo deleted");
      return true;
    } else {
      // Revert on error
      setTodos(previousTodos);
      toast.error(result.error || "Failed to delete todo");
      return false;
    }
  };

  const complete = async (todoId: number) => {
    // Optimistic update
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId
          ? { ...todo, status: "completed" as TodoStatus, progress_percent: 100 }
          : todo
      )
    );

    const result = await completeTodo(todoId);
    if (result.success && result.data) {
      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === todoId ? (result.data as TodoListItem) : todo
        )
      );
      toast.success("Todo completed! 🎉");
      return result.data;
    } else {
      fetchTodos();
      toast.error(result.error || "Failed to complete todo");
      return null;
    }
  };

  const reopen = async (todoId: number) => {
    const result = await reopenTodo(todoId);
    if (result.success && result.data) {
      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === todoId ? (result.data as TodoListItem) : todo
        )
      );
      toast.success("Todo reopened");
      return result.data;
    } else {
      toast.error(result.error || "Failed to reopen todo");
      return null;
    }
  };

  const togglePin = async (todoId: number) => {
    const result = await togglePinTodo(todoId);
    if (result.success && result.data) {
      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === todoId ? { ...todo, is_pinned: result.data!.is_pinned } : todo
        )
      );
      return result.data;
    } else {
      toast.error(result.error || "Failed to toggle pin");
      return null;
    }
  };

  const bulkUpdate = async (data: Omit<TodoBulkUpdateData, "wedding">) => {
    if (!weddingId) return null;

    const result = await bulkUpdateTodos({ ...data, wedding: weddingId });
    if (result.success) {
      fetchTodos(); // Refresh after bulk update
      const count = result.data?.updated || result.data?.deleted || 0;
      toast.success(`${count} todo(s) updated`);
      return result.data;
    } else {
      toast.error(result.error || "Bulk update failed");
      return null;
    }
  };

  // Move todo (for drag and drop status change)
  const moveTodo = async (todoId: number, newStatus: TodoStatus) => {
    return editTodo(todoId, { status: newStatus });
  };

  // Group todos by status for Kanban
  const todosByStatus = useMemo(() => {
    const grouped: Record<TodoStatus, TodoListItem[]> = {
      not_started: [],
      in_progress: [],
      waiting: [],
      completed: [],
      cancelled: [],
    };

    todos.forEach((todo) => {
      if (grouped[todo.status]) {
        grouped[todo.status].push(todo);
      }
    });

    return grouped;
  }, [todos]);

  // Group todos by category
  const todosByCategory = useMemo(() => {
    const grouped: Record<number | "uncategorized", TodoListItem[]> = {
      uncategorized: [],
    };

    todos.forEach((todo) => {
      const key = todo.category || "uncategorized";
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(todo);
    });

    return grouped;
  }, [todos]);

  return {
    todos,
    isLoading,
    error,
    refetch: fetchTodos,
    refreshTodos: fetchTodos,
    addTodo,
    editTodo,
    removeTodo,
    createTodo: addTodo,
    updateTodo: editTodo,
    deleteTodo: removeTodo,
    complete,
    reopen,
    togglePin,
    bulkUpdate,
    moveTodo,
    todosByStatus,
    todosByCategory,
    setTodos,
  };
}

// ======================
// TODO STATS HOOK
// ======================

export function useTodoStats(weddingId: number | null) {
  const [stats, setStats] = useState<TodoStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!weddingId) return;

    setIsLoading(true);
    const result = await getTodoStats(weddingId);

    if (result.success && result.data) {
      setStats(result.data);
    }

    setIsLoading(false);
  }, [weddingId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, isLoading, refetch: fetchStats, refreshStats: fetchStats };
}

// ======================
// CATEGORIES HOOK
// ======================

export function useCategories(weddingId: number | null) {
  const [categories, setCategories] = useState<TodoCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    if (!weddingId) return;

    setIsLoading(true);
    const result = await getCategories(weddingId);

    if (result.success && result.data) {
      setCategories(result.data);
    }

    setIsLoading(false);
  }, [weddingId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = async (data: Omit<TodoCategoryCreateData, "wedding">) => {
    if (!weddingId) return null;

    const result = await createCategory({ ...data, wedding: weddingId });
    if (result.success && result.data) {
      setCategories((prev) => [...prev, result.data!]);
      toast.success("Category created");
      return result.data;
    } else {
      toast.error(result.error || "Failed to create category");
      return null;
    }
  };

  const editCategory = async (
    categoryId: number,
    data: Partial<TodoCategoryCreateData>
  ) => {
    const result = await updateCategory(categoryId, data);
    if (result.success && result.data) {
      setCategories((prev) =>
        prev.map((cat) => (cat.id === categoryId ? result.data! : cat))
      );
      toast.success("Category updated");
      return result.data;
    } else {
      toast.error(result.error || "Failed to update category");
      return null;
    }
  };

  const removeCategory = async (categoryId: number) => {
    const result = await deleteCategory(categoryId);
    if (result.success) {
      setCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
      toast.success("Category deleted");
      return true;
    } else {
      toast.error(result.error || "Failed to delete category");
      return false;
    }
  };

  return {
    categories,
    isLoading,
    refetch: fetchCategories,
    refreshCategories: fetchCategories,
    addCategory,
    editCategory,
    removeCategory,
    createCategory: addCategory,
    updateCategory: editCategory,
    deleteCategory: removeCategory,
  };
}

// ======================
// CATEGORY SUMMARY HOOK
// ======================

export function useCategorySummary(weddingId: number | null) {
  const [categories, setCategories] = useState<TodoCategorySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      if (!weddingId) return;

      setIsLoading(true);
      const result = await getCategorySummary(weddingId);

      if (result.success && result.data) {
        setCategories(result.data);
      }

      setIsLoading(false);
    }

    fetch();
  }, [weddingId]);

  return { categories, isLoading };
}
