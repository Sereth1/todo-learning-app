"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { VendorCategoryListItem, VendorPriceRange, VendorBookingStatus } from "@/types";
import { createVendor, getVendorCategories } from "@/actions/vendors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  Building2,
  MapPin,
  DollarSign,
  Globe,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Clock,
} from "lucide-react";

const priceRanges: { value: VendorPriceRange; label: string }[] = [
  { value: "$", label: "Budget ($)" },
  { value: "$$", label: "Moderate ($$)" },
  { value: "$$$", label: "Premium ($$$)" },
  { value: "$$$$", label: "Luxury ($$$$)" },
];

const bookingStatuses: { value: VendorBookingStatus; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "limited", label: "Limited Availability" },
  { value: "booked", label: "Fully Booked" },
];

interface BusinessHours {
  [key: string]: { open: string; close: string; closed: boolean };
}

const defaultBusinessHours: BusinessHours = {
  monday: { open: "09:00", close: "18:00", closed: false },
  tuesday: { open: "09:00", close: "18:00", closed: false },
  wednesday: { open: "09:00", close: "18:00", closed: false },
  thursday: { open: "09:00", close: "18:00", closed: false },
  friday: { open: "09:00", close: "18:00", closed: false },
  saturday: { open: "10:00", close: "16:00", closed: false },
  sunday: { open: "", close: "", closed: true },
};

interface FormData {
  name: string;
  category: number;
  tagline: string;
  description: string;
  primary_image: string;
  email: string;
  phone: string;
  website: string;
  address_line1: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  price_range: VendorPriceRange;
  min_price: string;
  max_price: string;
  currency: string;
  booking_status: VendorBookingStatus;
  instagram_url: string;
  facebook_url: string;
  is_verified: boolean;
  is_featured: boolean;
  is_eco_friendly: boolean;
  business_hours: BusinessHours;
}

