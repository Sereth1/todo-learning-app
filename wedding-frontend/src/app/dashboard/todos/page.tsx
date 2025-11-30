"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Calendar,
  ChevronDown,
  Clock,
  Folder,
  KanbanSquare,
  LayoutList,
  Loader2,
  Plus,
  RefreshCw,
  Settings,
  Wand2,
} from "lucide-react";
import {
  TodoStats,
  KanbanBoard,
  CalendarView,
  TimelineView,
  ListView,
  TodoFormDialog,
  TodoDetailSheet,
  CategoryManager,
  TemplatesDialog,
} from "@/components/todos";
import { useTodos, useTodoStats, useCategories } from "@/hooks/use-todos";
import { useWedding } from "@/contexts/wedding-context";
import {
  Todo,
  TodoListItem,
  TodoCreateData,
  TodoUpdateData,
  TodoStatus,
  TodoCategoryCreateData,
  TodoCategoryUpdateData,
} from "@/types";
import { completeTodo, bulkUpdateTodosSimple, getTodo } from "@/actions/todos";
import { toast } from "sonner";

type ViewMode = "kanban" | "list" | "calendar" | "timeline";

export default function TodosPage() {
  const { selectedWedding, isLoading: weddingLoading } = useWedding();
  const weddingId = selectedWedding?.id || null;

  const {
    todos,
    isLoading: todosLoading,
    createTodo,
    updateTodo,
    deleteTodo,
    refreshTodos,
  } = useTodos(weddingId);

  const { stats, isLoading: statsLoading, refreshStats } = useTodoStats(weddingId);

  const {
    categories,
    isLoading: categoriesLoading,
    addCategory,
    editCategory,
    removeCategory,
    refreshCategories,
  } = useCategories(weddingId);

  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState<Todo | TodoListItem | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TodoStatus | undefined>();
  const [defaultDate, setDefaultDate] = useState<Date | undefined>();

  const isLoading = weddingLoading || todosLoading || categoriesLoading;

  // Refresh all data
  const handleRefresh = useCallback(() => {
    refreshTodos();
    refreshStats();
    refreshCategories();
  }, [refreshTodos, refreshStats, refreshCategories]);

  // Handle creating a todo
  const handleCreate = async (data: TodoCreateData | TodoUpdateData) => {
    const success = await createTodo(data as TodoCreateData);
    if (success) {
      toast.success("Task created");
      refreshStats();
    }
  };

  // Handle updating a todo
  const handleUpdate = async (data: TodoCreateData | TodoUpdateData) => {
    if (!selectedTodo) return;
    const success = await updateTodo(selectedTodo.id, data as TodoUpdateData);
    if (success) {
      toast.success("Task updated");
      refreshStats();
    }
  };

  // Handle deleting a todo
  const handleDelete = async () => {
    if (!todoToDelete) return;
    const success = await deleteTodo(todoToDelete.id);
    if (success) {
      toast.success("Task deleted");
      refreshStats();
    }
    setDeleteDialogOpen(false);
    setTodoToDelete(null);
  };

  // Handle completing a todo
  const handleComplete = async (todo: Todo | TodoListItem) => {
    const result = await completeTodo(todo.id);
    if (result.success) {
      toast.success("Task completed! 🎉");
      refreshTodos();
      refreshStats();
    } else {
      toast.error(result.error || "Failed to complete task");
    }
  };

  // Handle drag-and-drop status change
  const handleStatusChange = async (todoId: number, newStatus: TodoStatus) => {
    const success = await updateTodo(todoId, { status: newStatus });
    if (success) {
      refreshStats();
    }
  };

  // Handle bulk update
  const handleBulkUpdate = async (todoIds: number[], updates: Partial<Todo>) => {
    const result = await bulkUpdateTodosSimple(todoIds, updates);
    if (result.success) {
      toast.success(`Updated ${todoIds.length} tasks`);
      refreshTodos();
      refreshStats();
    } else {
      toast.error("Failed to update tasks");
    }
  };

  // Handle category creation
  const handleCreateCategory = async (data: TodoCategoryCreateData): Promise<boolean> => {
    const result = await addCategory(data);
    return result !== null;
  };

  // Handle category update
  const handleUpdateCategory = async (
    id: number,
    data: TodoCategoryUpdateData
  ): Promise<boolean> => {
    const result = await editCategory(id, data);
    return result !== null;
  };

  // Handle category deletion
  const handleDeleteCategory = async (id: number): Promise<boolean> => {
    return await removeCategory(id);
  };

  // Open add dialog with defaults
  const openAddDialog = (status?: TodoStatus, date?: Date) => {
    setDefaultStatus(status);
    setDefaultDate(date);
    setIsAddDialogOpen(true);
  };

  // Todo click handlers
  const handleTodoClick = async (todo: Todo | TodoListItem) => {
    // Fetch full todo details
    const result = await getTodo(todo.id);
    if (result.success && result.data) {
      setSelectedTodo(result.data);
      setIsDetailSheetOpen(true);
    } else {
      toast.error("Failed to load task details");
    }
  };

  const handleEditClick = async (todo: Todo | TodoListItem) => {
    // Fetch full todo details
    const result = await getTodo(todo.id);
    if (result.success && result.data) {
      setSelectedTodo(result.data);
      setIsEditDialogOpen(true);
    } else {
      toast.error("Failed to load task details");
    }
  };

  const handleDeleteClick = (todo: Todo | TodoListItem) => {
    setTodoToDelete(todo);
    setDeleteDialogOpen(true);
  };

  // Don't render until wedding is loaded
  if (weddingLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!weddingId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Wedding Selected</h2>
        <p className="text-muted-foreground">
          Please select or create a wedding to manage your tasks.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Wedding Tasks</h1>
          <p className="text-muted-foreground">
            Manage your wedding planning checklist and stay organized
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Options
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsCategoryManagerOpen(true)}>
                <Folder className="h-4 w-4 mr-2" />
                Manage Categories
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsTemplatesOpen(true)}>
                <Wand2 className="h-4 w-4 mr-2" />
                Apply Templates
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => openAddDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Stats */}
      {!statsLoading && stats && <TodoStats stats={stats} />}

      {/* View Mode Tabs */}
      <Tabs
        value={viewMode}
        onValueChange={(v) => setViewMode(v as ViewMode)}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="kanban" className="gap-2">
              <KanbanSquare className="h-4 w-4" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <LayoutList className="h-4 w-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <Clock className="h-4 w-4" />
              Timeline
            </TabsTrigger>
          </TabsList>

          {/* Quick stats */}
          <div className="hidden md:flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              {todos.length} total tasks
            </span>
            {stats && stats.overdue > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {stats.overdue} overdue
              </Badge>
            )}
          </div>
        </div>

        {/* Kanban View */}
        <TabsContent value="kanban" className="mt-0">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <KanbanBoard
              todos={todos}
              onTodoClick={handleTodoClick}
              onStatusChange={handleStatusChange}
              onAddTodo={(status) => openAddDialog(status)}
            />
          )}
        </TabsContent>

        {/* List View */}
        <TabsContent value="list" className="mt-0">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ListView
              todos={todos}
              categories={categories}
              onTodoClick={handleTodoClick}
              onEdit={handleEditClick}
              onComplete={handleComplete}
              onDelete={handleDeleteClick}
              onBulkUpdate={handleBulkUpdate}
            />
          )}
        </TabsContent>

        {/* Calendar View */}
        <TabsContent value="calendar" className="mt-0">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <CalendarView
              todos={todos}
              onTodoClick={handleTodoClick}
              onDateClick={(date) => openAddDialog(undefined, date)}
            />
          )}
        </TabsContent>

        {/* Timeline View */}
        <TabsContent value="timeline" className="mt-0">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <TimelineView
              todos={todos}
              onTodoClick={handleTodoClick}
              onComplete={(id) => {
                const todo = todos.find(t => t.id === id);
                if (todo) handleComplete(todo);
              }}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Add Todo Dialog */}
      <TodoFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        categories={categories}
        weddingId={weddingId}
        onSave={handleCreate}
        defaultStatus={defaultStatus}
        defaultDate={defaultDate}
      />

      {/* Edit Todo Dialog */}
      <TodoFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        todo={selectedTodo}
        categories={categories}
        weddingId={weddingId}
        onSave={handleUpdate}
      />

      {/* Todo Detail Sheet */}
      <TodoDetailSheet
        open={isDetailSheetOpen}
        onOpenChange={setIsDetailSheetOpen}
        todo={selectedTodo}
        categories={categories}
        onEdit={handleEditClick}
        onComplete={handleComplete}
        onDelete={handleDeleteClick}
        onUpdate={handleRefresh}
      />

      {/* Category Manager */}
      <CategoryManager
        open={isCategoryManagerOpen}
        onOpenChange={setIsCategoryManagerOpen}
        categories={categories}
        weddingId={weddingId}
        onCreate={handleCreateCategory}
        onUpdate={handleUpdateCategory}
        onDelete={handleDeleteCategory}
      />

      {/* Templates Dialog */}
      <TemplatesDialog
        open={isTemplatesOpen}
        onOpenChange={setIsTemplatesOpen}
        weddingId={weddingId}
        onTemplatesApplied={handleRefresh}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{todoToDelete?.title}&quot;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
