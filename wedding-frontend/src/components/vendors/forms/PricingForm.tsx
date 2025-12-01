"use client";

import { VendorCreateData } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PricingFormProps {
  formData: Partial<VendorCreateData>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string) => (value: string) => void;
}

export function PricingForm({ formData, onChange, onSelectChange }: PricingFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing & Availability</CardTitle>
        <CardDescription>Update pricing information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price_range">Price Range</Label>
            <Select
              value={formData.price_range || ""}
              onValueChange={onSelectChange("price_range")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="$">$ - Budget</SelectItem>
                <SelectItem value="$$">$$ - Moderate</SelectItem>
                <SelectItem value="$$$">$$$ - Premium</SelectItem>
                <SelectItem value="$$$$">$$$$ - Luxury</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="min_price">Min Price</Label>
            <Input
              id="min_price"
              name="min_price"
              type="number"
              value={formData.min_price || ""}
              onChange={onChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max_price">Max Price</Label>
            <Input
              id="max_price"
              name="max_price"
              type="number"
              value={formData.max_price || ""}
              onChange={onChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              name="currency"
              value={formData.currency || "EUR"}
              onChange={onChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="booking_status">Booking Status</Label>
            <Select
              value={formData.booking_status || "available"}
              onValueChange={onSelectChange("booking_status")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="limited">Limited Availability</SelectItem>
                <SelectItem value="booked">Fully Booked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="years_in_business">Years in Business</Label>
          <Input
            id="years_in_business"
            name="years_in_business"
            type="number"
            value={formData.years_in_business || ""}
            onChange={onChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}
