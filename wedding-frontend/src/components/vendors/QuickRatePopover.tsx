"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquarePlus, Loader2 } from "lucide-react";
import { StarRating } from "@/components/shared/StarRating";

interface QuickRatePopoverProps {
  /** Callback when review is submitted */
  onSubmit: (rating: number, comment: string) => Promise<boolean>;
  /** Optional button className */
  buttonClassName?: string;
  /** Whether the popover is disabled */
  disabled?: boolean;
}

export function QuickRatePopover({
  onSubmit,
  buttonClassName,
  disabled = false,
}: QuickRatePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) return;

    setIsSubmitting(true);
    try {
      const success = await onSubmit(rating, comment);
      if (success) {
        setIsOpen(false);
        setRating(5);
        setComment("");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={buttonClassName}
          onClick={(e) => e.preventDefault()}
          disabled={disabled}
        >
          <MessageSquarePlus className="h-3 w-3 mr-1" />
          Rate
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="space-y-3">
          <p className="text-sm font-medium">Quick Review</p>

          {/* Interactive Star Rating */}
          <StarRating
            rating={rating}
            size="md"
            interactive
            onRatingChange={setRating}
          />

          {/* Comment */}
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a quick comment..."
            rows={2}
            className="text-sm"
          />

          {/* Submit */}
          <Button
            size="sm"
            className="w-full"
            onClick={handleSubmit}
            disabled={isSubmitting || !comment.trim()}
          >
            {isSubmitting ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <MessageSquarePlus className="h-3 w-3 mr-1" />
            )}
            Submit Review
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
