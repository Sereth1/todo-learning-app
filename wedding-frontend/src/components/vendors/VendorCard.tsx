"use client";

import { VendorListItem, VendorPriceRange } from "@/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Star, 
  MapPin, 
  Heart,
  BadgeCheck,
  Leaf,
  ExternalLink,
  Store as StoreIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface VendorCardProps {
  vendor: VendorListItem;
  onSave?: (vendorId: number) => void;
  isSaved?: boolean;
  compact?: boolean;
}

const priceRangeColors: Record<VendorPriceRange, string> = {
  "$": "bg-green-100 text-green-700",
  "$$": "bg-blue-100 text-blue-700",
  "$$$": "bg-purple-100 text-purple-700",
  "$$$$": "bg-amber-100 text-amber-700",
};

export function VendorCard({ vendor, onSave, isSaved = false, compact = false }: VendorCardProps) {
  const bookingStatusColors = {
    available: "bg-green-100 text-green-700",
    limited: "bg-yellow-100 text-yellow-700",
    booked: "bg-red-100 text-red-700",
  };
  const imageUrl = vendor.primary_image || vendor.primary_image_url;

  return (
    <Card className={cn(
      "group overflow-hidden transition-all hover:shadow-lg",
      compact ? "flex flex-row" : ""
    )}>
      {/* Image */}
      <div className={cn(
        "relative overflow-hidden bg-gray-100",
        compact ? "w-32 h-32 shrink-0" : "aspect-4/3"
      )}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={vendor.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <StoreIcon className="h-12 w-12" />
          </div>
        )}
        
        {/* Save button overlay */}
        {onSave && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute top-2 right-2 bg-white/80 backdrop-blur-sm hover:bg-white",
              isSaved && "text-rose-500"
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSave(vendor.id);
            }}
          >
            <Heart className={cn("h-5 w-5", isSaved && "fill-current")} />
          </Button>
        )}
        
        {/* Badges overlay */}
        <div className="absolute bottom-2 left-2 flex gap-1">
          {vendor.is_featured && (
            <Badge className="bg-rose-500 text-white text-xs">Featured</Badge>
          )}
          {vendor.is_verified && (
            <Badge variant="secondary" className="bg-white/90 text-xs">
              <BadgeCheck className="h-3 w-3 mr-1 text-blue-500" />
              Verified
            </Badge>
          )}
          {vendor.is_eco_friendly && (
            <Badge variant="secondary" className="bg-white/90 text-xs">
              <Leaf className="h-3 w-3 mr-1 text-green-500" />
              Eco
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <CardContent className={cn("flex-1", compact ? "p-3" : "p-4")}>
          {/* Category */}
          <p className="text-xs text-gray-500 mb-1">{vendor.category_name}</p>
          
          {/* Name */}
          <h3 className={cn(
            "font-semibold text-gray-900 line-clamp-1",
            compact ? "text-sm" : "text-lg"
          )}>
            {vendor.name}
          </h3>
          
          {/* Tagline */}
          {vendor.tagline && !compact && (
            <p className="text-sm text-gray-600 line-clamp-2 mt-1">
              {vendor.tagline}
            </p>
          )}
          
          {/* Location */}
          {vendor.city && (
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
              <MapPin className="h-3 w-3" />
              <span>{vendor.city}, {vendor.country}</span>
            </div>
          )}
          
          {/* Rating & Reviews */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-medium text-sm">
                {typeof vendor.average_rating === 'number' 
                  ? vendor.average_rating.toFixed(1) 
                  : parseFloat(String(vendor.average_rating || 0)).toFixed(1)}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              ({vendor.review_count || 0} reviews)
            </span>
          </div>
        </CardContent>

        <CardFooter className={cn(
          "flex items-center justify-between border-t bg-gray-50/50",
          compact ? "p-3" : "p-4"
        )}>
          {/* Price & Status */}
          <div className="flex items-center gap-2">
            {vendor.price_range && (
              <Badge 
                variant="secondary" 
                className={priceRangeColors[vendor.price_range]}
              >
                {vendor.price_range}
              </Badge>
            )}
            <Badge 
              variant="secondary"
              className={bookingStatusColors[vendor.booking_status]}
            >
              {vendor.booking_status === "available" ? "Available" :
               vendor.booking_status === "limited" ? "Limited" : "Booked"}
            </Badge>
          </div>
          
          {/* View button */}
          <Link href={`/dashboard/vendors/${vendor.id}`}>
            <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700">
              View
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </CardFooter>
      </div>
    </Card>
  );
}
