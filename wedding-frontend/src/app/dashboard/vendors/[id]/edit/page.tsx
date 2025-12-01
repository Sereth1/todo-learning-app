"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Vendor, VendorCategory, VendorCreateData, VendorPriceRange, VendorBookingStatus } from "@/types";
import { getVendor, updateVendor, getVendorCategories } from "@/actions/vendors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";

export default function EditVendorPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = parseInt(params.id as string);

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [categories, setCategories] = useState<VendorCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<VendorCreateData>>({});

  // Load vendor and categories
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [vendorResult, categoriesResult] = await Promise.all([
          getVendor(vendorId),
          getVendorCategories(),
        ]);

        if (vendorResult.success && vendorResult.data) {
          setVendor(vendorResult.data);
          // Initialize form with vendor data
          setFormData({
            name: vendorResult.data.name,
            category: vendorResult.data.category,
            tagline: vendorResult.data.tagline,
            description: vendorResult.data.description,
            primary_image_url: vendorResult.data.primary_image_url,
            email: vendorResult.data.email,
            phone: vendorResult.data.phone,
            website: vendorResult.data.website,
            address_line1: vendorResult.data.address,
            address_line2: vendorResult.data.address_line_2,
            city: vendorResult.data.city,
            state: vendorResult.data.state,
            postal_code: vendorResult.data.postal_code,
            country: vendorResult.data.country,
            price_range: vendorResult.data.price_range,
            min_price: vendorResult.data.min_price,
            max_price: vendorResult.data.max_price,
            currency: vendorResult.data.currency,
            booking_status: vendorResult.data.booking_status,
            is_verified: vendorResult.data.is_verified,
            is_featured: vendorResult.data.is_featured,
            is_eco_friendly: vendorResult.data.is_eco_friendly,
            years_in_business: vendorResult.data.years_in_business,
            instagram_url: vendorResult.data.instagram_url,
            facebook_url: vendorResult.data.facebook_url,
            pinterest_url: vendorResult.data.pinterest_url,
            tiktok_url: vendorResult.data.tiktok_url,
            youtube_url: vendorResult.data.youtube_url,
          });
        } else {
          toast.error("Vendor not found");
          router.push("/dashboard/vendors");
        }

        if (categoriesResult.success && categoriesResult.data) {
          setCategories(categoriesResult.data);
        }
      } catch (error) {
        console.error("Failed to load vendor:", error);
        toast.error("Failed to load vendor");
      } finally {
        setIsLoading(false);
      }
    }

    if (vendorId) {
      loadData();
    }
  }, [vendorId, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value ? parseFloat(value) : undefined) : value,
    }));
  };

  const handleSelectChange = (name: string) => (value: string) => {
    if (name === "category") {
      setFormData((prev) => ({ ...prev, category: parseInt(value) }));
    } else if (name === "price_range") {
      setFormData((prev) => ({ ...prev, price_range: value as VendorPriceRange }));
    } else if (name === "booking_status") {
      setFormData((prev) => ({ ...prev, booking_status: value as VendorBookingStatus }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (name: string) => (checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const result = await updateVendor(vendorId, formData);
      if (result.success) {
        toast.success("Vendor updated successfully!");
        router.push(`/dashboard/vendors/${vendorId}`);
      } else {
        toast.error(result.error || "Failed to update vendor");
      }
    } catch {
      toast.error("Failed to update vendor");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-[600px] w-full" />
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
        <Button onClick={handleSubmit} disabled={isSaving}>
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

          {/* Basic Info */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Update the vendor&apos;s basic details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Business Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name || ""}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category?.toString() || ""}
                      onValueChange={handleSelectChange("category")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    name="tagline"
                    value={formData.tagline || ""}
                    onChange={handleChange}
                    placeholder="A short catchy phrase"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description || ""}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Describe the business..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primary_image_url">Image URL</Label>
                  <Input
                    id="primary_image_url"
                    name="primary_image_url"
                    type="url"
                    value={formData.primary_image_url || ""}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      name="website"
                      type="url"
                      value={formData.website || ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Location */}
          <TabsContent value="location">
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
                <CardDescription>Update the business address</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address_line1">Address Line 1</Label>
                  <Input
                    id="address_line1"
                    name="address_line1"
                    value={formData.address_line1 || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address_line2">Address Line 2</Label>
                  <Input
                    id="address_line2"
                    name="address_line2"
                    value={formData.address_line2 || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state || ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      name="postal_code"
                      value={formData.postal_code || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      name="country"
                      value={formData.country || ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing */}
          <TabsContent value="pricing">
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
                      onValueChange={handleSelectChange("price_range")}
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
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_price">Max Price</Label>
                    <Input
                      id="max_price"
                      name="max_price"
                      type="number"
                      value={formData.max_price || ""}
                      onChange={handleChange}
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
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="booking_status">Booking Status</Label>
                    <Select
                      value={formData.booking_status || "available"}
                      onValueChange={handleSelectChange("booking_status")}
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
                    onChange={handleChange}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social & Settings */}
          <TabsContent value="social">
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
                      onChange={handleChange}
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebook_url">Facebook</Label>
                    <Input
                      id="facebook_url"
                      name="facebook_url"
                      value={formData.facebook_url || ""}
                      onChange={handleChange}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pinterest_url">Pinterest</Label>
                    <Input
                      id="pinterest_url"
                      name="pinterest_url"
                      value={formData.pinterest_url || ""}
                      onChange={handleChange}
                      placeholder="https://pinterest.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tiktok_url">TikTok</Label>
                    <Input
                      id="tiktok_url"
                      name="tiktok_url"
                      value={formData.tiktok_url || ""}
                      onChange={handleChange}
                      placeholder="https://tiktok.com/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="youtube_url">YouTube</Label>
                    <Input
                      id="youtube_url"
                      name="youtube_url"
                      value={formData.youtube_url || ""}
                      onChange={handleChange}
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
                        onCheckedChange={handleCheckboxChange("is_verified")}
                      />
                      <Label htmlFor="is_verified">Verified Vendor</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_featured"
                        checked={formData.is_featured || false}
                        onCheckedChange={handleCheckboxChange("is_featured")}
                      />
                      <Label htmlFor="is_featured">Featured Vendor</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_eco_friendly"
                        checked={formData.is_eco_friendly || false}
                        onCheckedChange={handleCheckboxChange("is_eco_friendly")}
                      />
                      <Label htmlFor="is_eco_friendly">Eco-Friendly</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}
