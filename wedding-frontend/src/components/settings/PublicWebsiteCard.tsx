"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Globe } from "lucide-react";
import type { SettingsFormData } from "@/hooks/use-settings";

interface PublicWebsiteCardProps {
  formData: SettingsFormData;
  onSwitchChange: (checked: boolean) => void;
  onCopyLink: () => void;
}

export function PublicWebsiteCard({ formData, onSwitchChange, onCopyLink }: PublicWebsiteCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-rose-500" />
          Public Website
        </CardTitle>
        <CardDescription>
          Control your public wedding website
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="is_website_public" className="text-base">Enable Public Website</Label>
            <p className="text-sm text-gray-500">
              Allow guests to view your wedding website
            </p>
          </div>
          <Switch
            id="is_website_public"
            checked={formData.is_website_public}
            onCheckedChange={onSwitchChange}
          />
        </div>

        {formData.is_website_public && (
          <div className="pt-2 space-y-2">
            <Label>Public Link</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/w/${formData.slug}`}
                className="bg-gray-50"
              />
              <Button type="button" variant="outline" onClick={onCopyLink}>
                Copy
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
