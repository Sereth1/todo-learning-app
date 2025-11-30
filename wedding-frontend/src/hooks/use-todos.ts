"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getTodos,
  getTodoStats,
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
  Todo,
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

// ======================
// TODOS HOOK
// ======================

export function useTodos(weddingId: number | null, filters?: TodoFilters) {
  const [todos, setTodos] = useState<TodoListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, [weddingId, JSON.stringify(filters)]);

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
