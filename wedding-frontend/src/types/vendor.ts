// Vendor Types

export type VendorCategoryType =
  | "venue"
  | "photography"
  | "catering"
  | "beauty"
  | "decor"
  | "entertainment"
  | "planning"
  | "fashion"
  | "stationery"
  | "transportation"
  | "officiant"
  | "gifts"
  | "accommodation"
  | "honeymoon"
  | "other";

export type VendorPriceRange = "$" | "$$" | "$$$" | "$$$$";
export type VendorBookingStatus = "available" | "limited" | "booked";
export type VendorOfferType = "package" | "service" | "promo" | "bundle" | "addon";
export type VendorImageType = "gallery" | "portfolio" | "venue" | "food" | "team" | "certificate" | "other";
export type VendorQuoteStatus = "requested" | "received" | "negotiating" | "accepted" | "rejected";

// Vendor Category
export interface VendorCategory {
  id: number;
  uid: string;
  name: string;
  slug: string;
  category_type: VendorCategoryType;
  category_type_display: string;
  icon: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  is_featured: boolean;
  meta_title: string;
  meta_description: string;
  vendor_count: number;
  created_at: string;
  updated_at: string;
}

export interface VendorCategoryListItem {
  id: number;
  name: string;
  slug: string;
  category_type: VendorCategoryType;
  icon: string;
  vendor_count: number;
}

// Vendor Image
export interface VendorImage {
  id: number;
  uid: string;
  vendor: number;
  image: string;
  image_type: VendorImageType;
  image_type_display: string;
  caption: string;
  alt_text: string;
  sort_order: number;
  is_featured: boolean;
  created_at: string;
}

// Vendor Offer/Package
export interface VendorOffer {
  id: number;
  uid: string;
  vendor: number;
  name: string;
  offer_type: VendorOfferType;
  offer_type_display: string;
  description: string;
  price: number;
  original_price?: number;
  discount_percentage: number;
  currency: string;
  includes: string[];
  excludes: string[];
  is_active: boolean;
  is_featured: boolean;
  valid_from?: string;
  valid_until?: string;
  terms_and_conditions: string;
  deposit_required?: number;
  duration_hours?: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface VendorOfferListItem {
  id: number;
  name: string;
  offer_type: VendorOfferType;
  price: number;
  original_price?: number;
  discount_percentage: number;
  currency: string;
  is_featured: boolean;
}

// Full Vendor
export interface Vendor {
  id: number;
  uid: string;
  name: string;
  slug: string;
  category: number;
  category_name: string;
  category_slug: string;
  tagline: string;
  description: string;
  primary_image?: string;
  primary_image_url?: string;

  // Contact
  email: string;
  phone: string;
  secondary_phone: string;
  whatsapp: string;
  website: string;

  // Social media
  facebook_url: string;
  instagram_url: string;
  tiktok_url: string;
  youtube_url: string;
  pinterest_url: string;

  // Location
  address: string;
  address_line_2: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  latitude?: number;
  longitude?: number;
  service_area: string;

  // Pricing
  price_range: VendorPriceRange;
  price_range_display: string;
  min_price?: number;
  max_price?: number;
  price_display: string;
  currency: string;
  deposit_percentage?: number;

  // Capacity
  min_capacity?: number;
  max_capacity?: number;

  // Booking
  booking_status: VendorBookingStatus;
  booking_status_display: string;
  lead_time_days?: number;

  // Business hours
  business_hours: Record<string, { open: string; close: string; closed: boolean }>;

  // Credentials
  years_in_business?: number;
  licenses: string;
  awards: string;
  insurance_info: string;
  languages_spoken: string;
  languages_list: string[];

  // Ratings
  average_rating: number;
  review_count: number;

  // Status
  is_verified: boolean;
  is_featured: boolean;
  is_active: boolean;
  accepts_credit_card: boolean;
  offers_payment_plan: boolean;

  // Sustainability
  is_eco_friendly: boolean;
  eco_certifications: string;

  // Sorting
  sort_order: number;

  // Nested data
  images: VendorImage[];
  offers: VendorOffer[];

