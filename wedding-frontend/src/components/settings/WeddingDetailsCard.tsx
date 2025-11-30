"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Calendar, Link as LinkIcon } from "lucide-react";
import type { SettingsFormData } from "@/hooks/use-settings";

interface WeddingDetailsCardProps {
  formData: SettingsFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function WeddingDetailsCard({ formData, onChange }: WeddingDetailsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-rose-500" />
          Wedding Details
        </CardTitle>
        <CardDescription>
          Basic information about your wedding
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="partner1_name">Partner 1 Name *</Label>
            <Input
              id="partner1_name"
              name="partner1_name"
              placeholder="James"
              value={formData.partner1_name}
              onChange={onChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="partner2_name">Partner 2 Name *</Label>
            <Input
              id="partner2_name"
              name="partner2_name"
              placeholder="Sarah"
              value={formData.partner2_name}
              onChange={onChange}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="wedding_date" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Wedding Date
          </Label>
          <Input
            id="wedding_date"
            name="wedding_date"
            type="date"
            value={formData.wedding_date}
            onChange={onChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug" className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Wedding URL
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {typeof window !== "undefined" ? window.location.origin : ""}/w/
            </span>
            <Input
              id="slug"
              name="slug"
              placeholder="james-sarah"
              value={formData.slug}
              onChange={onChange}
              className="flex-1"
            />
          </div>
          <p className="text-xs text-gray-500">
            This is the URL guests will use to access your wedding website
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
