"use client";

import { Vendor } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, CreditCard, Calendar, Clock, Users } from "lucide-react";

interface VendorAboutTabProps {
  vendor: Vendor;
}

export function VendorAboutTab({ vendor }: VendorAboutTabProps) {
  const details = [
    vendor.years_in_business && {
      icon: Calendar,
      label: `${vendor.years_in_business} years in business`,
    },
    vendor.languages_list?.length > 0 && {
      icon: Globe,
      label: `Languages: ${vendor.languages_list.join(", ")}`,
    },
    vendor.accepts_credit_card && {
      icon: CreditCard,
      label: "Accepts credit cards",
    },
    vendor.offers_payment_plan && {
      icon: CreditCard,
      label: "Payment plans available",
    },
    vendor.min_capacity && vendor.max_capacity && {
      icon: Users,
      label: `Capacity: ${vendor.min_capacity} - ${vendor.max_capacity} guests`,
    },
    vendor.lead_time_days && {
      icon: Clock,
      label: `Lead time: ${vendor.lead_time_days} days`,
    },
  ].filter(Boolean) as Array<{ icon: typeof Calendar; label: string }>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>About {vendor.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {vendor.description && (
          <p className="text-gray-600 whitespace-pre-wrap">{vendor.description}</p>
        )}

        {/* Details Grid */}
        {details.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            {details.map((detail, index) => (
              <div key={index} className="flex items-center gap-2">
                <detail.icon className="h-5 w-5 text-gray-400" />
                <span>{detail.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Awards */}
        {vendor.awards && (
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Awards & Recognition</h4>
            <p className="text-gray-600">{vendor.awards}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
