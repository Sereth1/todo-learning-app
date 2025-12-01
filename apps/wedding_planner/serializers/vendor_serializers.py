"""
Serializers for Vendor management.

Includes:
- VendorCategorySerializer: Categories with sorting support
- VendorImageSerializer: Gallery images
- VendorOfferSerializer: Business offers and packages
- VendorSerializer: Full vendor details
- VendorListSerializer: Lightweight for list views
- VendorReviewSerializer: Customer reviews
- VendorQuoteSerializer: Quotes and contracts
- SavedVendorSerializer: Bookmarked vendors
"""

from rest_framework import serializers
from apps.wedding_planner.models import (
    VendorCategory, Vendor, VendorImage, VendorOffer,
    VendorReview, VendorQuote, SavedVendor
)


class VendorCategorySerializer(serializers.ModelSerializer):
    """
    Serializer for vendor categories.
    Categories are sorted by backend (featured first, then sort_order, then name).
    """
    vendor_count = serializers.SerializerMethodField()
    category_type_display = serializers.CharField(
        source='get_category_type_display', read_only=True
    )
    
    class Meta:
        model = VendorCategory
        fields = [
            "id",
            "uid",
            "name",
            "slug",
            "category_type",
            "category_type_display",
            "icon",
            "description",
            "sort_order",
            "is_active",
            "is_featured",
            "meta_title",
            "meta_description",
            "vendor_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "uid", "slug", "created_at", "updated_at"]
    
    def get_vendor_count(self, obj):
        """Count active vendors in this category"""
        return obj.vendors.filter(is_active=True).count()


class VendorCategoryListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for category dropdowns/lists.
    """
    vendor_count = serializers.SerializerMethodField()
    
    class Meta:
        model = VendorCategory
        fields = [
            "id",
            "name",
            "slug",
            "category_type",
            "icon",
            "vendor_count",
        ]
    
    def get_vendor_count(self, obj):
        return obj.vendors.filter(is_active=True).count()


class VendorImageSerializer(serializers.ModelSerializer):
    """Serializer for vendor gallery images"""
    image_type_display = serializers.CharField(
        source='get_image_type_display', read_only=True
    )
    
    class Meta:
        model = VendorImage
        fields = [
            "id",
            "uid",
            "vendor",
            "image",
            "image_type",
            "image_type_display",
            "caption",
            "alt_text",
            "sort_order",
            "is_featured",
            "created_at",
        ]
        read_only_fields = ["id", "uid", "created_at"]


class VendorOfferSerializer(serializers.ModelSerializer):
    """Serializer for vendor offers/packages"""
    offer_type_display = serializers.CharField(
        source='get_offer_type_display', read_only=True
    )
    discount_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = VendorOffer
        fields = [
            "id",
            "uid",
            "vendor",
            "name",
            "offer_type",
            "offer_type_display",
            "description",
            "price",
            "original_price",
            "discount_percentage",
            "currency",
            "includes",
            "excludes",
            "is_active",
            "is_featured",
            "valid_from",
            "valid_until",
            "terms_and_conditions",
            "deposit_required",
            "duration_hours",
            "sort_order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "uid", "discount_percentage", "created_at", "updated_at"]


class VendorOfferListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for offer lists"""
    discount_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = VendorOffer
        fields = [
            "id",
            "name",
            "offer_type",
            "price",
            "original_price",
            "discount_percentage",
            "currency",
            "is_featured",
        ]


class VendorSerializer(serializers.ModelSerializer):
    """
    Full serializer for vendor details.
    Includes nested images, offers, and computed fields.
    """
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    price_range_display = serializers.CharField(
        source='get_price_range_display', read_only=True
    )
    booking_status_display = serializers.CharField(
        source='get_booking_status_display', read_only=True
    )
    price_display = serializers.ReadOnlyField()
    
    # Nested data
    images = VendorImageSerializer(many=True, read_only=True)
    offers = VendorOfferSerializer(many=True, read_only=True)
    
    # Computed fields
    languages_list = serializers.SerializerMethodField()
    
    class Meta:
        model = Vendor
        fields = [
            # Basic info
            "id",
            "uid",
            "name",
            "slug",
            "category",
            "category_name",
            "category_slug",
            "tagline",
            "description",
            "primary_image",
            "primary_image_url",
            
            # Contact
            "email",
            "phone",
            "secondary_phone",
            "whatsapp",
            "website",
            
            # Social media
            "facebook_url",
            "instagram_url",
            "tiktok_url",
            "youtube_url",
            "pinterest_url",
            
            # Location
            "address",
            "address_line_2",
            "city",
            "state",
            "country",
            "postal_code",
            "latitude",
            "longitude",
            "service_area",
            
            # Pricing
            "price_range",
            "price_range_display",
            "min_price",
            "max_price",
            "price_display",
            "currency",
            "deposit_percentage",
            
            # Capacity
            "min_capacity",
            "max_capacity",
            
            # Booking
            "booking_status",
            "booking_status_display",
            "lead_time_days",
            
            # Business hours
            "business_hours",
            
            # Credentials
            "years_in_business",
            "licenses",
            "awards",
            "insurance_info",
            "languages_spoken",
            "languages_list",
            
            # Ratings
            "average_rating",
            "review_count",
            
            # Status
            "is_verified",
            "is_featured",
            "is_active",
            "accepts_credit_card",
            "offers_payment_plan",
            
            # Sustainability
            "is_eco_friendly",
            "eco_certifications",
            
            # Sorting
            "sort_order",
            
            # Nested
            "images",
            "offers",
            
            # Timestamps
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id", "uid", "slug", "average_rating", "review_count",
            "created_at", "updated_at"
        ]
    
    def get_languages_list(self, obj):
        """Convert comma-separated languages to list"""
        if obj.languages_spoken:
            return [lang.strip() for lang in obj.languages_spoken.split(",")]
        return []


class VendorListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for vendor lists.
    Used for list views to reduce payload size.
    """
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    price_range_display = serializers.CharField(
        source='get_price_range_display', read_only=True
    )
    price_display = serializers.ReadOnlyField()
    offer_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Vendor
        fields = [
            "id",
            "uid",
            "name",
            "slug",
            "category",
            "category_name",
            "category_slug",
            "tagline",
            "primary_image",
            "primary_image_url",
            "city",
            "country",
            "price_range",
            "price_range_display",
            "min_price",
            "max_price",
            "price_display",
            "currency",
            "average_rating",
            "review_count",
            "is_verified",
            "is_featured",
            "is_eco_friendly",
            "booking_status",
            "offer_count",
        ]
    
    def get_offer_count(self, obj):
        return obj.offers.filter(is_active=True).count()


class VendorCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating vendors"""
    
    class Meta:
        model = Vendor
        fields = [
            "name",
            "category",
            "tagline",
            "description",
            "primary_image",
            "primary_image_url",
            "email",
            "phone",
            "secondary_phone",
            "whatsapp",
            "website",
            "facebook_url",
            "instagram_url",
            "tiktok_url",
            "youtube_url",
            "pinterest_url",
            "address",
            "address_line_2",
            "city",
            "state",
            "country",
            "postal_code",
            "latitude",
            "longitude",
            "service_area",
            "price_range",
            "min_price",
            "max_price",
            "currency",
            "deposit_percentage",
            "min_capacity",
            "max_capacity",
            "booking_status",
            "lead_time_days",
            "business_hours",
            "years_in_business",
            "licenses",
            "awards",
            "insurance_info",
            "languages_spoken",
            "accepts_credit_card",
            "offers_payment_plan",
            "is_eco_friendly",
            "eco_certifications",
            "sort_order",
        ]
    
    def validate_category(self, value):
        """Ensure category is active"""
        if not value.is_active:
            raise serializers.ValidationError("Category is not active")
        return value


class VendorReviewSerializer(serializers.ModelSerializer):
    """Serializer for vendor reviews"""
    user_name = serializers.CharField(source='user.email', read_only=True)
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    
    class Meta:
        model = VendorReview
        fields = [
            "id",
            "uid",
            "vendor",
            "vendor_name",
            "user",
            "user_name",
            "rating",
            "title",
            "content",
            "helpful_count",
            "is_verified_purchase",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id", "uid", "user", "helpful_count", "is_verified_purchase",
            "created_at", "updated_at"
        ]
    
    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value


class VendorQuoteSerializer(serializers.ModelSerializer):
    """Serializer for vendor quotes"""
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = VendorQuote
        fields = [
            "id",
            "uid",
            "vendor",
            "vendor_name",
            "status",
            "status_display",
            "description",
            "quoted_amount",
            "deposit_amount",
            "deposit_due_date",
            "final_due_date",
            "notes",
            "contract_file",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "uid", "created_at", "updated_at"]


class SavedVendorSerializer(serializers.ModelSerializer):
    """Serializer for saved/bookmarked vendors"""
    vendor_detail = VendorListSerializer(source='vendor', read_only=True)
    
    class Meta:
        model = SavedVendor
        fields = [
            "id",
            "uid",
            "vendor",
            "vendor_detail",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "uid", "created_at"]


class VendorDashboardSerializer(serializers.Serializer):
    """
    Combined dashboard endpoint serializer.
    Returns vendors, categories, and stats in one call.
    """
    categories = VendorCategoryListSerializer(many=True)
    featured_vendors = VendorListSerializer(many=True)
    stats = serializers.DictField()
