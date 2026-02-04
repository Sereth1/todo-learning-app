"use client";

import { useState } from "react";
import { VendorReview } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Star, ThumbsUp } from "lucide-react";
import { StarRating, getRatingLabel } from "@/components/shared/StarRating";
import { EmptyState } from "@/components/shared/EmptyState";

// ============ Review Card ============

interface ReviewCardProps {
  review: VendorReview;
  onMarkHelpful: (reviewId: number) => void;
}

export function ReviewCard({ review, onMarkHelpful }: ReviewCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StarRating rating={review.rating} size="sm" />
              {review.is_verified_purchase && (
                <Badge variant="secondary" className="text-xs">
                  Verified
                </Badge>
              )}
            </div>
            {review.title && <h4 className="font-medium">{review.title}</h4>}
          </div>
          <span className="text-sm text-gray-500">
            {new Date(review.created_at).toLocaleDateString()}
          </span>
        </div>
        <p className="text-gray-600 mb-3">{review.content}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">By {review.user_name}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMarkHelpful(review.id)}
          >
            <ThumbsUp className="h-4 w-4 mr-1" />
            Helpful ({review.helpful_count})
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============ Write Review Dialog ============

interface WriteReviewDialogProps {
  vendorName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { rating: number; title: string; content: string }) => Promise<boolean>;
  isSubmitting: boolean;
}

export function WriteReviewDialog({
  vendorName,
  isOpen,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: WriteReviewDialogProps) {
  const [form, setForm] = useState({ rating: 5, title: "", content: "" });

  const handleSubmit = async () => {
    const success = await onSubmit(form);
    if (success) {
      setForm({ rating: 5, title: "", content: "" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
          <DialogDescription>Share your experience with {vendorName}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Rating */}
          <div className="space-y-2">
            <Label>Rating</Label>
            <StarRating
              rating={form.rating}
              size="lg"
              interactive
              onRatingChange={(rating) => setForm((prev) => ({ ...prev, rating }))}
            />
            <p className="text-sm text-gray-500">{getRatingLabel(form.rating)}</p>
          </div>
          {/* Title */}
          <div className="space-y-2">
            <Label>Title (optional)</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Summarize your experience"
            />
          </div>
          {/* Content */}
          <div className="space-y-2">
            <Label>Your Review</Label>
            <Textarea
              value={form.content}
              onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="Share details of your experience..."
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !form.content.trim()}>
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Reviews Tab ============

interface VendorReviewsTabProps {
  reviews: VendorReview[];
  vendorName: string;
  onSubmitReview: (data: { rating: number; title: string; content: string }) => Promise<boolean>;
  onMarkHelpful: (reviewId: number) => void;
  isSubmitting: boolean;
}

export function VendorReviewsTab({
  reviews,
  vendorName,
  onSubmitReview,
  onMarkHelpful,
  isSubmitting,
}: VendorReviewsTabProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSubmit = async (data: { rating: number; title: string; content: string }) => {
    const success = await onSubmitReview(data);
    if (success) {
      setIsDialogOpen(false);
    }
    return success;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Customer Reviews</h3>
        <Button onClick={() => setIsDialogOpen(true)}>Write a Review</Button>
      </div>

      {/* Write Review Dialog */}
      <WriteReviewDialog
        vendorName={vendorName}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onMarkHelpful={onMarkHelpful}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Star}
          title="No reviews yet"
          description="Be the first to share your experience"
          action={{
            label: "Write a Review",
            onClick: () => setIsDialogOpen(true),
          }}
        />
      )}
    </div>
  );
}
