"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EventList, AddEventDialog } from "@/components/events";
import { useEvents } from "@/hooks/use-events";
import { Plus } from "lucide-react";

function EventsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4">
        {[1, 2].map(i => <Skeleton key={i} className="h-48" />)}
      </div>
    </div>
  );
}

export default function EventsPage() {
  const {
    events,
    isLoading,
    formData,
    showAddDialog,
    setShowAddDialog,
    deleteModal,
    handleChange,
    handleSubmit,
    handleDelete,
    openDeleteModal,
    closeDeleteModal,
  } = useEvents();

  if (isLoading) {
    return <EventsLoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        description={`${events.length} event${events.length !== 1 ? "s" : ""} planned`}
        actions={
          <Button 
            onClick={() => setShowAddDialog(true)}
            className="bg-rose-500 hover:bg-rose-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        }
      />

      <EventList
        events={events}
        onDelete={openDeleteModal}
        onAddClick={() => setShowAddDialog(true)}
      />

      <AddEventDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        formData={formData}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        isOpen={deleteModal.open}
        onClose={closeDeleteModal}
        title="Delete Event"
        description={`Are you sure you want to delete "${deleteModal.event?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
