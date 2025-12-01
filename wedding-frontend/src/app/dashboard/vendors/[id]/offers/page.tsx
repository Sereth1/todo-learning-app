"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Vendor, VendorOffer, VendorOfferType } from "@/types";
import { 
  getVendor, 
  getVendorOffers, 
  createVendorOffer, 
  updateVendorOffer, 
  deleteVendorOffer 
} from "@/actions/vendors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import Link from "next/link";
import { 
  ArrowLeft, 
  Plus, 
  Pencil, 
  Trash2, 
  Package, 
  Tag, 
  Gift, 
  Layers, 
  PlusCircle,
  Loader2,
  Star,
} from "lucide-react";

const offerTypeOptions: { value: VendorOfferType; label: string; icon: React.ReactNode }[] = [
  { value: "package", label: "Package", icon: <Package className="h-4 w-4" /> },
  { value: "service", label: "Service", icon: <Tag className="h-4 w-4" /> },
  { value: "promo", label: "Promotion", icon: <Gift className="h-4 w-4" /> },
  { value: "bundle", label: "Bundle", icon: <Layers className="h-4 w-4" /> },
  { value: "addon", label: "Add-on", icon: <PlusCircle className="h-4 w-4" /> },
];

interface OfferFormData {
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

const defaultFormData: OfferFormData = {
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

export default function VendorOffersPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = parseInt(params.id as string);

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [offers, setOffers] = useState<VendorOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingOffer, setEditingOffer] = useState<VendorOffer | null>(null);
  const [deleteOfferId, setDeleteOfferId] = useState<number | null>(null);
  const [formData, setFormData] = useState<OfferFormData>(defaultFormData);

  // Load data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [vendorResult, offersResult] = await Promise.all([
          getVendor(vendorId),
          getVendorOffers(vendorId),
        ]);

        if (vendorResult.success && vendorResult.data) {
          setVendor(vendorResult.data);
        } else {
          toast.error("Vendor not found");
          router.push("/dashboard/vendors");
          return;
        }

        if (offersResult.success && offersResult.data) {
          setOffers(offersResult.data as VendorOffer[]);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    }

    if (vendorId) {
      loadData();
    }
  }, [vendorId, router]);

  const handleOpenDialog = (offer?: VendorOffer) => {
    if (offer) {
      setEditingOffer(offer);
      setFormData({
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
      });
    } else {
      setEditingOffer(null);
      setFormData(defaultFormData);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingOffer(null);
    setFormData(defaultFormData);
  };

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
    if (!formData.name.trim()) {
      toast.error("Please enter a name");
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        vendor: vendorId,
        name: formData.name,
        offer_type: formData.offer_type,
        description: formData.description,
        price: formData.price,
        original_price: formData.original_price,
        currency: formData.currency,
        includes: formData.includes.split("\n").filter(Boolean),
        excludes: formData.excludes.split("\n").filter(Boolean),
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        deposit_required: formData.deposit_required,
        duration_hours: formData.duration_hours,
        terms_and_conditions: formData.terms_and_conditions,
      };

      if (editingOffer) {
        const result = await updateVendorOffer(editingOffer.id, data);
        if (result.success && result.data) {
          setOffers((prev) =>
            prev.map((o) => (o.id === editingOffer.id ? result.data! : o))
          );
          toast.success("Offer updated!");
        } else {
          toast.error(result.error || "Failed to update offer");
        }
      } else {
        const result = await createVendorOffer(data);
        if (result.success && result.data) {
          setOffers((prev) => [...prev, result.data!]);
          toast.success("Offer created!");
        } else {
          toast.error(result.error || "Failed to create offer");
        }
      }
      handleCloseDialog();
    } catch {
      toast.error("Failed to save offer");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteOfferId) return;

    try {
      const result = await deleteVendorOffer(deleteOfferId);
      if (result.success) {
        setOffers((prev) => prev.filter((o) => o.id !== deleteOfferId));
        toast.success("Offer deleted!");
      } else {
        toast.error(result.error || "Failed to delete offer");
      }
    } catch {
      toast.error("Failed to delete offer");
    } finally {
      setDeleteOfferId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (!vendor) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/vendors/${vendorId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Packages & Offers</h1>
            <p className="text-gray-500">Manage packages for {vendor.name}</p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Package
        </Button>
      </div>

      {/* Offers Grid */}
      {offers.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center text-center">
            <Package className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No packages yet
            </h3>
            <p className="text-gray-500 mb-4">
              Add your first package or offer to attract customers
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Package
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map((offer) => (
            <Card key={offer.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {offerTypeOptions.find((o) => o.value === offer.offer_type)?.icon}
                    <Badge variant={offer.is_active ? "default" : "secondary"}>
                      {offer.offer_type_display || offer.offer_type}
                    </Badge>
                    {offer.is_featured && (
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenDialog(offer)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      onClick={() => setDeleteOfferId(offer.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-lg">{offer.name}</CardTitle>
                {offer.description && (
                  <CardDescription className="line-clamp-2">
                    {offer.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Price */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-rose-600">
                      {offer.currency} {offer.price.toLocaleString()}
                    </span>
                    {offer.original_price && offer.original_price > offer.price && (
                      <span className="text-sm text-gray-400 line-through">
                        {offer.currency} {offer.original_price.toLocaleString()}
                      </span>
                    )}
                    {offer.discount_percentage > 0 && (
                      <Badge className="bg-green-100 text-green-700">
                        -{offer.discount_percentage}%
                      </Badge>
                    )}
                  </div>

                  {/* Includes */}
                  {offer.includes?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Includes:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {offer.includes.slice(0, 3).map((item, i) => (
                          <li key={i} className="flex items-center gap-1">
                            <span className="text-green-500">✓</span> {item}
                          </li>
                        ))}
                        {offer.includes.length > 3 && (
                          <li className="text-gray-400">
                            +{offer.includes.length - 3} more
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Duration */}
                  {offer.duration_hours && (
                    <p className="text-sm text-gray-500">
                      Duration: {offer.duration_hours} hours
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingOffer ? "Edit Package" : "Add Package"}
            </DialogTitle>
            <DialogDescription>
              {editingOffer
                ? "Update the package details"
                : "Create a new package or offer"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Premium Package"
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
                    {offerTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          {option.icon}
                          {option.label}
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
                rows={3}
                placeholder="Describe what's included..."
              />
            </div>

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
                <Label htmlFor="includes">What&apos;s Included (one per line)</Label>
                <Textarea
                  id="includes"
                  name="includes"
                  value={formData.includes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="8 hours coverage&#10;2 photographers&#10;Online gallery"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="excludes">What&apos;s Not Included (one per line)</Label>
                <Textarea
                  id="excludes"
                  name="excludes"
                  value={formData.excludes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Travel expenses&#10;Photo album"
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

            <div className="space-y-2">
              <Label htmlFor="terms_and_conditions">Terms & Conditions</Label>
              <Textarea
                id="terms_and_conditions"
                name="terms_and_conditions"
                value={formData.terms_and_conditions}
                onChange={handleChange}
                rows={2}
                placeholder="Any terms or conditions..."
              />
            </div>

            <div className="flex gap-4">
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
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingOffer ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteOfferId} onOpenChange={() => setDeleteOfferId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Package?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the package.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
