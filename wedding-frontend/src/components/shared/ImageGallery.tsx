"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, Leaf, Store } from "lucide-react";

interface ImageItem {
  image: string;
  caption?: string;
}

interface ImageGalleryProps {
  images: ImageItem[];
  alt?: string;
  badges?: {
    featured?: boolean;
    verified?: boolean;
    ecoFriendly?: boolean;
  };
  // Alternative direct props for badges
  isFeatured?: boolean;
  isVerified?: boolean;
  isEcoFriendly?: boolean;
  aspectRatio?: "video" | "square" | "portrait";
  className?: string;
}

const aspectRatioClasses = {
  video: "aspect-video",
  square: "aspect-square",
  portrait: "aspect-[3/4]",
};

export function ImageGallery({
  images,
  alt = "Image",
  badges,
  isFeatured,
  isVerified,
  isEcoFriendly,
  aspectRatio = "video",
  className,
}: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Merge badges object with direct props (direct props take precedence)
  const showBadges = badges || isFeatured || isVerified || isEcoFriendly;
  const featuredBadge = isFeatured ?? badges?.featured;
  const verifiedBadge = isVerified ?? badges?.verified;
  const ecoFriendlyBadge = isEcoFriendly ?? badges?.ecoFriendly;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Image */}
      <div className={cn(
        "relative rounded-xl overflow-hidden bg-gray-100",
        aspectRatioClasses[aspectRatio]
      )}>
        {images.length > 0 ? (
          <Image
            src={images[activeIndex]?.image || ""}
            alt={images[activeIndex]?.caption || alt}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <Store className="h-24 w-24" />
          </div>
        )}
        
        {/* Badges */}
        {showBadges && (
          <div className="absolute top-4 left-4 flex gap-2">
            {featuredBadge && (
              <Badge className="bg-rose-500 text-white">Featured</Badge>
            )}
            {verifiedBadge && (
              <Badge variant="secondary" className="bg-white/90">
                <BadgeCheck className="h-4 w-4 mr-1 text-blue-500" />
                Verified
              </Badge>
            )}
            {ecoFriendlyBadge && (
              <Badge variant="secondary" className="bg-white/90">
                <Leaf className="h-4 w-4 mr-1 text-green-500" />
                Eco-Friendly
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative w-20 h-20 rounded-lg overflow-hidden shrink-0 transition-all",
                activeIndex === index 
                  ? "ring-2 ring-rose-500" 
                  : "opacity-70 hover:opacity-100"
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
  );
}
