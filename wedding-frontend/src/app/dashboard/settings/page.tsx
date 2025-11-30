"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentWedding, updateWedding } from "@/actions/wedding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Settings,
  Save, 
  Loader2,
  Palette,
  Globe,
  Calendar,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { Wedding } from "@/types";

export default function SettingsPage() {
  const { wedding: contextWedding } = useAuth();
  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    partner1_name: "",
    partner2_name: "",
    wedding_date: "",
    slug: "",
    is_website_public: false,
    primary_color: "#f43f5e",
    secondary_color: "#fecdd3",
  });

  useEffect(() => {
    const loadWedding = async () => {
      if (!contextWedding) return;
      setIsLoading(true);
      const data = await getCurrentWedding();
      if (data) {
        setWedding(data);
        setFormData({
          partner1_name: data.partner1_name || "",
          partner2_name: data.partner2_name || "",
          wedding_date: data.wedding_date || "",
          slug: data.slug || "",
          is_website_public: data.is_website_public || false,
          primary_color: data.primary_color || "#f43f5e",
          secondary_color: data.secondary_color || "#fecdd3",
        });
      }
      setIsLoading(false);
    };
    loadWedding();
  }, [contextWedding]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, is_website_public: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wedding) return;

    if (!formData.partner1_name || !formData.partner2_name) {
      toast.error("Partner names are required");
      return;
    }

    setIsSaving(true);
    
    const result = await updateWedding(wedding.id, {
      partner1_name: formData.partner1_name,
      partner2_name: formData.partner2_name,
      wedding_date: formData.wedding_date || undefined,
      slug: formData.slug,
    });

    setIsSaving(false);

    if (result.success) {
      toast.success("Settings saved successfully!");
    } else {
      toast.error(result.error || "Failed to save settings");
    }
  };

  const copyPublicLink = () => {
    if (wedding) {
      const url = `${window.location.origin}/w/${wedding.slug}`;
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No wedding selected</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your wedding details and preferences</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
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
                  onChange={handleChange}
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
                  onChange={handleChange}
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
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Wedding URL
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{window.location.origin}/w/</span>
                <Input
                  id="slug"
                  name="slug"
                  placeholder="james-sarah"
                  value={formData.slug}
                  onChange={handleChange}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-gray-500">
                This is the URL guests will use to access your wedding website
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Website Settings */}
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
                onCheckedChange={handleSwitchChange}
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
                  <Button type="button" variant="outline" onClick={copyPublicLink}>
                    Copy
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Theme Settings */}
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
                    onChange={handleChange}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={handleChange}
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
                    onChange={handleChange}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={formData.secondary_color}
                    onChange={handleChange}
                    name="secondary_color"
                    className="flex-1 uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-4 p-4 rounded-lg border bg-linear-to-r" style={{
              backgroundImage: `linear-gradient(to right, ${formData.primary_color}20, ${formData.secondary_color}40)`
            }}>
              <p className="text-center font-serif text-lg" style={{ color: formData.primary_color }}>
                {formData.partner1_name} & {formData.partner2_name}
              </p>
              <p className="text-center text-sm text-gray-600 mt-1">Color Preview</p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button 
            type="submit" 
            className="bg-rose-500 hover:bg-rose-600"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
