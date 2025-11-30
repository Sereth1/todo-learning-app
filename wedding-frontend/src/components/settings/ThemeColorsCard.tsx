"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette } from "lucide-react";
import type { SettingsFormData } from "@/hooks/use-settings";

interface ThemeColorsCardProps {
  formData: SettingsFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ThemeColorsCard({ formData, onChange }: ThemeColorsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-rose-500" />
          Theme Colors
        </CardTitle>
        <CardDescription>
          Customize your wedding colors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primary_color">Primary Color</Label>
            <div className="flex gap-2">
              <input
                type="color"
                id="primary_color"
                name="primary_color"
                value={formData.primary_color}
                onChange={onChange}
                className="w-12 h-10 rounded border cursor-pointer"
              />
              <Input
                value={formData.primary_color}
                onChange={onChange}
                name="primary_color"
                className="flex-1 uppercase"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondary_color">Secondary Color</Label>
            <div className="flex gap-2">
              <input
                type="color"
                id="secondary_color"
                name="secondary_color"
                value={formData.secondary_color}
                onChange={onChange}
                className="w-12 h-10 rounded border cursor-pointer"
              />
              <Input
                value={formData.secondary_color}
                onChange={onChange}
                name="secondary_color"
                className="flex-1 uppercase"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div 
          className="mt-4 p-4 rounded-lg border" 
          style={{
            backgroundImage: `linear-gradient(to right, ${formData.primary_color}20, ${formData.secondary_color}40)`
          }}
        >
          <p 
            className="text-center font-serif text-lg" 
            style={{ color: formData.primary_color }}
          >
            {formData.partner1_name} & {formData.partner2_name}
          </p>
          <p className="text-center text-sm text-gray-600 mt-1">Color Preview</p>
        </div>
      </CardContent>
    </Card>
  );
}
