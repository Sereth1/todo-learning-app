"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getGuests, deleteGuest, sendReminder } from "@/actions/wedding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";
import type { Guest } from "@/types";

import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { GuestStats, GuestFilters, GuestTable, type AttendanceFilter } from "@/components/guests";

function GuestsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

export default function GuestsPage() {
  const { wedding } = useAuth();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AttendanceFilter>("all");
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; guest: Guest | null }>({
    open: false,
    guest: null,
  });

  useEffect(() => {
    const loadGuests = async () => {
      if (!wedding) return;
      setIsLoading(true);
      const data = await getGuests();
      setGuests(data);
      setIsLoading(false);
    };
    loadGuests();
  }, [wedding]);

  // Memoize filtered guests
  const filteredGuests = useMemo(() => {
    let result = guests;
    
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        g => 
          g.first_name.toLowerCase().includes(searchLower) ||
          g.last_name.toLowerCase().includes(searchLower) ||
          g.email.toLowerCase().includes(searchLower)
      );
    }
    
    if (statusFilter !== "all") {
      result = result.filter(g => g.attendance_status === statusFilter);
    }
    
    return result;
  }, [guests, search, statusFilter]);

  const handleDelete = useCallback(async () => {
    if (!deleteModal.guest) return;
    
    const result = await deleteGuest(deleteModal.guest.id);
    if (result.success) {
      setGuests(prev => prev.filter(g => g.id !== deleteModal.guest!.id));
      toast.success("Guest deleted successfully");
    } else {
      toast.error(result.error || "Failed to delete guest");
    }
    setDeleteModal({ open: false, guest: null });
  }, [deleteModal.guest]);

  const handleSendReminder = useCallback(async (guest: Guest) => {
    const result = await sendReminder(guest.id);
    if (result.success) {
      toast.success(`Reminder sent to ${guest.first_name}`);
    } else {
      toast.error(result.error || "Failed to send reminder");
    }
  }, []);

  const copyInviteCode = useCallback((guest: Guest) => {
    navigator.clipboard.writeText(guest.user_code);
    toast.success("Invitation code copied!");
  }, []);

  const openDeleteModal = useCallback((guest: Guest) => {
    setDeleteModal({ open: true, guest });
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeleteModal({ open: false, guest: null });
  }, []);

  if (isLoading) {
    return <GuestsLoadingSkeleton />;
  }

  const hasFilters = search || statusFilter !== "all";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Guest List"
        description={`${guests.length} guests invited`}
        actions={
          <Button asChild className="bg-rose-500 hover:bg-rose-600">
            <Link href="/dashboard/guests/add">
              <Plus className="mr-2 h-4 w-4" />
              Add Guest
            </Link>
          </Button>
        }
      />

      <GuestStats guests={guests} />

      <Card>
        <CardHeader className="pb-4">
          <GuestFilters
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
          />
        </CardHeader>
        <CardContent>
          {filteredGuests.length === 0 ? (
            <EmptyState
              icon={Users}
              title={hasFilters ? "No guests match your filters" : "No guests yet"}
              description={hasFilters ? "Try adjusting your search or filters" : "Add your first guest to get started!"}
              action={!hasFilters ? {
                label: "Add Guest",
                href: "/dashboard/guests/add"
              } : undefined}
            />
          ) : (
            <GuestTable
              guests={filteredGuests}
              onDelete={openDeleteModal}
              onSendReminder={handleSendReminder}
              onCopyCode={copyInviteCode}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={deleteModal.open}
        onClose={closeDeleteModal}
        title="Delete Guest"
        description={`Are you sure you want to delete ${deleteModal.guest?.first_name} ${deleteModal.guest?.last_name}? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
