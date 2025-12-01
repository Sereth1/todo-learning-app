"use client";

import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import Link from "next/link";

// Custom hooks
import { useVendor } from "@/hooks/vendors/useVendor";
import { useVendorReviews } from "@/hooks/vendors/useVendorReviews";

// Shared components
import { ImageGallery } from "@/components/shared/ImageGallery";
import { VendorDetailSkeleton } from "@/components/shared/Skeletons";

// Vendor-specific components
import {
  VendorDetailHeader,
  VendorInfoCard,
  VendorAboutTab,
  VendorOffersTab,
  VendorReviewsTab,
} from "@/components/vendors";

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = parseInt(params.id as string);

  // Use custom hooks for data fetching
  const { vendor, isLoading, isSaved, toggleSave } = useVendor(vendorId);
  const {
    reviews,
    isSubmitting,
    submitReview,
    markHelpful,
  } = useVendorReviews(vendorId);

  // Loading state
  if (isLoading) {
    return <VendorDetailSkeleton />;
  }

  // Not found
  if (!vendor) {
    return null;
  }

  // Build images array for the gallery
  const primaryImageUrl = vendor.primary_image || vendor.primary_image_url;
  const allImages = primaryImageUrl
    ? [
        { image: primaryImageUrl, caption: vendor.name },
        ...(vendor.images || []),
      ]
    : vendor.images || [];

  return (
    <div className="space-y-6">
      {/* Header with back button and action buttons */}
      <VendorDetailHeader
        vendorId={vendor.id}
        onBack={() => router.back()}
        showEditButton
        showOffersButton
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Image Gallery */}
        <div className="lg:col-span-2">
          <ImageGallery
            images={allImages}
            aspectRatio="video"
            isFeatured={vendor.is_featured}
            isVerified={vendor.is_verified}
            isEcoFriendly={vendor.is_eco_friendly}
          />
        </div>

        {/* Right Side - Vendor Info Card */}
        <VendorInfoCard
          vendor={vendor}
          isSaved={isSaved}
          onToggleSave={toggleSave}
        >
          {/* Request Quote Button */}
          <Link
            href={`/dashboard/vendors/${vendor.id}/quote`}
            className="block"
          >
            <Button className="w-full bg-rose-500 hover:bg-rose-600">
              <Send className="h-4 w-4 mr-2" />
              Request Quote
            </Button>
          </Link>
        </VendorInfoCard>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="about" className="space-y-6">
        <TabsList>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="offers">Packages & Offers</TabsTrigger>
          <TabsTrigger value="reviews">
            Reviews ({vendor.review_count || 0})
          </TabsTrigger>
        </TabsList>

        {/* About Tab */}
        <TabsContent value="about">
          <VendorAboutTab vendor={vendor} />
        </TabsContent>

        {/* Offers Tab */}
        <TabsContent value="offers">
          <VendorOffersTab offers={vendor.offers || []} />
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews">
          <VendorReviewsTab
            reviews={reviews}
            vendorName={vendor.name}
            isSubmitting={isSubmitting}
            onSubmitReview={submitReview}
            onMarkHelpful={markHelpful}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
