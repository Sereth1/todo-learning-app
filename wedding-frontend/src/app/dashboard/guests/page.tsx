"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getGuests, deleteGuest, sendReminder } from "@/actions/wedding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Mail,
  Copy,
  UserCheck,
  Clock,
  UserX,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import type { Guest } from "@/types";

const statusConfig = {
  yes: { label: "Confirmed", color: "bg-green-100 text-green-700", icon: UserCheck },
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700", icon: Clock },
  no: { label: "Declined", color: "bg-gray-100 text-gray-700", icon: UserX },
};

export default function GuestsPage() {
  const { wedding } = useAuth();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
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

  // Compute filtered guests from state
  const filteredGuests = (() => {
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
  })();

  const handleDelete = async () => {
    if (!deleteModal.guest) return;
    
    const result = await deleteGuest(deleteModal.guest.id);
    if (result.success) {
      setGuests(prev => prev.filter(g => g.id !== deleteModal.guest!.id));
      toast.success("Guest deleted successfully");
    } else {
      toast.error(result.error || "Failed to delete guest");
    }
    setDeleteModal({ open: false, guest: null });
  };

  const handleSendReminder = async (guest: Guest) => {
    const result = await sendReminder(guest.id);
    if (result.success) {
      toast.success(`Reminder sent to ${guest.first_name}`);
    } else {
      toast.error(result.error || "Failed to send reminder");
    }
  };

  const copyInviteCode = (guest: Guest) => {
    navigator.clipboard.writeText(guest.user_code);
    toast.success("Invitation code copied!");
  };

  const stats = {
    total: guests.length,
    confirmed: guests.filter(g => g.attendance_status === "yes").length,
    pending: guests.filter(g => g.attendance_status === "pending").length,
    declined: guests.filter(g => g.attendance_status === "no").length,
  };

  if (isLoading) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Guest List</h1>
          <p className="text-gray-500">{stats.total} guests invited</p>
        </div>
        <Button asChild className="bg-rose-500 hover:bg-rose-600">
          <Link href="/dashboard/guests/add">
            <Plus className="mr-2 h-4 w-4" />
            Add Guest
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("all")}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-rose-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("yes")}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.confirmed}</p>
                <p className="text-sm text-gray-500">Confirmed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("pending")}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("no")}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <UserX className="h-8 w-8 text-gray-500" />
              <div>
                <p className="text-2xl font-bold">{stats.declined}</p>
                <p className="text-sm text-gray-500">Declined</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search guests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              {["all", "yes", "pending", "no"].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className={statusFilter === status ? "bg-rose-500 hover:bg-rose-600" : ""}
                >
                  {status === "all" ? "All" : statusConfig[status as keyof typeof statusConfig].label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredGuests.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {search || statusFilter !== "all" 
                  ? "No guests match your filters" 
                  : "No guests yet. Add your first guest!"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Plus One</TableHead>
                    <TableHead>Children</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGuests.map((guest) => {
                    const status = statusConfig[guest.attendance_status];
                    return (
                      <TableRow key={guest.id}>
                        <TableCell className="font-medium">
                          {guest.first_name} {guest.last_name}
                        </TableCell>
                        <TableCell className="text-gray-500">{guest.email}</TableCell>
                        <TableCell>
                          <Badge className={status.color}>
                            <status.icon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {guest.is_plus_one_coming ? (
                            <Badge variant="outline" className="text-green-600">Yes</Badge>
                          ) : (
                            <span className="text-gray-400">No</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {guest.has_children ? (
                            <Badge variant="outline" className="text-blue-600">Yes</Badge>
                          ) : (
                            <span className="text-gray-400">No</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/guests/${guest.id}`}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => copyInviteCode(guest)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Invite Code
                              </DropdownMenuItem>
                              {guest.attendance_status === "pending" && (
                                <DropdownMenuItem onClick={() => handleSendReminder(guest)}>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Send Reminder
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setDeleteModal({ open: true, guest })}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModal.open} onOpenChange={(open) => setDeleteModal({ open, guest: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Guest</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteModal.guest?.first_name} {deleteModal.guest?.last_name}? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModal({ open: false, guest: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
