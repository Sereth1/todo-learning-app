"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";

// Custom hook
import { useEditVendor } from "@/hooks/vendors";

// Form components
import {
  BasicInfoForm,
  LocationForm,
  PricingForm,
  SocialSettingsForm,
} from "@/components/vendors/forms";

// Shared components
import { FormSkeleton } from "@/components/shared/Skeletons";

export default function EditVendorPage() {
  const params = useParams();
  const vendorId = parseInt(params.id as string);

  const {
    vendor,
    categories,
    formData,
    isLoading,
    isSaving,
    handleChange,
    handleSelectChange,
    handleCheckboxChange,
    handleSubmit,
  } = useEditVendor(vendorId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-gray-100 rounded animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-32 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
        <FormSkeleton />
      </div>
    );
  }

  if (!vendor) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/vendors/${vendorId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Vendor</h1>
            <p className="text-gray-500">Update {vendor.name}</p>
          </div>
        </div>
        <Button onClick={() => handleSubmit()} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="social">Social & Settings</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic">
            <BasicInfoForm
              formData={formData}
              categories={categories}
              onChange={handleChange}
              onSelectChange={handleSelectChange}
            />
          </TabsContent>

          {/* Location Tab */}
          <TabsContent value="location">
            <LocationForm formData={formData} onChange={handleChange} />
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing">
            <PricingForm
              formData={formData}
              onChange={handleChange}
              onSelectChange={handleSelectChange}
            />
          </TabsContent>

          {/* Social & Settings Tab */}
          <TabsContent value="social">
            <SocialSettingsForm
              formData={formData}
              onChange={handleChange}
              onCheckboxChange={handleCheckboxChange}
            />
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}