  created_at: string;
  updated_at: string;
}

export interface VendorListItem {
  id: number;
  uid: string;
  name: string;
  slug: string;
  category: number;
  category_name: string;
  category_slug: string;
  tagline: string;
  primary_image?: string;
  primary_image_url?: string;
  city: string;
  country: string;
  price_range: VendorPriceRange;
  price_range_display: string;
  min_price?: number;
  max_price?: number;
  price_display: string;
  currency: string;
  average_rating: number;
  review_count: number;
  is_verified: boolean;
  is_featured: boolean;
  is_eco_friendly: boolean;
  booking_status: VendorBookingStatus;
  offer_count: number;
}

export interface VendorCreateData {
  name: string;
  category: number;
  tagline?: string;
  description?: string;
  primary_image?: File;
  primary_image_url?: string;
  email?: string;
  phone?: string;
  secondary_phone?: string;
  whatsapp?: string;
  website?: string;
  facebook_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
  youtube_url?: string;
  pinterest_url?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  state_province?: string;
  country?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  service_area?: string;
  price_range?: VendorPriceRange;
  min_price?: number;
  max_price?: number;
  price_min?: number;
  price_max?: number;
  currency?: string;
  deposit_percentage?: number;
  min_capacity?: number;
  max_capacity?: number;
  booking_status?: VendorBookingStatus;
  lead_time_days?: number;
  business_hours?: Record<string, { open: string; close: string; closed: boolean }>;
  years_in_business?: number;
  licenses?: string;
  awards?: string;
  insurance_info?: string;
  languages_spoken?: string;
  accepts_credit_card?: boolean;
  offers_payment_plan?: boolean;
  is_verified?: boolean;
  is_featured?: boolean;
  is_eco_friendly?: boolean;
  eco_certifications?: string;
  sort_order?: number;
}

// Vendor Review
export interface VendorReview {
  id: number;
  uid: string;
  vendor: number;
  vendor_name: string;
  user: number;
  user_name: string;
  rating: number;
  title: string;
  content: string;
  helpful_count: number;
  is_verified_purchase: boolean;
  created_at: string;
  updated_at: string;
}

export interface VendorReviewCreateData {
  vendor: number;
  rating: number;
  title?: string;
  content: string;
}

// Vendor Quote
export interface VendorQuote {
  id: number;
  uid: string;
  vendor: number;
  vendor_name: string;
  status: VendorQuoteStatus;
  status_display: string;
  description: string;
  quoted_amount?: number;
  deposit_amount?: number;
  deposit_due_date?: string;
  final_due_date?: string;
  notes: string;
  contract_file?: string;
  created_at: string;
  updated_at: string;
}

export interface VendorQuoteCreateData {
  vendor: number;
  description: string;
  notes?: string;
}

// Saved Vendor
export interface SavedVendor {
  id: number;
  uid: string;
  vendor: number;
  vendor_detail: VendorListItem;
  notes: string;
  created_at: string;
}

// Vendor Full Detail Response
export interface VendorFullData {
  vendor: Vendor;
  reviews: VendorReview[];
  is_saved: boolean;
}

// Vendor Dashboard Response
export interface VendorDashboardData {
  categories: VendorCategoryListItem[];
  featured_vendors: VendorListItem[];
  vendors: VendorListItem[];
  saved_vendor_ids: number[];
  stats: {
    total_vendors: number;
    total_categories: number;
    verified_vendors: number;
    eco_friendly_vendors: number;
    category_type_distribution: {
      type: VendorCategoryType;
      label: string;
      count: number;
    }[];
  };
}

// Vendor Filter Options
export interface VendorFilterOptions {
  categories: { id: number; name: string; slug: string }[];
  cities: string[];
  price_ranges: { value: string; label: string }[];
  booking_statuses: { value: string; label: string }[];
  sort_options: { value: string; label: string }[];
}

// Vendor Filters (for API calls)
export interface VendorFilters {
  category?: number;
  category_slug?: string;
  category_type?: VendorCategoryType;
  city?: string;
  country?: string;
  price_range?: VendorPriceRange;
  min_price?: number;
  max_price?: number;
  is_verified?: boolean;
  is_featured?: boolean;
  is_eco_friendly?: boolean;
  booking_status?: VendorBookingStatus;
  rating_min?: number;
  search?: string;
  sort_by?: "default" | "rating" | "price_low" | "price_high" | "name" | "newest" | "reviews";
}

// Category Filters
export interface VendorCategoryFilters {
  category_type?: VendorCategoryType;
  is_featured?: boolean;
  search?: string;
  compact?: boolean;
}
