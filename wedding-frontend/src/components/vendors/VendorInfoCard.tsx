"use client";

import { ReactNode } from "react";
import { Vendor } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { StarRating } from "@/components/shared/StarRating";
import { PriceRangeBadge, StatusBadge } from "@/components/shared/PriceDisplay";
import { ContactButtons, SocialLinks } from "@/components/shared/ContactButtons";

interface VendorInfoCardProps {
  vendor: Vendor;
  isSaved: boolean;
  onToggleSave: () => void;
  children?: ReactNode;
}

export function VendorInfoCard({ vendor, isSaved, onToggleSave, children }: VendorInfoCardProps) {
  const rating = typeof vendor.average_rating === "number"
    ? vendor.average_rating
    : parseFloat(String(vendor.average_rating || 0));

  return (
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
            onClick={onToggleSave}
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
          <StarRating rating={rating} showValue size="md" />
          <span className="text-gray-500">({vendor.review_count || 0} reviews)</span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Price Range</span>
          <div className="flex items-center gap-2">
            <PriceRangeBadge range={vendor.price_range} />
            {vendor.price_display && (
              <span className="text-sm text-gray-600">{vendor.price_display}</span>
            )}
          </div>
        </div>

        {/* Booking Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Availability</span>
          <StatusBadge status={vendor.booking_status} label={vendor.booking_status_display} />
        </div>

        {/* Location */}
        {vendor.city && (
          <div className="flex items-start gap-2 text-gray-600">
            <MapPin className="h-5 w-5 shrink-0 mt-0.5" />
            <span>
              {vendor.address && `${vendor.address}, `}
              {vendor.city}, {vendor.country}
            </span>
          </div>
        )}

        {/* Contact Buttons */}
        <ContactButtons
          contact={{
            phone: vendor.phone,
            email: vendor.email,
            whatsapp: vendor.whatsapp,
            website: vendor.website,
          }}
          layout="grid"
        />

        {/* Social Media */}
        <SocialLinks
          instagram={vendor.instagram_url}
          facebook={vendor.facebook_url}
          className="pt-2"
        />

        {/* Children (e.g., action buttons) */}
        {children}
      </CardContent>
    </Card>
  );
}
