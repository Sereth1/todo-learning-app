"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { 
  SeatingStats, 
  TableList, 
  AddTableDialog, 
  AssignGuestDialog 
} from "@/components/seating";
import { useSeating } from "@/hooks/use-seating";
import { Plus } from "lucide-react";

function SeatingLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48" />)}
      </div>
    </div>
  );
}

export default function SeatingPage() {
  const {
    tables,
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
  } = useSeating();

  if (isLoading) {
    return <SeatingLoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Seating"
        description={`${tables.length} tables, ${totalSeats} total seats`}
        actions={
          <Button 
            onClick={() => setShowAddDialog(true)}
            className="bg-rose-500 hover:bg-rose-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Table
          </Button>
        }
      />

      <SeatingStats
        tablesCount={tables.length}
        assignedSeats={assignedSeats}
        totalSeats={totalSeats}
        unassignedCount={unassignedGuests.length}
      />

      <TableList
        tables={tables}
        unassignedCount={unassignedGuests.length}
        onAssign={openAssignDialog}
        onDelete={openDeleteModal}
        onUnassignGuest={handleUnassignGuest}
        onAddClick={() => setShowAddDialog(true)}
      />

      <AddTableDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        formData={formData}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />

      <AssignGuestDialog
        open={assignDialog.open}
        onOpenChange={(open) => !open && closeAssignDialog()}
        table={assignDialog.table}
        unassignedGuests={unassignedGuests}
        onAssign={handleAssignGuest}
      />

      <ConfirmDialog
        isOpen={deleteModal.open}
        onClose={closeDeleteModal}
        title="Delete Table"
        description={`Are you sure you want to delete "${deleteModal.table?.name}"? All seating assignments will be removed.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
