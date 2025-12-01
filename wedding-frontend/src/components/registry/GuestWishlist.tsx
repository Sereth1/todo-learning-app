"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Check, Gift, Loader2, Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  getGuestWishlist,
  claimWishlistItem,
  unclaimWishlistItem,
} from "@/actions/registry";
import type { RegistryItem, PublicRegistryInfo } from "@/types/registry";

interface GuestWishlistProps {
  guestCode: string;
}

export default function GuestWishlist({ guestCode }: GuestWishlistProps) {
  const [registry, setRegistry] = useState<PublicRegistryInfo | null>(null);
  const [items, setItems] = useState<RegistryItem[]>([]);
  const [myClaimedIds, setMyClaimedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingItemId, setClaimingItemId] = useState<number | null>(null);

  const fetchWishlist = async () => {
    setIsLoading(true);
    const result = await getGuestWishlist(guestCode);
    
    if (result.success && result.data) {
      setRegistry(result.data.registry);
      setItems(result.data.items);
      setMyClaimedIds(result.data.my_claimed_ids);
    } else {
      toast.error(result.error || "Failed to load wishlist");
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestCode]);

  const handleClaim = async (itemId: number) => {
    setClaimingItemId(itemId);
    
    const result = await claimWishlistItem(guestCode, itemId);
    
    if (result.success && result.data) {
      toast.success(result.data.message);
      setMyClaimedIds(prev => [...prev, itemId]);
      setItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, is_claimed: true, is_mine: true }
            : item
        )
      );
    } else {
      toast.error(result.error || "Failed to claim item");
    }
    
    setClaimingItemId(null);
  };

  const handleUnclaim = async (itemId: number) => {
    setClaimingItemId(itemId);
    
    const result = await unclaimWishlistItem(guestCode, itemId);
    
    if (result.success && result.data) {
      toast.success(result.data.message);
      setMyClaimedIds(prev => prev.filter(id => id !== itemId));
      setItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, is_claimed: false, is_mine: false }
            : item
        )
      );
    } else {
      toast.error(result.error || "Failed to unclaim item");
    }
    
    setClaimingItemId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  if (!registry) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
          <Gift className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-lg mb-1">No Registry Yet</h3>
        <p className="text-muted-foreground text-sm">
          The couple hasn&apos;t set up their gift registry yet.
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
          <ShoppingBag className="h-8 w-8 text-primary" />
        </div>
        <h3 className="font-medium text-lg mb-1">Coming Soon</h3>
        <p className="text-muted-foreground text-sm">
          Gift ideas will be added here soon!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Claimed Summary - Show at top if items claimed */}
      {myClaimedIds.length > 0 && (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center shrink-0">
              <Check className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                You&apos;ve claimed {myClaimedIds.length} gift{myClaimedIds.length !== 1 ? "s" : ""}!
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                Thank you for your generosity 💝
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="space-y-3">
        {items.map((item) => {
          const isMyClaim = myClaimedIds.includes(item.id);
          const isClaimedByOther = item.is_claimed && !isMyClaim;
          const isProcessing = claimingItemId === item.id;

          return (
            <Card 
              key={item.id} 
              className={`overflow-hidden transition-all duration-200 ${
                isMyClaim 
                  ? "ring-2 ring-green-500 bg-green-50/50 dark:bg-green-950/20" 
                  : isClaimedByOther 
                    ? "opacity-60 bg-muted/30" 
                    : "hover:shadow-md"
              }`}
            >
              <CardContent className="p-0">
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0 bg-muted">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Gift className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    )}
                    {/* Status overlay on image */}
                    {isMyClaim && (
                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                        <div className="bg-green-500 rounded-full p-1.5">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    )}
                    {isClaimedByOther && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="secondary" className="text-xs">
                          Taken
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 py-3 pr-4 flex flex-col justify-between min-w-0">
                    <div>
                      {/* Name & Price Row */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-sm sm:text-base line-clamp-1">
                          {item.name}
                        </h3>
                        {registry.show_prices && item.price_display && (
                          <span className="text-sm font-semibold text-primary whitespace-nowrap">
                            {item.price_display}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      {item.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center gap-2">
                      {/* External Link */}
                      {item.external_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          asChild
                        >
                          <a href={item.external_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </a>
                        </Button>
                      )}

                      {/* Claim / Unclaim Button */}
                      {isMyClaim ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs border-green-300 text-green-700 hover:bg-green-50"
                          onClick={() => handleUnclaim(item.id)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Claimed
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleClaim(item.id)}
                          disabled={isClaimedByOther || isProcessing}
                        >
                          {isProcessing ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : isClaimedByOther ? (
                            "Unavailable"
                          ) : (
                            <>
                              <Heart className="h-3 w-3 mr-1" />
                              I&apos;ll bring this
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Registry title at bottom */}
      {registry.message && (
        <p className="text-center text-sm text-muted-foreground italic pt-2">
          &ldquo;{registry.message}&rdquo;
        </p>
      )}
    </div>
  );
}
