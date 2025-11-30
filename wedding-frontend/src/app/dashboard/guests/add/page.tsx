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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, UserPlus, Loader2, Users, Heart } from "lucide-react";
import { toast } from "sonner";
import type { GuestType, FamilyRelationship, RelationshipTier } from "@/types";

// Guest type options
const GUEST_TYPES: { value: GuestType; label: string }[] = [
  { value: "family", label: "Family" },
  { value: "friend", label: "Friend" },
  { value: "coworker", label: "Coworker" },
  { value: "neighbor", label: "Neighbor" },
  { value: "other", label: "Other" },
];

// Family relationships grouped by tier
const FIRST_TIER_RELATIONSHIPS: { value: FamilyRelationship; label: string }[] = [
  { value: "mother", label: "Mother" },
  { value: "father", label: "Father" },
  { value: "sister", label: "Sister" },
  { value: "brother", label: "Brother" },
  { value: "daughter", label: "Daughter" },
  { value: "son", label: "Son" },
  { value: "grandmother", label: "Grandmother" },
  { value: "grandfather", label: "Grandfather" },
];

const SECOND_TIER_RELATIONSHIPS: { value: FamilyRelationship; label: string }[] = [
  { value: "aunt", label: "Aunt" },
  { value: "uncle", label: "Uncle" },
  { value: "cousin", label: "Cousin" },
  { value: "niece", label: "Niece" },
  { value: "nephew", label: "Nephew" },
];

const THIRD_TIER_RELATIONSHIPS: { value: FamilyRelationship; label: string }[] = [
  { value: "great_aunt", label: "Great Aunt" },
  { value: "great_uncle", label: "Great Uncle" },
  { value: "second_cousin", label: "Second Cousin" },
  { value: "cousin_once_removed", label: "Cousin Once Removed" },
  { value: "distant_relative", label: "Distant Relative" },
];

const RELATIONSHIP_TIERS: { value: RelationshipTier; label: string }[] = [
  { value: "first", label: "1st Tier (Immediate Family)" },
  { value: "second", label: "2nd Tier (Close Extended)" },
  { value: "third", label: "3rd Tier (Distant Relatives)" },
];

export default function AddGuestPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    guest_type: "friend" as GuestType,
    family_relationship: "" as FamilyRelationship | "",
    relationship_tier: "" as RelationshipTier | "",
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

  const handleSelectChange = (name: string) => (value: string) => {
    if (name === "guest_type") {
      if (value !== "family") {
        setFormData(prev => ({ 
          ...prev, 
          guest_type: value as GuestType,
          family_relationship: "",
          relationship_tier: "",
        }));
      } else {
        setFormData(prev => ({ 
          ...prev, 
          guest_type: value as GuestType,
        }));
      }
      return;
    }
    
    if (name === "family_relationship") {
      let tier: RelationshipTier | "" = "";
      if (FIRST_TIER_RELATIONSHIPS.some(r => r.value === value)) {
        tier = "first";
      } else if (SECOND_TIER_RELATIONSHIPS.some(r => r.value === value)) {
        tier = "second";
      } else if (THIRD_TIER_RELATIONSHIPS.some(r => r.value === value)) {
        tier = "third";
      }
      setFormData(prev => ({ 
        ...prev, 
        family_relationship: value as FamilyRelationship | "", 
        relationship_tier: tier 
      }));
      return;
    }
    
    if (name === "relationship_tier") {
      setFormData(prev => ({ 
        ...prev, 
        relationship_tier: value as RelationshipTier | "", 
        family_relationship: "" 
      }));
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string) => (checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const getRelationshipOptions = () => {
    switch (formData.relationship_tier) {
      case "first":
        return FIRST_TIER_RELATIONSHIPS;
      case "second":
        return SECOND_TIER_RELATIONSHIPS;
      case "third":
        return THIRD_TIER_RELATIONSHIPS;
      default:
        return [...FIRST_TIER_RELATIONSHIPS, ...SECOND_TIER_RELATIONSHIPS, ...THIRD_TIER_RELATIONSHIPS];
    }
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
      guest_type: formData.guest_type,
      family_relationship: formData.guest_type === "family" && formData.family_relationship ? formData.family_relationship : undefined,
      relationship_tier: formData.guest_type === "family" && formData.relationship_tier ? formData.relationship_tier : undefined,
      phone: formData.phone || undefined,
      can_bring_plus_one: formData.can_bring_plus_one,
      plus_one_name: formData.plus_one_name || undefined,
      can_bring_children: formData.can_bring_children,
      address: formData.address || undefined,
      notes: formData.notes || undefined,
    });

    setIsLoading(false);

    if (result.success) {
      toast.success(formData.first_name + " has been added to your guest list!");
      router.push("/dashboard/guests");
    } else {
      toast.error(result.error || "Failed to add guest");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-rose-500" />
              Guest Information
            </CardTitle>
            <CardDescription>Basic information about your guest</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-base font-medium">
                <Users className="h-4 w-4 text-rose-500" />
                Guest Category
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="guest_type">Guest Type *</Label>
                <Select value={formData.guest_type} onValueChange={handleSelectChange("guest_type")}>
                  <SelectTrigger className="w-full sm:w-[250px]">
                    <SelectValue placeholder="Select guest type" />
                  </SelectTrigger>
                  <SelectContent>
                    {GUEST_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.guest_type === "family" && (
                <div className="pl-4 border-l-2 border-rose-200 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-rose-600">
                    <Heart className="h-4 w-4" />
                    Family Details
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="relationship_tier">Relationship Tier</Label>
                      <Select value={formData.relationship_tier} onValueChange={handleSelectChange("relationship_tier")}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tier" />
                        </SelectTrigger>
                        <SelectContent>
                          {RELATIONSHIP_TIERS.map((tier) => (
                            <SelectItem key={tier.value} value={tier.value}>{tier.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="family_relationship">Relationship</Label>
                      <Select value={formData.family_relationship} onValueChange={handleSelectChange("family_relationship")}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          {getRelationshipOptions().map((rel) => (
                            <SelectItem key={rel.value} value={rel.value}>{rel.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

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

        <div className="flex justify-end gap-4 mt-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/guests">Cancel</Link>
          </Button>
          <Button type="submit" className="bg-rose-500 hover:bg-rose-600" disabled={isLoading}>
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
