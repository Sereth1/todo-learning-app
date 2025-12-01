"use client";

import { VendorCreateData } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface SocialSettingsFormProps {
  formData: Partial<VendorCreateData>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCheckboxChange: (name: string) => (checked: boolean) => void;
}

export function SocialSettingsForm({
  formData,
  onChange,
  onCheckboxChange,
}: SocialSettingsFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Media & Settings</CardTitle>
        <CardDescription>Update social links and vendor settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="instagram_url">Instagram</Label>
            <Input
              id="instagram_url"
              name="instagram_url"
              value={formData.instagram_url || ""}
              onChange={onChange}
              placeholder="https://instagram.com/..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facebook_url">Facebook</Label>
            <Input
              id="facebook_url"
              name="facebook_url"
              value={formData.facebook_url || ""}
              onChange={onChange}
              placeholder="https://facebook.com/..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pinterest_url">Pinterest</Label>
            <Input
              id="pinterest_url"
              name="pinterest_url"
              value={formData.pinterest_url || ""}
              onChange={onChange}
              placeholder="https://pinterest.com/..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tiktok_url">TikTok</Label>
            <Input
              id="tiktok_url"
              name="tiktok_url"
              value={formData.tiktok_url || ""}
              onChange={onChange}
              placeholder="https://tiktok.com/..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="youtube_url">YouTube</Label>
            <Input
              id="youtube_url"
              name="youtube_url"
              value={formData.youtube_url || ""}
              onChange={onChange}
              placeholder="https://youtube.com/..."
            />
          </div>
        </div>

        <div className="border-t pt-6">
          <h4 className="font-medium mb-4">Vendor Settings</h4>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_verified"
                checked={formData.is_verified || false}
                onCheckedChange={onCheckboxChange("is_verified")}
              />
              <Label htmlFor="is_verified">Verified Vendor</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_featured"
                checked={formData.is_featured || false}
                onCheckedChange={onCheckboxChange("is_featured")}
              />
              <Label htmlFor="is_featured">Featured Vendor</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_eco_friendly"
                checked={formData.is_eco_friendly || false}
                onCheckedChange={onCheckboxChange("is_eco_friendly")}
              />
              <Label htmlFor="is_eco_friendly">Eco-Friendly</Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
