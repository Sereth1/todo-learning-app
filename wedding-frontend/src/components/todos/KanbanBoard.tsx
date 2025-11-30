"use client";

import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TodoCard } from "./TodoCard";
import { TodoListItem, TodoStatus } from "@/types";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KanbanBoardProps {
  todos: TodoListItem[];
  onTodoClick: (todo: TodoListItem) => void;
  onStatusChange: (todoId: number, newStatus: TodoStatus) => Promise<unknown>;
  onAddTodo?: (status: TodoStatus) => void;
}

interface ColumnConfig {
  id: TodoStatus;
  title: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const columns: ColumnConfig[] = [
  {
    id: "not_started",
    title: "To Do",
    color: "text-slate-700",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
  },
  {
    id: "in_progress",
    title: "In Progress",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  {
    id: "waiting",
    title: "Waiting",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  {
    id: "completed",
    title: "Done",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
];

// Sortable Todo Item
function SortableTodoCard({
  todo,
  onClick,
}: {
  todo: TodoListItem;
  onClick: (todo: TodoListItem) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: todo.id,
    data: { type: "todo", todo },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TodoCard
        todo={todo}
        isDragging={isDragging}
        dragHandleProps={listeners}
        compact
        onClick={onClick}
      />
    </div>
  );
}

// Kanban Column
function KanbanColumn({
  column,
  todos,
  onAddTodo,
  children,
}: {
  column: ColumnConfig;
  todos: TodoListItem[];
  onAddTodo?: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        "flex flex-col h-full min-w-[300px] max-w-[350px]",
        column.bgColor,
        column.borderColor
      )}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className={cn("text-sm font-semibold", column.color)}>
              {column.title}
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {todos.length}
            </Badge>
          </div>
          {onAddTodo && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onAddTodo}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-2 overflow-hidden">
        <div className="h-full overflow-y-auto space-y-2 pr-1">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

export function KanbanBoard({
  todos,
  onTodoClick,
  onStatusChange,
  onAddTodo,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [overId, setOverId] = useState<TodoStatus | null>(null);

  // Group todos by status
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeTodo = activeId
    ? todos.find((t) => t.id === activeId)
    : null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    if (!over) {
      setOverId(null);
      return;
    }

    // Check if over a column or a todo
    const overId = over.id;
    if (columns.some((c) => c.id === overId)) {
      setOverId(overId as TodoStatus);
    } else {
      // Find which column the todo belongs to
      for (const [status, statusTodos] of Object.entries(todosByStatus)) {
        if (statusTodos.some((t) => t.id === overId)) {
          setOverId(status as TodoStatus);
          break;
        }
      }
    }
  }, [todosByStatus]);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveId(null);
      setOverId(null);

      if (!over) return;

      const activeId = active.id as number;
      const activeTodo = todos.find((t) => t.id === activeId);

      if (!activeTodo) return;

      // Determine target column
      let targetStatus: TodoStatus | null = null;

      if (columns.some((c) => c.id === over.id)) {
        targetStatus = over.id as TodoStatus;
      } else {
        // Find which column the drop target belongs to
        for (const [status, statusTodos] of Object.entries(todosByStatus)) {
          if (statusTodos.some((t) => t.id === over.id)) {
            targetStatus = status as TodoStatus;
            break;
          }
        }
      }

      if (targetStatus && targetStatus !== activeTodo.status) {
        await onStatusChange(activeId, targetStatus);
      }
    },
    [todos, todosByStatus, onStatusChange]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 h-[calc(100vh-280px)] overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnTodos = todosByStatus[column.id] || [];
          const isOver = overId === column.id;

          return (
            <div
              key={column.id}
              className={cn(
                "transition-all",
                isOver && "ring-2 ring-primary ring-offset-2 rounded-lg"
              )}
            >
              <SortableContext
                id={column.id}
                items={columnTodos.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <KanbanColumn
                  column={column}
                  todos={columnTodos}
                  onAddTodo={onAddTodo ? () => onAddTodo(column.id) : undefined}
                >
                  {columnTodos.length === 0 ? (
                    <div className="flex items-center justify-center h-24 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                      No tasks
                    </div>
                  ) : (
                    columnTodos.map((todo) => (
                      <SortableTodoCard
                        key={todo.id}
                        todo={todo}
                        onClick={onTodoClick}
                      />
                    ))
                  )}
                </KanbanColumn>
              </SortableContext>
            </div>
          );
        })}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTodo ? (
          <div className="opacity-80">
            <TodoCard
              todo={activeTodo}
              isDragging
              compact
              onClick={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default KanbanBoard;
