"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Vendor, VendorReview } from "@/types";
import { 
  getVendor, 
  getVendorReviews, 
  toggleSaveVendor, 
  checkVendorSaved,
  createVendorReview,
  markReviewHelpful,
} from "@/actions/vendors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  Star,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  BadgeCheck,
  Leaf,
  CreditCard,
  Calendar,
  MessageSquare,
  ThumbsUp,
  Send,
  Instagram,
  Facebook,
  Pencil,
  Package,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = parseInt(params.id as string);

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [reviews, setReviews] = useState<VendorReview[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", content: "" });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Load vendor data
  useEffect(() => {
    async function loadVendor() {
      setIsLoading(true);
      try {
        const [vendorResult, reviewsResult, savedResult] = await Promise.all([
          getVendor(vendorId),
          getVendorReviews(vendorId),
          checkVendorSaved(vendorId),
        ]);

        if (vendorResult.success && vendorResult.data) {
          setVendor(vendorResult.data);
        } else {
          toast.error("Vendor not found");
          router.push("/dashboard/vendors");
          return;
        }

        if (reviewsResult.success && reviewsResult.data) {
          setReviews(reviewsResult.data);
        }

        if (savedResult.success && savedResult.data) {
          setIsSaved(savedResult.data.saved);
        }
      } catch (error) {
        console.error("Failed to load vendor:", error);
        toast.error("Failed to load vendor");
      } finally {
        setIsLoading(false);
      }
    }
    
    if (vendorId) {
      loadVendor();
    }
  }, [vendorId, router]);

  // Handle save/unsave
  const handleToggleSave = useCallback(async () => {
    const result = await toggleSaveVendor(vendorId);
    if (result.success && result.data) {
      setIsSaved(result.data.saved);
      toast.success(result.data.saved ? "Vendor saved" : "Vendor removed from saved");
    } else {
      toast.error("Failed to update saved status");
    }
  }, [vendorId]);

  // Handle review submission
  const handleSubmitReview = useCallback(async () => {
    if (!reviewForm.content.trim()) {
      toast.error("Please write a review");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const result = await createVendorReview({
        vendor: vendorId,
        rating: reviewForm.rating,
        title: reviewForm.title,
        content: reviewForm.content,
      });

      if (result.success && result.data) {
        setReviews(prev => [result.data!, ...prev]);
        setReviewForm({ rating: 5, title: "", content: "" });
        setIsReviewDialogOpen(false);
        toast.success("Review submitted successfully");
      } else {
        toast.error(result.error || "Failed to submit review");
      }
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  }, [vendorId, reviewForm]);

  // Handle mark helpful
  const handleMarkHelpful = useCallback(async (reviewId: number) => {
    const result = await markReviewHelpful(reviewId);
    if (result.success && result.data) {
      setReviews(prev => prev.map(r => 
        r.id === reviewId 
          ? { ...r, helpful_count: result.data!.helpful_count }
          : r
      ));
    }
  }, []);

  if (isLoading) {
    return <VendorDetailSkeleton />;
  }

  if (!vendor) {
    return null;
  }

  // Build images array from primary_image, primary_image_url, or images gallery
  const primaryImageUrl = vendor.primary_image || vendor.primary_image_url;
  const allImages = primaryImageUrl
    ? [{ image: primaryImageUrl, caption: vendor.name }, ...(vendor.images || [])]
    : vendor.images || [];

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Vendors
        </Button>
        <div className="flex gap-2">
          <Link href={`/dashboard/vendors/${vendor.id}/offers`}>
            <Button variant="outline">
              <Package className="h-4 w-4 mr-2" />
              Manage Offers
            </Button>
          </Link>
          <Link href={`/dashboard/vendors/${vendor.id}/edit`}>
            <Button variant="outline">
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Header Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Images */}
        <div className="lg:col-span-2 space-y-4">
          {/* Main Image */}
          <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
            {allImages.length > 0 ? (
              <Image
                src={allImages[activeImageIndex]?.image || ""}
                alt={allImages[activeImageIndex]?.caption || vendor.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <Store className="h-24 w-24" />
              </div>
            )}
            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              {vendor.is_featured && (
                <Badge className="bg-rose-500 text-white">Featured</Badge>
              )}
              {vendor.is_verified && (
                <Badge variant="secondary" className="bg-white/90">
                  <BadgeCheck className="h-4 w-4 mr-1 text-blue-500" />
                  Verified
                </Badge>
              )}
              {vendor.is_eco_friendly && (
                <Badge variant="secondary" className="bg-white/90">
                  <Leaf className="h-4 w-4 mr-1 text-green-500" />
                  Eco-Friendly
                </Badge>
              )}
            </div>
          </div>

          {/* Thumbnail Strip */}
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {allImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImageIndex(index)}
                  className={cn(
                    "relative w-20 h-20 rounded-lg overflow-hidden shrink-0",
                    activeImageIndex === index && "ring-2 ring-rose-500"
                  )}
                >
                  <Image
                    src={img.image}
                    alt={img.caption || ""}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Card */}
        <Card className="h-fit">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">{vendor.category_name}</p>
                <CardTitle className="text-2xl">{vendor.name}</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleSave}
                className={isSaved ? "text-rose-500" : ""}
              >
                <Heart className={cn("h-5 w-5", isSaved && "fill-current")} />
              </Button>
            </div>
            {vendor.tagline && (
              <CardDescription className="text-base">{vendor.tagline}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-lg">
                  {typeof vendor.average_rating === 'number' 
                    ? vendor.average_rating.toFixed(1) 
                    : parseFloat(String(vendor.average_rating || 0)).toFixed(1)}
                </span>
              </div>
              <span className="text-gray-500">({vendor.review_count || 0} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Price Range</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{vendor.price_range}</Badge>
                {vendor.price_display && (
                  <span className="text-sm text-gray-600">{vendor.price_display}</span>
                )}
              </div>
            </div>

            {/* Booking Status */}
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Availability</span>
              <Badge 
                variant="secondary"
                className={cn(
                  vendor.booking_status === "available" && "bg-green-100 text-green-700",
                  vendor.booking_status === "limited" && "bg-yellow-100 text-yellow-700",
                  vendor.booking_status === "booked" && "bg-red-100 text-red-700"
                )}
              >
                {vendor.booking_status_display}
              </Badge>
            </div>

            {/* Location */}
            {vendor.city && (
              <div className="flex items-start gap-2 text-gray-600">
                <MapPin className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{vendor.address}, {vendor.city}, {vendor.country}</span>
              </div>
            )}

            {/* Contact Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              {vendor.phone && (
                <Button variant="outline" asChild>
                  <a href={`tel:${vendor.phone}`}>
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </a>
                </Button>
              )}
              {vendor.email && (
                <Button variant="outline" asChild>
                  <a href={`mailto:${vendor.email}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </a>
                </Button>
              )}
              {vendor.whatsapp && (
                <Button variant="outline" asChild>
                  <a href={`https://wa.me/${vendor.whatsapp}`} target="_blank">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    WhatsApp
                  </a>
                </Button>
              )}
              {vendor.website && (
                <Button variant="outline" asChild>
                  <a href={vendor.website} target="_blank">
                    <Globe className="h-4 w-4 mr-2" />
                    Website
                  </a>
                </Button>
              )}
            </div>

            {/* Social Media */}
            {(vendor.instagram_url || vendor.facebook_url) && (
              <div className="flex gap-2 pt-2">
                {vendor.instagram_url && (
                  <Button variant="ghost" size="icon" asChild>
                    <a href={vendor.instagram_url} target="_blank">
                      <Instagram className="h-5 w-5" />
                    </a>
                  </Button>
                )}
                {vendor.facebook_url && (
                  <Button variant="ghost" size="icon" asChild>
                    <a href={vendor.facebook_url} target="_blank">
                      <Facebook className="h-5 w-5" />
                    </a>
                  </Button>
                )}
              </div>
            )}

            {/* Request Quote Button */}
            <Link href={`/dashboard/vendors/${vendor.id}/quote`} className="block">
              <Button className="w-full bg-rose-500 hover:bg-rose-600">
                <Send className="h-4 w-4 mr-2" />
                Request Quote
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="about" className="space-y-6">
        <TabsList>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="offers">Packages & Offers</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({vendor.review_count})</TabsTrigger>
        </TabsList>

        {/* About Tab */}
        <TabsContent value="about" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About {vendor.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {vendor.description && (
                <p className="text-gray-600 whitespace-pre-wrap">{vendor.description}</p>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                {vendor.years_in_business && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <span>{vendor.years_in_business} years in business</span>
                  </div>
                )}
                {vendor.languages_list?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-gray-400" />
                    <span>Languages: {vendor.languages_list.join(", ")}</span>
                  </div>
                )}
                {vendor.accepts_credit_card && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                    <span>Accepts credit cards</span>
                  </div>
                )}
                {vendor.offers_payment_plan && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                    <span>Payment plans available</span>
                  </div>
                )}
                {vendor.min_capacity && vendor.max_capacity && (
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-400" />
                    <span>Capacity: {vendor.min_capacity} - {vendor.max_capacity} guests</span>
                  </div>
                )}
                {vendor.lead_time_days && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <span>Lead time: {vendor.lead_time_days} days</span>
                  </div>
                )}
              </div>

              {/* Awards */}
              {vendor.awards && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Awards & Recognition</h4>
                  <p className="text-gray-600">{vendor.awards}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Offers Tab */}
        <TabsContent value="offers" className="space-y-6">
          {vendor.offers && vendor.offers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vendor.offers.map((offer) => (
                <Card key={offer.id} className={offer.is_featured ? "ring-2 ring-rose-500" : ""}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{offer.name}</CardTitle>
                        <CardDescription>{offer.offer_type_display}</CardDescription>
                      </div>
                      {offer.is_featured && (
                        <Badge className="bg-rose-500">Popular</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-600">{offer.description}</p>
                    
                    {/* Price */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">
                        {offer.currency} {offer.price.toLocaleString()}
                      </span>
                      {offer.original_price && offer.original_price > offer.price && (
                        <>
                          <span className="text-gray-400 line-through">
                            {offer.currency} {offer.original_price.toLocaleString()}
                          </span>
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            {offer.discount_percentage}% off
                          </Badge>
                        </>
                      )}
                    </div>

                    {/* Includes */}
                    {offer.includes && offer.includes.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm mb-2">Includes:</h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {offer.includes.map((item, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <span className="text-green-500">✓</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {offer.deposit_required && (
                      <p className="text-sm text-gray-500">
                        Deposit: {offer.currency} {offer.deposit_required.toLocaleString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="py-12">
              <CardContent className="text-center">
                <p className="text-gray-500">No packages or offers available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-6">
          {/* Write Review Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Customer Reviews</h3>
            <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
              <DialogTrigger asChild>
                <Button>Write a Review</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Write a Review</DialogTitle>
                  <DialogDescription>
                    Share your experience with {vendor.name}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Rating */}
                  <div className="space-y-2">
                    <Label>Rating</Label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="cursor-pointer hover:scale-110 transition-transform"
                          onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                        >
                          <Star
                            className={cn(
                              "h-8 w-8 transition-colors",
                              star <= reviewForm.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-gray-300 hover:text-amber-200"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500">
                      {reviewForm.rating === 1 && "Poor"}
                      {reviewForm.rating === 2 && "Fair"}
                      {reviewForm.rating === 3 && "Good"}
                      {reviewForm.rating === 4 && "Very Good"}
                      {reviewForm.rating === 5 && "Excellent"}
                    </p>
                  </div>
                  {/* Title */}
                  <div className="space-y-2">
                    <Label>Title (optional)</Label>
                    <Input
                      value={reviewForm.title}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Summarize your experience"
                    />
                  </div>
                  {/* Content */}
                  <div className="space-y-2">
                    <Label>Your Review</Label>
                    <Textarea
                      value={reviewForm.content}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Share details of your experience..."
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmitReview}
                    disabled={isSubmittingReview}
                  >
                    {isSubmittingReview ? "Submitting..." : "Submit Review"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Reviews List */}
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "h-4 w-4",
                                  i < review.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-gray-300"
                                )}
                              />
                            ))}
                          </div>
                          {review.is_verified_purchase && (
                            <Badge variant="secondary" className="text-xs">
                              Verified
                            </Badge>
                          )}
                        </div>
                        {review.title && (
                          <h4 className="font-medium">{review.title}</h4>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{review.content}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        By {review.user_name}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleMarkHelpful(review.id)}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Helpful ({review.helpful_count})
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="py-12">
              <CardContent className="text-center">
                <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No reviews yet</p>
                <Button onClick={() => setIsReviewDialogOpen(true)}>
                  Be the first to review
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Fallback icons
function Store({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
      />
    </svg>
  );
}

// Loading skeleton
function VendorDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-32" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="aspect-video w-full rounded-xl" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="w-20 h-20 rounded-lg" />
            ))}
          </div>
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
      <Skeleton className="h-12 w-full max-w-md" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
