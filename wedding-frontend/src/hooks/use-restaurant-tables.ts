"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  getRestaurantTables,
  createRestaurantTable,
  updateRestaurantTable,
  deleteRestaurantTable,
} from "@/actions/restaurant";
import type { RestaurantTable, RestaurantTableCreateData } from "@/types";

const DEFAULT_FORM_DATA: RestaurantTableCreateData = {
  name: "",
  capacity: 10,
  location: "",
  notes: "",
  is_vip: false,
};

export function useRestaurantTables(accessCode: string) {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [formData, setFormData] = useState<RestaurantTableCreateData>(DEFAULT_FORM_DATA);

  const loadTables = useCallback(async () => {
    setIsLoading(true);
    const result = await getRestaurantTables(accessCode);
    if (result.success && result.data) {
      setTables(result.data);
    } else {
      toast.error(result.error || "Failed to load tables");
    }
    setIsLoading(false);
  }, [accessCode]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  const resetForm = useCallback(() => {
    setFormData(DEFAULT_FORM_DATA);
    setEditingTable(null);
  }, []);

  const openDialog = useCallback((table?: RestaurantTable) => {
    if (table) {
      setEditingTable(table);
      setFormData({
        table_number: table.table_number,
        name: table.name,
        capacity: table.capacity,
        location: table.location || "",
        notes: table.notes || "",
        is_vip: table.is_vip,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  }, [resetForm]);

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    resetForm();
  }, [resetForm]);

  const handleDialogChange = useCallback((open: boolean) => {
    setIsDialogOpen(open);
    if (!open) resetForm();
  }, [resetForm]);

  const updateFormField = useCallback(<K extends keyof RestaurantTableCreateData>(
    field: K,
    value: RestaurantTableCreateData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (editingTable) {
        const result = await updateRestaurantTable(accessCode, editingTable.id, formData);
        if (result.success) {
          toast.success("Table updated");
          await loadTables();
          closeDialog();
        } else {
          toast.error(result.error || "Failed to update table");
        }
      } else {
        const result = await createRestaurantTable(accessCode, formData);
        if (result.success) {
          toast.success("Table created");
          await loadTables();
          closeDialog();
        } else {
          toast.error(result.error || "Failed to create table");
        }
      }
    } finally {
      setIsSaving(false);
    }
  }, [accessCode, editingTable, formData, loadTables, closeDialog]);

  const handleDelete = useCallback(async (table: RestaurantTable) => {
    const tableName = table.name ? ` (${table.name})` : "";
    if (!confirm(`Delete Table ${table.table_number}${tableName}?`)) {
      return;
    }

    const result = await deleteRestaurantTable(accessCode, table.id);
    if (result.success) {
      toast.success("Table deleted");
      await loadTables();
    } else {
      toast.error(result.error || "Failed to delete table");
    }
  }, [accessCode, loadTables]);

  return {
    // State
    tables,
    isLoading,
    isSaving,
    isDialogOpen,
    editingTable,
    formData,
    
    // Actions
    loadTables,
    openDialog,
    closeDialog,
    handleDialogChange,
    updateFormField,
    handleSubmit,
    handleDelete,
  };
}
