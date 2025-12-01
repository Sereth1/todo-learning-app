"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { VendorOffer } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { ArrowLeft, Plus, Package } from "lucide-react";

// Custom hook
import { useVendor } from "@/hooks/vendors/useVendor";
import { useVendorOffers } from "@/hooks/vendors/useVendorOffers";

// Components
import { OfferFormDialog, OfferManageCard, OfferFormData } from "@/components/vendors";
import { GridSkeleton } from "@/components/shared/Skeletons";

export default function VendorOffersPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = parseInt(params.id as string);

  // Hooks
  const { vendor, isLoading: vendorLoading } = useVendor(vendorId);
  const {
    offers,
    isLoading: offersLoading,
    isSaving,
    createOffer,
    updateOffer,
    deleteOffer,
  } = useVendorOffers(vendorId);

  // Local state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<VendorOffer | null>(null);
  const [deleteOfferId, setDeleteOfferId] = useState<number | null>(null);

  const isLoading = vendorLoading || offersLoading;

  // Handle opening dialog for create/edit
  const handleOpenDialog = (offer?: VendorOffer) => {
    setEditingOffer(offer || null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingOffer(null);
  };

  // Handle form submit
  const handleSubmit = async (formData: OfferFormData) => {
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

    let success = false;
    if (editingOffer) {
      success = await updateOffer(editingOffer.id, data);
      if (success) toast.success("Offer updated!");
    } else {
      success = await createOffer(data);
      if (success) toast.success("Offer created!");
    }

    if (success) {
      handleCloseDialog();
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteOfferId) return;

    const success = await deleteOffer(deleteOfferId);
    if (success) {
      toast.success("Offer deleted!");
    }
    setDeleteOfferId(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-gray-100 rounded animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
        <GridSkeleton count={3} columns={2} />
      </div>
    );
  }

  if (!vendor) {
    router.push("/dashboard/vendors");
    return null;
  }

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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No packages yet</h3>
            <p className="text-gray-500 mb-4">
              Create your first package or offer to showcase your services
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Package
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offers.map((offer) => (
            <OfferManageCard
              key={offer.id}
              offer={offer}
              onEdit={() => handleOpenDialog(offer)}
              onDelete={() => setDeleteOfferId(offer.id)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <OfferFormDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        editingOffer={editingOffer}
        isSaving={isSaving}
      />

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
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
