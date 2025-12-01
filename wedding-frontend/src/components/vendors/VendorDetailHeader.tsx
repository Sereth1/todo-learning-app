"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Package } from "lucide-react";
import Link from "next/link";

interface VendorDetailHeaderProps {
  vendorId: number;
  onBack: () => void;
  showEditButton?: boolean;
  showOffersButton?: boolean;
}

export function VendorDetailHeader({
  vendorId,
  onBack,
  showEditButton = true,
  showOffersButton = true,
}: VendorDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Vendors
      </Button>
      <div className="flex gap-2">
        {showOffersButton && (
          <Link href={`/dashboard/vendors/${vendorId}/offers`}>
            <Button variant="outline">
              <Package className="h-4 w-4 mr-2" />
              Manage Offers
            </Button>
          </Link>
        )}
        {showEditButton && (
          <Link href={`/dashboard/vendors/${vendorId}/edit`}>
            <Button variant="outline">
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
