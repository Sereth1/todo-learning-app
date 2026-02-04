from django.contrib import admin
from .models import (
    # Core guest management
    Guest,
    Child,
    Gender,
    GuestsMax,
    
    # Event and venue
    WeddingEvent,
    Table,
    SeatingAssignment,
    
    # Meal management
    DietaryRestriction,
    MealChoice,
    GuestMealSelection,
    
    # Wedding
    Wedding,
    
    # Vendor management
    VendorCategory,
    Vendor,
    VendorImage,
    VendorOffer,
    VendorReview,
    VendorQuote,
    SavedVendor,
)


@admin.register(Wedding)
class WeddingAdmin(admin.ModelAdmin):
    list_display = ["display_name", "slug", "wedding_date", "status", "owner"]
    list_filter = ["status"]
    search_fields = ["partner1_name", "partner2_name", "slug"]
    readonly_fields = ["uid", "public_code", "created_at", "updated_at"]


@admin.register(Guest)
class GuestAdmin(admin.ModelAdmin):
    list_display = ["first_name", "last_name", "email", "attendance_status", "wedding"]
    list_filter = ["attendance_status", "is_plus_one_coming", "has_children", "wedding"]
    search_fields = ["first_name", "last_name", "email"]
    readonly_fields = ["user_code", "uid", "created_at", "updated_at"]


@admin.register(Child)
class ChildAdmin(admin.ModelAdmin):
    list_display = ["first_name", "age", "guest"]
    search_fields = ["first_name", "guest__first_name", "guest__last_name"]


@admin.register(Gender)
class GenderAdmin(admin.ModelAdmin):
    list_display = ["gender"]


@admin.register(GuestsMax)
class GuestsMaxAdmin(admin.ModelAdmin):
    list_display = ["max_allowed"]


@admin.register(WeddingEvent)
class WeddingEventAdmin(admin.ModelAdmin):
    list_display = ["name", "wedding", "event_date", "venue_name"]
    list_filter = ["wedding"]
    search_fields = ["name", "venue_name"]
    readonly_fields = ["uid", "created_at", "updated_at"]


@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = ["name", "wedding", "capacity"]
    list_filter = ["wedding"]
    search_fields = ["name"]
    readonly_fields = ["uid", "created_at", "updated_at"]


@admin.register(SeatingAssignment)
class SeatingAssignmentAdmin(admin.ModelAdmin):
    list_display = ["guest", "table"]
    list_filter = ["table__wedding"]
    search_fields = ["guest__first_name", "guest__last_name", "table__name"]
    readonly_fields = ["uid", "created_at", "updated_at"]


@admin.register(DietaryRestriction)
class DietaryRestrictionAdmin(admin.ModelAdmin):
    list_display = ["name"]
    search_fields = ["name"]


@admin.register(MealChoice)
class MealChoiceAdmin(admin.ModelAdmin):
    list_display = ["name", "wedding", "meal_type", "is_available"]
    list_filter = ["wedding", "meal_type", "is_available"]
    search_fields = ["name"]
    readonly_fields = ["uid", "created_at", "updated_at"]


@admin.register(GuestMealSelection)
class GuestMealSelectionAdmin(admin.ModelAdmin):
    list_display = ["guest", "meal_choice"]
    search_fields = ["guest__first_name", "guest__last_name"]
    readonly_fields = ["uid", "created_at", "updated_at"]


# =============================================================================
# Vendor Management Admin
# =============================================================================

class VendorImageInline(admin.TabularInline):
    model = VendorImage
    extra = 1
    fields = ["image", "image_type", "caption", "sort_order", "is_featured"]


class VendorOfferInline(admin.TabularInline):
    model = VendorOffer
    extra = 1
    fields = ["name", "offer_type", "price", "is_active", "is_featured", "sort_order"]


