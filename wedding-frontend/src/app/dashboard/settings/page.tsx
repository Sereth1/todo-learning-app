"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, Loader2 } from "lucide-react";
import { WeddingDetailsCard, PublicWebsiteCard, ThemeColorsCard } from "@/components/settings";
import { useSettings } from "@/hooks/use-settings";

function SettingsLoadingSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-96" />
    </div>
  );
}

export default function SettingsPage() {
  const {
    wedding,
    isLoading,
    isSaving,
    formData,
    handleChange,
    handleSwitchChange,
    handleSubmit,
    copyPublicLink,
  } = useSettings();

  if (isLoading) {
    return <SettingsLoadingSkeleton />;
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
        <WeddingDetailsCard formData={formData} onChange={handleChange} />
        
        <PublicWebsiteCard
          formData={formData}
          onSwitchChange={handleSwitchChange}
          onCopyLink={copyPublicLink}
        />
        
        <ThemeColorsCard formData={formData} onChange={handleChange} />

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
