"use client";

import { useState } from "react";
import { VendorOffer, VendorOfferType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Tag, Gift, Layers, PlusCircle, Loader2 } from "lucide-react";

const offerTypeOptions: { value: VendorOfferType; label: string; icon: React.ReactNode }[] = [
  { value: "package", label: "Package", icon: <Package className="h-4 w-4" /> },
  { value: "service", label: "Service", icon: <Tag className="h-4 w-4" /> },
  { value: "promo", label: "Promotion", icon: <Gift className="h-4 w-4" /> },
  { value: "bundle", label: "Bundle", icon: <Layers className="h-4 w-4" /> },
  { value: "addon", label: "Add-on", icon: <PlusCircle className="h-4 w-4" /> },
];

export interface OfferFormData {
  name: string;
  offer_type: VendorOfferType;
  description: string;
  price: number;
  original_price?: number;
  currency: string;
  includes: string;
  excludes: string;
  is_active: boolean;
  is_featured: boolean;
  deposit_required?: number;
  duration_hours?: number;
  terms_and_conditions: string;
}

export const defaultOfferFormData: OfferFormData = {
  name: "",
  offer_type: "package",
  description: "",
  price: 0,
  currency: "EUR",
  includes: "",
  excludes: "",
  is_active: true,
  is_featured: false,
  terms_and_conditions: "",
};

function offerToFormData(offer: VendorOffer): OfferFormData {
  return {
    name: offer.name,
    offer_type: offer.offer_type,
    description: offer.description,
    price: offer.price,
    original_price: offer.original_price,
    currency: offer.currency,
    includes: offer.includes?.join("\n") || "",
    excludes: offer.excludes?.join("\n") || "",
    is_active: offer.is_active,
    is_featured: offer.is_featured,
    deposit_required: offer.deposit_required,
    duration_hours: offer.duration_hours,
    terms_and_conditions: offer.terms_and_conditions,
  };
}

interface OfferFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OfferFormData) => Promise<void>;
  editingOffer?: VendorOffer | null;
  isSaving: boolean;
}

// Inner form component that resets when key changes
function OfferForm({
  initialData,
  onSubmit,
  onClose,
  isSaving,
  isEditing,
}: {
  initialData: OfferFormData;
  onSubmit: (data: OfferFormData) => Promise<void>;
  onClose: () => void;
  isSaving: boolean;
  isEditing: boolean;
}) {
  const [formData, setFormData] = useState<OfferFormData>(initialData);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value ? parseFloat(value) : undefined) : value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;
    await onSubmit(formData);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Edit Package" : "Add New Package"}</DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Update the package details"
            : "Create a new package or offer for your vendor"}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Full Day Photography"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="offer_type">Type</Label>
            <Select
              value={formData.offer_type}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  offer_type: value as VendorOfferType,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {offerTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      {opt.icon}
                      {opt.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe this package..."
            rows={3}
          />
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price *</Label>
            <Input
              id="price"
              name="price"
              type="number"
              value={formData.price || ""}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="original_price">Original Price</Label>
            <Input
              id="original_price"
              name="original_price"
              type="number"
              value={formData.original_price || ""}
              onChange={handleChange}
              placeholder="For discounts"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              name="currency"
              value={formData.currency}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="deposit_required">Deposit Required</Label>
            <Input
              id="deposit_required"
              name="deposit_required"
              type="number"
              value={formData.deposit_required || ""}
              onChange={handleChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration_hours">Duration (hours)</Label>
            <Input
              id="duration_hours"
              name="duration_hours"
              type="number"
              value={formData.duration_hours || ""}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Includes/Excludes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="includes">Includes (one per line)</Label>
            <Textarea
              id="includes"
              name="includes"
              value={formData.includes}
              onChange={handleChange}
              placeholder="Professional photographer&#10;100 edited photos&#10;Online gallery"
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="excludes">Excludes (one per line)</Label>
            <Textarea
              id="excludes"
              name="excludes"
              value={formData.excludes}
              onChange={handleChange}
              placeholder="Travel expenses&#10;Printed albums"
              rows={4}
            />
          </div>
        </div>

        {/* Terms */}
        <div className="space-y-2">
          <Label htmlFor="terms_and_conditions">Terms & Conditions</Label>
          <Textarea
            id="terms_and_conditions"
            name="terms_and_conditions"
            value={formData.terms_and_conditions}
            onChange={handleChange}
            rows={3}
          />
        </div>

        {/* Checkboxes */}
        <div className="flex flex-wrap gap-6 pt-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, is_active: !!checked }))
              }
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_featured"
              checked={formData.is_featured}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, is_featured: !!checked }))
              }
            />
            <Label htmlFor="is_featured">Featured</Label>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSaving || !formData.name.trim()}>
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          {isEditing ? "Update" : "Create"}
        </Button>
      </DialogFooter>
    </>
  );
}

export function OfferFormDialog({
  isOpen,
  onClose,
  onSubmit,
  editingOffer,
  isSaving,
}: OfferFormDialogProps) {
  // Compute key to reset form when editing different offer
  const formKey = editingOffer?.id ?? "new";
  const initialData = editingOffer ? offerToFormData(editingOffer) : defaultOfferFormData;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <OfferForm
          key={formKey}
          initialData={initialData}
          onSubmit={onSubmit}
          onClose={onClose}
          isSaving={isSaving}
          isEditing={!!editingOffer}
        />
      </DialogContent>
    </Dialog>
  );
}