@admin.register(VendorCategory)
class VendorCategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "category_type", "icon", "sort_order", "is_featured", "is_active"]
    list_filter = ["category_type", "is_featured", "is_active"]
    list_editable = ["sort_order", "is_featured", "is_active"]
    search_fields = ["name", "description"]
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ["uid", "created_at", "updated_at"]
    ordering = ["-is_featured", "sort_order", "name"]


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = [
        "name", "category", "city", "price_range", 
        "average_rating", "is_verified", "is_featured", "is_active"
    ]
    list_filter = [
        "category", "category__category_type", "city", "country",
        "price_range", "is_verified", "is_featured", "is_active",
        "is_eco_friendly", "booking_status"
    ]
    list_editable = ["is_verified", "is_featured", "is_active"]
    search_fields = ["name", "description", "city", "tagline"]
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ["uid", "average_rating", "review_count", "created_at", "updated_at"]
    inlines = [VendorImageInline, VendorOfferInline]
    
    fieldsets = (
        ("Basic Info", {
            "fields": ("name", "slug", "category", "tagline", "description", "primary_image")
        }),
        ("Contact Info", {
            "fields": ("email", "phone", "secondary_phone", "whatsapp", "website")
        }),
        ("Social Media", {
            "fields": ("facebook_url", "instagram_url", "tiktok_url", "youtube_url", "pinterest_url"),
            "classes": ("collapse",)
        }),
        ("Location", {
            "fields": (
                "address", "address_line_2", "city", "state", "country", 
                "postal_code", "latitude", "longitude", "service_area"
            )
        }),
        ("Pricing", {
            "fields": (
                "price_range", "min_price", "max_price", "currency",
                "deposit_percentage", "accepts_credit_card", "offers_payment_plan"
            )
        }),
        ("Capacity & Booking", {
            "fields": ("min_capacity", "max_capacity", "booking_status", "lead_time_days")
        }),
        ("Business Details", {
            "fields": (
                "business_hours", "years_in_business", "licenses", 
                "awards", "insurance_info", "languages_spoken"
            ),
            "classes": ("collapse",)
        }),
        ("Ratings & Status", {
            "fields": (
                "average_rating", "review_count", "is_verified", 
                "is_featured", "is_active", "sort_order"
            )
        }),
        ("Sustainability", {
            "fields": ("is_eco_friendly", "eco_certifications"),
            "classes": ("collapse",)
        }),
        ("Timestamps", {
            "fields": ("uid", "created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )


@admin.register(VendorImage)
class VendorImageAdmin(admin.ModelAdmin):
    list_display = ["vendor", "image_type", "caption", "sort_order", "is_featured"]
    list_filter = ["vendor__category", "image_type", "is_featured"]
    search_fields = ["vendor__name", "caption"]
    readonly_fields = ["uid", "created_at", "updated_at"]


@admin.register(VendorOffer)
class VendorOfferAdmin(admin.ModelAdmin):
    list_display = ["name", "vendor", "offer_type", "price", "is_active", "is_featured"]
    list_filter = ["vendor__category", "offer_type", "is_active", "is_featured"]
    list_editable = ["is_active", "is_featured"]
    search_fields = ["name", "vendor__name", "description"]
    readonly_fields = ["uid", "created_at", "updated_at"]


@admin.register(VendorReview)
class VendorReviewAdmin(admin.ModelAdmin):
    list_display = ["vendor", "user", "rating", "title", "helpful_count", "created_at"]
    list_filter = ["vendor__category", "rating", "is_verified_purchase"]
    search_fields = ["vendor__name", "user__email", "title", "content"]
    readonly_fields = ["uid", "created_at", "updated_at"]


@admin.register(VendorQuote)
class VendorQuoteAdmin(admin.ModelAdmin):
    list_display = ["vendor", "user", "status", "quoted_amount", "created_at"]
    list_filter = ["status", "vendor__category"]
    search_fields = ["vendor__name", "user__email", "description"]
    readonly_fields = ["uid", "created_at", "updated_at"]


@admin.register(SavedVendor)
class SavedVendorAdmin(admin.ModelAdmin):
    list_display = ["user", "vendor", "created_at"]
    list_filter = ["vendor__category"]
    search_fields = ["user__email", "vendor__name"]
    readonly_fields = ["uid", "created_at"]
