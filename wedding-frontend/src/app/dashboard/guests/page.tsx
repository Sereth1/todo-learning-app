"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getGuests, deleteGuest, sendReminder, getGuestStats } from "@/actions/wedding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";
import type { Guest, GuestStats as GuestStatsType } from "@/types";

import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { GuestStats, GuestFilters, GuestTable, type AttendanceFilter, type GuestTypeFilter } from "@/components/guests";

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
  const [stats, setStats] = useState<GuestStatsType | null>(null);
  const [totalGuests, setTotalGuests] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AttendanceFilter>("all");
  const [typeFilter, setTypeFilter] = useState<GuestTypeFilter>("all");
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; guest: Guest | null }>({
    open: false,
    guest: null,
  });
  
  // Debounce search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search]);

  // Load guests with filters from backend
  const loadGuests = useCallback(async () => {
    if (!wedding) return;
    setIsLoading(true);
    
    const data = await getGuests({
      status: statusFilter,
      guest_type: typeFilter,
      search: debouncedSearch || undefined,
    });
    
    setGuests(data);
    setIsLoading(false);
  }, [wedding, statusFilter, typeFilter, debouncedSearch]);

  // Load stats separately (unfiltered totals)
  const loadStats = useCallback(async () => {
    if (!wedding) return;
    const statsData = await getGuestStats();
    if (statsData) {
      setStats(statsData);
      setTotalGuests(statsData.total_invited);
    }
  }, [wedding]);

  // Initial load
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Reload guests when filters change
  useEffect(() => {
    loadGuests();
  }, [loadGuests]);

  const handleDelete = useCallback(async () => {
    if (!deleteModal.guest) return;
    
    const result = await deleteGuest(deleteModal.guest.id);
    if (result.success) {
      setGuests(prev => prev.filter(g => g.id !== deleteModal.guest!.id));
      loadStats(); // Refresh stats after delete
      toast.success("Guest deleted successfully");
    } else {
      toast.error(result.error || "Failed to delete guest");
    }
    setDeleteModal({ open: false, guest: null });
  }, [deleteModal.guest, loadStats]);

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

  if (isLoading && guests.length === 0) {
    return <GuestsLoadingSkeleton />;
  }

  const hasFilters = debouncedSearch || statusFilter !== "all" || typeFilter !== "all";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Guest List"
        description={`${totalGuests} guests invited`}
        actions={
          <Button asChild className="bg-rose-500 hover:bg-rose-600">
            <Link href="/dashboard/guests/add">
              <Plus className="mr-2 h-4 w-4" />
              Add Guest
            </Link>
          </Button>
        }
      />

      {stats && <GuestStats stats={stats} />}

      <Card>
        <CardHeader className="pb-4">
          <GuestFilters
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          ) : guests.length === 0 ? (
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
              guests={guests}
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
