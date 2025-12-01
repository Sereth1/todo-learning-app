"use client";

import { VendorOffer } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Star, Package, Tag, Gift, Layers, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const offerTypeIcons: Record<string, React.ReactNode> = {
  package: <Package className="h-4 w-4" />,
  service: <Tag className="h-4 w-4" />,
  promo: <Gift className="h-4 w-4" />,
  bundle: <Layers className="h-4 w-4" />,
  addon: <PlusCircle className="h-4 w-4" />,
};

interface OfferManageCardProps {
  offer: VendorOffer;
  onEdit: () => void;
  onDelete: () => void;
}

export function OfferManageCard({ offer, onEdit, onDelete }: OfferManageCardProps) {
  const discountPercentage = offer.original_price && offer.original_price > offer.price
    ? Math.round((1 - offer.price / offer.original_price) * 100)
    : null;

  return (
    <Card className={cn(
      offer.is_featured && "ring-2 ring-rose-500",
      !offer.is_active && "opacity-60"
    )}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {offerTypeIcons[offer.offer_type] || <Package className="h-4 w-4" />}
            <CardTitle className="text-lg">{offer.name}</CardTitle>
          </div>
          <div className="flex gap-1">
            {offer.is_featured && (
              <Badge className="bg-rose-500">
                <Star className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
            {!offer.is_active && <Badge variant="secondary">Inactive</Badge>}
          </div>
        </div>
        <CardDescription>{offer.offer_type_display}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 line-clamp-2">{offer.description}</p>

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
                {discountPercentage}% off
              </Badge>
            </>
          )}
        </div>

        {/* Includes preview */}
        {offer.includes && offer.includes.length > 0 && (
          <div className="text-sm text-gray-500">
            <span className="font-medium">Includes:</span>{" "}
            {offer.includes.slice(0, 3).join(", ")}
            {offer.includes.length > 3 && ` +${offer.includes.length - 3} more`}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
