"use client";

import { VendorOffer } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import { PriceDisplay } from "@/components/shared/PriceDisplay";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

interface OfferCardProps {
  offer: VendorOffer;
  className?: string;
}

export function OfferCard({ offer, className }: OfferCardProps) {
  return (
    <Card className={cn(offer.is_featured && "ring-2 ring-rose-500", className)}>
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
        {offer.description && (
          <p className="text-gray-600">{offer.description}</p>
        )}

        {/* Price */}
        <PriceDisplay
          price={offer.price}
          originalPrice={offer.original_price}
          currency={offer.currency}
          discountPercentage={offer.discount_percentage}
        />

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
  );
}

interface VendorOffersTabProps {
  offers: VendorOffer[];
}

export function VendorOffersTab({ offers }: VendorOffersTabProps) {
  if (!offers || offers.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No packages or offers available"
        description="This vendor hasn't added any packages yet"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {offers.map((offer) => (
        <OfferCard key={offer.id} offer={offer} />
      ))}
    </div>
  );
}
