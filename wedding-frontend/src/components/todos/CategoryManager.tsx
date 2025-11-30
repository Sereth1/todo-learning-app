"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Folder,
  MoreHorizontal,
  Pencil,
  Trash2,
  Palette,
} from "lucide-react";
import { TodoCategorySummary, TodoCategoryCreateData, TodoCategoryUpdateData } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CategoryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: TodoCategorySummary[];
  weddingId: number;
  onCreate: (data: TodoCategoryCreateData) => Promise<boolean>;
  onUpdate: (id: number, data: TodoCategoryUpdateData) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
}

const defaultColors = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#f43f5e", // rose
  "#78716c", // stone
  "#64748b", // slate
  "#1e293b", // dark
];

const defaultIcons = [
  "📋", "📅", "🎯", "💍", "🎂", "🎵", "📸", "🌸",
  "✨", "💐", "👗", "🍽️", "🏛️", "🚗", "💌", "🎁",
  "💄", "👠", "🎪", "🎨", "📝", "💰", "🎭", "🎤",
];

export function CategoryManager({
  open,
  onOpenChange,
  categories,
  weddingId,
  onCreate,
  onUpdate,
  onDelete,
}: CategoryManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TodoCategorySummary | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<TodoCategorySummary | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [color, setColor] = useState(defaultColors[0]);
  const [icon, setIcon] = useState(defaultIcons[0]);
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setName("");
    setColor(defaultColors[0]);
    setIcon(defaultIcons[0]);
    setDescription("");
    setEditingCategory(null);
    setIsEditing(false);
  };

  const handleEdit = (category: TodoCategorySummary) => {
    setEditingCategory(category);
    setName(category.name);
    setColor(category.color);
    setIcon(category.icon || defaultIcons[0]);
    setDescription(category.description || "");
    setIsEditing(true);
  };

  const handleDeleteClick = (category: TodoCategorySummary) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    setIsLoading(true);
    try {
      const success = await onDelete(categoryToDelete.id);
      if (success) {
        toast.success("Category deleted");
      }
    } finally {
      setIsLoading(false);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    setIsLoading(true);

    try {
      if (editingCategory) {
        const success = await onUpdate(editingCategory.id, {
          name: name.trim(),
          color,
          icon,
          description: description.trim() || undefined,
        });
        if (success) {
          toast.success("Category updated");
          resetForm();
        }
      } else {
        const success = await onCreate({
          wedding: weddingId,
          name: name.trim(),
          color,
          icon,
          description: description.trim() || undefined,
          order: categories.length,
        });
        if (success) {
          toast.success("Category created");
          resetForm();
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Manage Categories
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Categories List */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">
                Your Categories ({categories.length})
              </h3>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border hover:shadow-sm transition-all",
                        editingCategory?.id === category.id && "ring-2 ring-blue-500"
                      )}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                        style={{ backgroundColor: category.color + "20" }}
                      >
                        {category.icon || "📋"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{category.name}</span>
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: category.color }}
                          />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{category.todo_count} tasks</span>
                          {category.description && (
                            <>
                              <span>•</span>
                              <span className="truncate">{category.description}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(category)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteClick(category)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}

                  {categories.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">No categories yet</p>
                      <p className="text-xs mt-1">Create your first category to organize tasks</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Add/Edit Form */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-muted-foreground">
                {isEditing ? "Edit Category" : "Add New Category"}
              </h3>

              <div className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="cat-name">Name *</Label>
                  <Input
                    id="cat-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Venue, Catering, Photography"
                  />
                </div>

                {/* Icon */}
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <div className="grid grid-cols-8 gap-2 p-2 border rounded-lg max-h-32 overflow-y-auto">
                    {defaultIcons.map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        className={cn(
                          "w-8 h-8 flex items-center justify-center rounded-lg text-lg hover:bg-gray-100 transition-colors",
                          icon === ic && "ring-2 ring-blue-500 bg-blue-50"
                        )}
                        onClick={() => setIcon(ic)}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Color
                  </Label>
                  <div className="grid grid-cols-10 gap-2">
                    {defaultColors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={cn(
                          "w-6 h-6 rounded-full transition-transform hover:scale-110",
                          color === c && "ring-2 ring-offset-2 ring-gray-400"
                        )}
                        style={{ backgroundColor: c }}
                        onClick={() => setColor(c)}
                      />
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="cat-desc">Description (optional)</Label>
                  <Input
                    id="cat-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this category"
                  />
                </div>

                {/* Preview */}
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{ backgroundColor: color + "20" }}
                    >
                      {icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{name || "Category Name"}</span>
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      </div>
                      {description && (
                        <span className="text-xs text-muted-foreground">
                          {description}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {isEditing && (
                    <Button variant="outline" onClick={resetForm} disabled={isLoading}>
                      Cancel
                    </Button>
                  )}
                  <Button
                    onClick={handleSubmit}
                    disabled={!name.trim() || isLoading}
                    className="flex-1"
                  >
                    {isLoading
                      ? "Saving..."
                      : isEditing
                      ? "Update Category"
                      : "Add Category"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{categoryToDelete?.name}&quot;?
              {categoryToDelete && (categoryToDelete.todo_count ?? 0) > 0 && (
                <span className="block mt-2 text-amber-600">
                  This category has {categoryToDelete.todo_count} task
                  {(categoryToDelete.todo_count ?? 0) !== 1 ? "s" : ""}. The tasks will be
                  uncategorized.
                </span>
              )}
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
    </>
  );
}

export default CategoryManager;
