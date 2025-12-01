"use server";

import { apiRequest } from "./api";
import {
  TodoCategory,
  TodoCategorySummary,
  TodoCategoryCreateData,
  TodoListItem,
  Todo,
  TodoCreateData,
  TodoUpdateData,
  TodoBulkUpdateData,
  TodoStats,
  TodoTimelineGroup,
  TodoChecklist,
  TodoChecklistCreateData,
  TodoTemplate,
  TemplateTimelineGroup,
  ApplyTemplateData,
  ApplyTemplateResult,
  TodoComment,
  TodoCommentCreateData,
  TodoAttachment,
  TodoStatus,
  TodoPriority,
} from "@/types";

// ======================
// CATEGORIES
// ======================

export async function getCategories(weddingId: number) {
  return apiRequest<TodoCategory[]>(
    `/todo_list/categories/?wedding=${weddingId}`
  );
}

export async function getCategorySummary(weddingId: number) {
  return apiRequest<TodoCategorySummary[]>(
    `/todo_list/categories/summary/?wedding=${weddingId}`
  );
}

export async function getCategory(categoryId: number) {
  return apiRequest<TodoCategory>(`/todo_list/categories/${categoryId}/`);
}

export async function createCategory(data: TodoCategoryCreateData) {
  return apiRequest<TodoCategory>("/todo_list/categories/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCategory(
  categoryId: number,
  data: Partial<TodoCategoryCreateData>
) {
  return apiRequest<TodoCategory>(`/todo_list/categories/${categoryId}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(categoryId: number) {
  return apiRequest<void>(`/todo_list/categories/${categoryId}/`, {
    method: "DELETE",
  });
}

export async function reorderCategories(categoryIds: number[]) {
  return apiRequest<{ status: string; count: number }>(
    "/todo_list/categories/reorder/",
    {
      method: "POST",
      body: JSON.stringify({ category_ids: categoryIds }),
    }
  );
}

// ======================
// TODOS
// ======================

export interface TodoFilters {
  status?: string;
  priority?: string;
  category?: number;
  assigned_to?: string | number;
  is_milestone?: boolean;
  is_pinned?: boolean;
  parent?: number;
  top_level?: boolean;
  due_after?: string;
  due_before?: string;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export async function getTodos(weddingId: number, filters?: TodoFilters) {
  const params = new URLSearchParams({ wedding: weddingId.toString() });

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });
  }

  return apiRequest<TodoListItem[]>(`/todo_list/todos/?${params.toString()}`);
}

export async function getTodo(todoId: number) {
  return apiRequest<Todo>(`/todo_list/todos/${todoId}/`);
}

export async function createTodo(data: TodoCreateData) {
  // The backend now returns TodoListItem format with all computed fields
  return apiRequest<TodoListItem>("/todo_list/todos/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTodo(todoId: number, data: TodoUpdateData) {
  return apiRequest<Todo>(`/todo_list/todos/${todoId}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteTodo(todoId: number) {
  return apiRequest<void>(`/todo_list/todos/${todoId}/`, {
    method: "DELETE",
  });
}

export async function completeTodo(todoId: number) {
  return apiRequest<Todo>(`/todo_list/todos/${todoId}/complete/`, {
    method: "POST",
  });
}

export async function reopenTodo(todoId: number) {
  return apiRequest<Todo>(`/todo_list/todos/${todoId}/reopen/`, {
    method: "POST",
  });
}

export async function togglePinTodo(todoId: number) {
  return apiRequest<{ id: number; is_pinned: boolean }>(
    `/todo_list/todos/${todoId}/toggle-pin/`,
    { method: "POST" }
  );
}

export async function bulkUpdateTodos(data: TodoBulkUpdateData) {
  return apiRequest<{ updated?: number; deleted?: number }>(
    "/todo_list/todos/bulk-update/",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

// Simplified bulk update for status changes (2 param version)
export async function bulkUpdateTodosSimple(
  todoIds: number[],
  updates: { status?: TodoStatus; priority?: TodoPriority; category?: number }
) {
  // For now, handle only status completion
  const results = await Promise.all(
    todoIds.map(async (id) => {
      if (updates.status === "completed") {
        return completeTodo(id);
      }
      return updateTodo(id, updates as TodoUpdateData);
    })
  );
  
  const successCount = results.filter((r: { success: boolean }) => r.success).length;
  return { success: successCount === todoIds.length, data: { updated: successCount } };
}

// ======================
// TODO STATS & VIEWS
// ======================

// Consolidated dashboard endpoint - fetches todos, categories, and stats in one request
// Filter option from backend
export interface FilterOption {
  value: string;
  label: string;
  count: number;
  color?: string;
}

export interface SortOption {
  value: string;
  label: string;
}

export interface GroupOption {
  value: string;
  label: string;
}

export interface TodoDashboardFilters {
  status: FilterOption[];
  priority: FilterOption[];
  category: FilterOption[];
}

export interface TodoGroup {
  key: string;
  label: string;
  count: number;
  color?: string;
  todos: TodoListItem[];
}

export interface CurrentFilters {
  status: string;
  priority: string;
  category: string;
  search: string;
  sort_by: string;
  sort_order: string;
  group_by: string;
}

export interface TodoDashboardData {
  todos: TodoListItem[];
  total_count: number;
  filtered_count: number;
  categories: TodoCategorySummary[];
  stats: TodoStats;
  filters: TodoDashboardFilters;
  sort_options: SortOption[];
  group_options: GroupOption[];
  current_filters: CurrentFilters;
  grouped_todos?: Record<string, TodoGroup>;
}

export interface DashboardQueryParams {
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  group_by?: string;
}

export async function getTodoDashboard(weddingId: number, params?: DashboardQueryParams) {
  let url = `/todo_list/todos/dashboard/?wedding=${weddingId}`;
  
  if (params) {
    if (params.status && params.status !== "all") url += `&status=${params.status}`;
    if (params.priority && params.priority !== "all") url += `&priority=${params.priority}`;
    if (params.category && params.category !== "all") url += `&category=${params.category}`;
    if (params.search) url += `&search=${encodeURIComponent(params.search)}`;
    if (params.sort_by) url += `&sort_by=${params.sort_by}`;
    if (params.sort_order) url += `&sort_order=${params.sort_order}`;
    if (params.group_by) url += `&group_by=${params.group_by}`;
  }
  
  return apiRequest<TodoDashboardData>(url);
}

export async function getTodoStats(weddingId: number) {
  return apiRequest<TodoStats>(
    `/todo_list/todos/stats/?wedding=${weddingId}`
  );
}

export async function getOverdueTodos(weddingId: number) {
  return apiRequest<TodoListItem[]>(
    `/todo_list/todos/overdue/?wedding=${weddingId}`
  );
}

export async function getTodayTodos(weddingId: number) {
  return apiRequest<TodoListItem[]>(
    `/todo_list/todos/today/?wedding=${weddingId}`
  );
}

export async function getUpcomingTodos(weddingId: number) {
  return apiRequest<TodoListItem[]>(
    `/todo_list/todos/upcoming/?wedding=${weddingId}`
  );
}

export async function getTodoTimeline(weddingId: number) {
  return apiRequest<TodoTimelineGroup[]>(
    `/todo_list/todos/timeline/?wedding=${weddingId}`
  );
}

// ======================
// CHECKLISTS
// ======================

export async function getChecklists(todoId: number) {
  return apiRequest<TodoChecklist[]>(
    `/todo_list/checklists/?todo=${todoId}`
  );
}

export async function createChecklist(data: TodoChecklistCreateData) {
  return apiRequest<TodoChecklist>("/todo_list/checklists/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateChecklist(
  checklistId: number,
  data: Partial<TodoChecklistCreateData & { is_completed: boolean }>
) {
  return apiRequest<TodoChecklist>(`/todo_list/checklists/${checklistId}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteChecklist(checklistId: number) {
  return apiRequest<void>(`/todo_list/checklists/${checklistId}/`, {
    method: "DELETE",
  });
}

export async function toggleChecklist(checklistId: number) {
  return apiRequest<TodoChecklist>(
    `/todo_list/checklists/${checklistId}/toggle/`,
    { method: "POST" }
  );
}

export async function bulkCreateChecklists(
  todoId: number,
  items: { title: string; order?: number }[]
) {
  return apiRequest<{ created: number; items: TodoChecklist[] }>(
    "/todo_list/checklists/bulk-create/",
    {
      method: "POST",
      body: JSON.stringify({ todo: todoId, items }),
    }
  );
}

export async function reorderChecklists(todoId: number, itemIds: number[]) {
  return apiRequest<{ reordered: boolean; items: TodoChecklist[] }>(
    "/todo_list/checklists/reorder/",
    {
      method: "POST",
      body: JSON.stringify({ todo: todoId, item_ids: itemIds }),
    }
  );
}

export async function completeAllChecklists(todoId: number) {
  return apiRequest<{ completed: number }>(
    "/todo_list/checklists/complete-all/",
    {
      method: "POST",
      body: JSON.stringify({ todo: todoId }),
    }
  );
}

export async function clearCompletedChecklists(todoId: number) {
  return apiRequest<{ deleted: number }>(
    "/todo_list/checklists/clear-completed/",
    {
      method: "POST",
      body: JSON.stringify({ todo: todoId }),
    }
  );
}

// ======================
// TEMPLATES
// ======================

export async function getTemplates(weddingId?: number) {
  const params = weddingId ? `?wedding=${weddingId}` : "";
  return apiRequest<TodoTemplate[]>(`/todo_list/templates/${params}`);
}

export async function getTemplatesByTimeline(weddingId?: number) {
  const params = weddingId ? `?wedding=${weddingId}` : "";
  return apiRequest<TemplateTimelineGroup[]>(
    `/todo_list/templates/by-timeline/${params}`
  );
}

export async function applyTemplates(data: ApplyTemplateData) {
  return apiRequest<ApplyTemplateResult>("/todo_list/templates/apply/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function loadDefaultTemplates(weddingId?: number, overwrite = false) {
  return apiRequest<{ created: number; templates: TodoTemplate[] }>(
    "/todo_list/templates/load-defaults/",
    {
      method: "POST",
      body: JSON.stringify({ wedding: weddingId, overwrite }),
    }
  );
}

// ======================
// COMMENTS
// ======================

export async function getComments(todoId: number) {
  return apiRequest<TodoComment[]>(`/todo_list/comments/?todo=${todoId}`);
}

export async function createComment(data: TodoCommentCreateData) {
  return apiRequest<TodoComment>("/todo_list/comments/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateComment(commentId: number, content: string) {
  return apiRequest<TodoComment>(`/todo_list/comments/${commentId}/`, {
    method: "PATCH",
    body: JSON.stringify({ content }),
  });
}

export async function deleteComment(commentId: number) {
  return apiRequest<void>(`/todo_list/comments/${commentId}/`, {
    method: "DELETE",
  });
}

// ======================
// ATTACHMENTS
// ======================

export async function getAttachments(todoId: number) {
  return apiRequest<TodoAttachment[]>(
    `/todo_list/attachments/?todo=${todoId}`
  );
}

export async function deleteAttachment(attachmentId: number) {
  return apiRequest<void>(`/todo_list/attachments/${attachmentId}/`, {
    method: "DELETE",
  });
}

// Note: File uploads need special handling with FormData
// This should be called from a client component
export async function uploadAttachment(
  todoId: number,
  file: File,
  attachmentType?: string,
  description?: string
): Promise<{ success: boolean; data?: TodoAttachment; error?: string }> {
  try {
    const formData = new FormData();
    formData.append("todo", todoId.toString());
    formData.append("file", file);
    if (attachmentType) {
      formData.append("attachment_type", attachmentType);
    }
    if (description) {
      formData.append("description", description);
    }

    // This needs to be handled by a client-side fetch
    // Server actions can't handle FormData directly for file uploads
    return { success: false, error: "Use client-side upload" };
  } catch (error) {
    return { success: false, error: "Upload failed" };
  }
}