export default function NewVendorPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<VendorCategoryListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const [formData, setFormData] = useState<FormData>({
    name: "",
    category: 0,
    tagline: "",
    description: "",
    primary_image: "",
    email: "",
    phone: "",
    website: "",
    address_line1: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    price_range: "$$",
    min_price: "",
    max_price: "",
    currency: "EUR",
    booking_status: "available",
    instagram_url: "",
    facebook_url: "",
    is_verified: false,
    is_featured: false,
    is_eco_friendly: false,
    business_hours: defaultBusinessHours,
  });

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      const result = await getVendorCategories({ compact: true });
      if (result.success && result.data) {
        setCategories(result.data as unknown as VendorCategoryListItem[]);
      }
      setIsLoading(false);
    }
    loadCategories();
  }, []);

  // Handle input change
  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  // Handle select change
  const handleSelectChange = useCallback((name: string, value: string) => {
    if (name === "category") {
      setFormData(prev => ({ ...prev, category: parseInt(value) }));
    } else if (name === "price_range") {
      setFormData(prev => ({ ...prev, price_range: value as VendorPriceRange }));
    } else if (name === "booking_status") {
      setFormData(prev => ({ ...prev, booking_status: value as VendorBookingStatus }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  // Handle switch change
  const handleSwitchChange = useCallback((name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  }, []);

  // Handle business hours change
  const handleBusinessHoursChange = useCallback((
    day: string, 
    field: "open" | "close" | "closed", 
    value: string | boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: {
          ...prev.business_hours[day],
          [field]: value,
        },
      },
    }));
  }, []);

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Vendor name is required");
      return;
    }
    if (!formData.category) {
      toast.error("Please select a category");
      return;
    }

    setIsSubmitting(true);
    
    // Build the data to send
    const submitData = {
      name: formData.name,
      category: formData.category,
      tagline: formData.tagline || undefined,
      description: formData.description || undefined,
      primary_image_url: formData.primary_image || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      website: formData.website || undefined,
      address_line1: formData.address_line1 || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      postal_code: formData.postal_code || undefined,
      country: formData.country || undefined,
      price_range: formData.price_range,
      min_price: formData.min_price ? parseFloat(formData.min_price) : undefined,
      max_price: formData.max_price ? parseFloat(formData.max_price) : undefined,
      currency: formData.currency,
      booking_status: formData.booking_status,
      instagram_url: formData.instagram_url || undefined,
      facebook_url: formData.facebook_url || undefined,
      is_verified: formData.is_verified,
      is_featured: formData.is_featured,
      is_eco_friendly: formData.is_eco_friendly,
      business_hours: formData.business_hours,
    };
    
    const result = await createVendor(submitData);
    
    if (result.success && result.data) {
      toast.success("Vendor created successfully!");
      router.push(`/dashboard/vendors/${result.data.id}`);
    } else {
      toast.error(result.error || "Failed to create vendor");
    }
    
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/vendors">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Vendor</h1>
            <p className="text-gray-500">Create a new vendor for your wedding</p>
          </div>
        </div>
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-rose-500 hover:bg-rose-600"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? "Creating..." : "Create Vendor"}
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="social">Social & Hours</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Enter the basic details of the vendor
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Vendor Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g., Elegant Photography Studio"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category?.toString() || ""}
                      onValueChange={(value) => handleSelectChange("category", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
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
                    placeholder="e.g., Capturing your special moments"
                    value={formData.tagline}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe the services, experience, and what makes them special..."
                    value={formData.description}
                    onChange={handleChange}
                    rows={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primary_image">Primary Image URL</Label>
                  <Input
                    id="primary_image"
                    name="primary_image"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={formData.primary_image}
                    onChange={handleChange}
                  />
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <Label htmlFor="is_verified">Verified</Label>
                    <Switch
                      id="is_verified"
                      checked={formData.is_verified}
                      onCheckedChange={(checked) => handleSwitchChange("is_verified", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <Label htmlFor="is_featured">Featured</Label>
                    <Switch
                      id="is_featured"
                      checked={formData.is_featured}
                      onCheckedChange={(checked) => handleSwitchChange("is_featured", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <Label htmlFor="is_eco_friendly">Eco-Friendly</Label>
                    <Switch
                      id="is_eco_friendly"
                      checked={formData.is_eco_friendly}
                      onCheckedChange={(checked) => handleSwitchChange("is_eco_friendly", checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="contact@vendor.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={formData.phone}
                        onChange={handleChange}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="website"
                      name="website"
                      type="url"
                      placeholder="https://www.vendor-website.com"
                      value={formData.website}
                      onChange={handleChange}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Location Tab */}
          <TabsContent value="location" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location Details
                </CardTitle>
                <CardDescription>
                  Where is this vendor located?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address_line1">Address</Label>
                  <Input
                    id="address_line1"
                    name="address_line1"
                    placeholder="123 Main Street"
                    value={formData.address_line1}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="Athens"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Region</Label>
                    <Input
                      id="state"
                      name="state"
                      placeholder="Attica"
                      value={formData.state}
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
                      placeholder="10557"
                      value={formData.postal_code}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      name="country"
                      placeholder="Greece"
                      value={formData.country}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing Information
                </CardTitle>
                <CardDescription>
                  Set the pricing details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price_range">Price Range</Label>
                    <Select
                      value={formData.price_range}
                      onValueChange={(value) => handleSelectChange("price_range", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select price range" />
                      </SelectTrigger>
                      <SelectContent>
                        {priceRanges.map((range) => (
                          <SelectItem key={range.value} value={range.value}>
                            {range.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) => handleSelectChange("currency", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min_price">Minimum Price</Label>
                    <Input
                      id="min_price"
                      name="min_price"
                      type="number"
                      placeholder="500"
                      value={formData.min_price}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_price">Maximum Price</Label>
                    <Input
                      id="max_price"
                      name="max_price"
                      type="number"
                      placeholder="5000"
                      value={formData.max_price}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="booking_status">Booking Status</Label>
                  <Select
                    value={formData.booking_status}
                    onValueChange={(value) => handleSelectChange("booking_status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {bookingStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social & Hours Tab */}
          <TabsContent value="social" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Instagram className="h-5 w-5" />
                  Social Media
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instagram_url">Instagram</Label>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="instagram_url"
                        name="instagram_url"
                        placeholder="https://instagram.com/vendor"
                        value={formData.instagram_url}
                        onChange={handleChange}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebook_url">Facebook</Label>
                    <div className="relative">
                      <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="facebook_url"
                        name="facebook_url"
                        placeholder="https://facebook.com/vendor"
                        value={formData.facebook_url}
                        onChange={handleChange}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Business Hours
                </CardTitle>
                <CardDescription>
                  Set the operating hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(formData.business_hours).map(([day, hours]) => (
                    <div key={day} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="w-24 font-medium capitalize">{day}</div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!hours.closed}
                          onCheckedChange={(checked) => 
                            handleBusinessHoursChange(day, "closed", !checked)
                          }
                        />
                        <span className="text-sm text-gray-500">
                          {hours.closed ? "Closed" : "Open"}
                        </span>
                      </div>
                      {!hours.closed && (
                        <>
                          <Input
                            type="time"
                            value={hours.open}
                            onChange={(e) => 
                              handleBusinessHoursChange(day, "open", e.target.value)
                            }
                            className="w-32"
                          />
                          <span>to</span>
                          <Input
                            type="time"
                            value={hours.close}
                            onChange={(e) => 
                              handleBusinessHoursChange(day, "close", e.target.value)
                            }
                            className="w-32"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bottom action bar */}
        <div className="flex justify-end gap-3 pt-6 border-t mt-6">
          <Link href="/dashboard/vendors">
            <Button variant="outline" type="button">Cancel</Button>
          </Link>
          <Button 
            type="submit"
            disabled={isSubmitting}
            className="bg-rose-500 hover:bg-rose-600"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Creating..." : "Create Vendor"}
          </Button>
        </div>
      </form>
    </div>
  );
}
