"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createGuest } from "@/actions/wedding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AddGuestPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
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

    setIsLoading(true);
    
    const result = await createGuest({
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

    setIsLoading(false);

    if (result.success) {
      toast.success(`${formData.first_name} has been added to your guest list!`);
      router.push("/dashboard/guests");
    } else {
      toast.error(result.error || "Failed to add guest");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/guests">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Add Guest</h1>
          <p className="text-gray-500">Add a new guest to your wedding</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-rose-500" />
              Guest Information
            </CardTitle>
            <CardDescription>
              Basic information about your guest
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
                  <Label htmlFor="plus_one_name">Plus One Name (if known)</Label>
                  <Input
                    id="plus_one_name"
                    name="plus_one_name"
                    placeholder="Jane Smith"
                    value={formData.plus_one_name}
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Children Section */}
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
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Guest
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
