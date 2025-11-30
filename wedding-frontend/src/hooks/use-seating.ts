import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getTables, getGuests, createTable, deleteTable, assignSeat, unassignSeat } from "@/actions/wedding";
import { toast } from "sonner";
import type { Table, Guest } from "@/types";

export interface TableFormData {
  name: string;
  capacity: string;
  table_number: string;
  description: string;
}

const initialFormData: TableFormData = {
  name: "",
  capacity: "8",
  table_number: "",
  description: "",
};

export function useSeating() {
  const { wedding } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<TableFormData>(initialFormData);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState<{ open: boolean; table: Table | null }>({
    open: false,
    table: null,
  });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; table: Table | null }>({
    open: false,
    table: null,
  });

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!wedding) return;
      setIsLoading(true);
      const [tablesData, guestsData] = await Promise.all([
        getTables(),
        getGuests(),
      ]);
      setTables(tablesData);
      setGuests(guestsData);
      setIsLoading(false);
    };
    loadData();
  }, [wedding]);

  // Form handlers
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
  }, []);

  // CRUD operations
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.capacity) {
      toast.error("Please fill in required fields");
      return;
    }

    const result = await createTable({
      name: formData.name,
      capacity: parseInt(formData.capacity),
      table_number: formData.table_number ? parseInt(formData.table_number) : undefined,
      description: formData.description || undefined,
    });

    if (result.success && result.table) {
      setTables(prev => [...prev, result.table!]);
      toast.success("Table created successfully!");
      setShowAddDialog(false);
      resetForm();
    } else {
      toast.error(result.error || "Failed to create table");
    }
  }, [formData, resetForm]);

  const handleDelete = useCallback(async () => {
    if (!deleteModal.table) return;
    
    const result = await deleteTable(deleteModal.table.id);
    if (result.success) {
      setTables(prev => prev.filter(t => t.id !== deleteModal.table!.id));
      toast.success("Table deleted successfully");
    } else {
      toast.error(result.error || "Failed to delete table");
    }
    setDeleteModal({ open: false, table: null });
  }, [deleteModal.table]);

  const handleAssignGuest = useCallback(async (guestId: number) => {
    if (!assignDialog.table) return;
    
    const result = await assignSeat(guestId, assignDialog.table.id);
    if (result.success) {
      // Refresh data
      const [tablesData, guestsData] = await Promise.all([
        getTables(),
        getGuests(),
      ]);
      setTables(tablesData);
      setGuests(guestsData);
      toast.success("Guest assigned to table!");
    } else {
      toast.error(result.error || "Failed to assign guest");
    }
  }, [assignDialog.table]);

  const handleUnassignGuest = useCallback(async (guestId: number) => {
    const result = await unassignSeat(guestId);
    if (result.success) {
      // Refresh data
      const [tablesData, guestsData] = await Promise.all([
        getTables(),
        getGuests(),
      ]);
      setTables(tablesData);
      setGuests(guestsData);
      toast.success("Guest removed from table");
    } else {
      toast.error(result.error || "Failed to remove guest");
    }
  }, []);

  // Dialog handlers
  const openDeleteModal = useCallback((table: Table) => {
    setDeleteModal({ open: true, table });
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeleteModal({ open: false, table: null });
  }, []);

  const openAssignDialog = useCallback((table: Table) => {
    setAssignDialog({ open: true, table });
  }, []);

  const closeAssignDialog = useCallback(() => {
    setAssignDialog({ open: false, table: null });
  }, []);

  // Computed values
  const unassignedGuests = guests.filter(g => 
    g.attendance_status === "yes" && !g.table_assignment
  );

  const getTableGuests = useCallback((tableId: number) => {
    return guests.filter(g => g.table_assignment === tableId);
  }, [guests]);

  const totalSeats = tables.reduce((sum, t) => sum + t.capacity, 0);
  const assignedSeats = tables.reduce((sum, t) => sum + (t.seats_taken || 0), 0);

  return {
    tables,
    guests,
    isLoading,
    formData,
    showAddDialog,
    setShowAddDialog,
    assignDialog,
    deleteModal,
    handleChange,
    handleSubmit,
    handleDelete,
    handleAssignGuest,
    handleUnassignGuest,
    openDeleteModal,
    closeDeleteModal,
    openAssignDialog,
    closeAssignDialog,
    unassignedGuests,
    getTableGuests,
    totalSeats,
    assignedSeats,
  };
}
