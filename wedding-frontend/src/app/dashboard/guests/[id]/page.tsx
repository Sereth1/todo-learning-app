"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getGuest, updateGuest, deleteGuest } from "@/actions/wedding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft, 
  User, 
  Loader2, 
  Save,
  Trash2,
  Copy,
  UserCheck,
  Clock,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import type { Guest } from "@/types";

const statusConfig = {
  yes: { label: "Confirmed", color: "bg-green-100 text-green-700", icon: UserCheck },
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700", icon: Clock },
  no: { label: "Declined", color: "bg-gray-100 text-gray-700", icon: UserX },
};

export default function EditGuestPage() {
  const router = useRouter();
  const params = useParams();
  const guestId = parseInt(params.id as string);
  
  const [guest, setGuest] = useState<Guest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    can_bring_plus_one: false,
    plus_one_name: "",
    can_bring_children: false,
    address: "",
    notes: "",
  });

  useEffect(() => {
    const loadGuest = async () => {
      setIsLoading(true);
      const data = await getGuest(guestId);
      if (data) {
        setGuest(data);
        setFormData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          phone: data.phone || "",
          can_bring_plus_one: data.can_bring_plus_one || false,
          plus_one_name: data.plus_one_name || "",
          can_bring_children: data.can_bring_children || false,
          address: data.address || "",
          notes: data.notes || "",
        });
      } else {
        toast.error("Guest not found");
        router.push("/dashboard/guests");
      }
      setIsLoading(false);
    };
    loadGuest();
  }, [guestId, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string) => (checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name || !formData.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    
    const result = await updateGuest(guestId, {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone || undefined,
      can_bring_plus_one: formData.can_bring_plus_one,
      plus_one_name: formData.plus_one_name || undefined,
      can_bring_children: formData.can_bring_children,
      address: formData.address || undefined,
      notes: formData.notes || undefined,
    });

    setIsSaving(false);

    if (result.success) {
      toast.success("Guest updated successfully!");
      router.push("/dashboard/guests");
    } else {
      toast.error(result.error || "Failed to update guest");
    }
  };

  const handleDelete = async () => {
    const result = await deleteGuest(guestId);
    if (result.success) {
      toast.success("Guest deleted successfully");
      router.push("/dashboard/guests");
    } else {
      toast.error(result.error || "Failed to delete guest");
    }
  };

  const copyInviteCode = () => {
    if (guest) {
      navigator.clipboard.writeText(guest.user_code);
      toast.success("Invitation code copied!");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!guest) return null;

  const status = statusConfig[guest.attendance_status];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/guests">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-serif font-bold text-gray-900">
              {guest.first_name} {guest.last_name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={status.color}>
                <status.icon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
              <button 
                onClick={copyInviteCode}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <Copy className="h-3 w-3" />
                {guest.user_code}
              </button>
            </div>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="text-red-600 border-red-200 hover:bg-red-50"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-rose-500" />
              Guest Information
            </CardTitle>
            <CardDescription>
              Update guest details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  placeholder="John"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  placeholder="Smith"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Contact Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                placeholder="123 Main St, City, State 12345"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <Separator />

            {/* Plus One Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="can_bring_plus_one" className="text-base">Allow Plus One</Label>
                  <p className="text-sm text-gray-500">Guest can bring a companion</p>
                </div>
                <Switch
                  id="can_bring_plus_one"
                  checked={formData.can_bring_plus_one}
                  onCheckedChange={handleSwitchChange("can_bring_plus_one")}
                />
              </div>
              
              {formData.can_bring_plus_one && (
                <div className="space-y-2 pl-4 border-l-2 border-rose-200">
                  <Label htmlFor="plus_one_name">Plus One Name</Label>
                  <Input
                    id="plus_one_name"
                    name="plus_one_name"
                    placeholder="Jane Smith"
                    value={formData.plus_one_name}
                    onChange={handleChange}
                  />
                  {guest.is_plus_one_coming && (
                    <p className="text-sm text-green-600">✓ Plus one confirmed</p>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Children Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="can_bring_children" className="text-base">Allow Children</Label>
                  <p className="text-sm text-gray-500">Guest can bring their children</p>
                </div>
                <Switch
                  id="can_bring_children"
                  checked={formData.can_bring_children}
                  onCheckedChange={handleSwitchChange("can_bring_children")}
                />
              </div>
              {guest.has_children && (
                <p className="text-sm text-green-600 pl-4 border-l-2 border-rose-200">
                  ✓ Bringing children
                </p>
              )}
            </div>

            <Separator />

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                name="notes"
                placeholder="Any additional notes about this guest..."
                value={formData.notes}
                onChange={handleChange}
                className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/guests">Cancel</Link>
          </Button>
          <Button 
            type="submit" 
            className="bg-rose-500 hover:bg-rose-600"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Guest</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {guest.first_name} {guest.last_name}? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
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
