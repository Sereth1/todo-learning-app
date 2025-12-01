from django.db import models
from django.conf import settings
from config.models import TimeStampedBaseModel


class VendorCategory(TimeStampedBaseModel):
    """
    Categories for vendors organized by wedding service type.
    
    Wedding Vendor Categories:
    - Venues: Church, Ceremony Venue, Reception Venue, Outdoor Venue
    - Photography & Video: Photographer, Videographer, Photo Booth
    - Food & Beverage: Catering, Bakery/Cake, Bar Service, Coffee/Beverage
    - Beauty: Hair & Makeup, Spa Services
    - Decor & Flowers: Florist, Decorator, Lighting, Rentals
    - Entertainment: DJ, Live Band, MC/Host, Musicians
    - Planning & Coordination: Wedding Planner, Day-of Coordinator
    - Fashion: Bridal Shop, Groom Attire, Bridesmaids, Accessories
    - Stationery: Invitations, Calligraphy, Signage
    - Transportation: Limousine, Shuttle, Classic Cars
    - Officiant & Legal: Officiant, Marriage License Services
    - Gifts & Favors: Party Favors, Gift Shop
    - Accommodation: Hotels, Guest Houses
    - Honeymoon: Travel Agency, Resort
    - Other Services: Security, Childcare, Pet Services
    """
    
    class CategoryType(models.TextChoices):
        VENUE = "venue", "Venue"
        PHOTOGRAPHY = "photography", "Photography & Video"
        CATERING = "catering", "Food & Beverage"
        BEAUTY = "beauty", "Beauty & Wellness"
        DECOR = "decor", "Decor & Flowers"
        ENTERTAINMENT = "entertainment", "Entertainment"
        PLANNING = "planning", "Planning & Coordination"
        FASHION = "fashion", "Fashion & Attire"
        STATIONERY = "stationery", "Stationery & Print"
        TRANSPORTATION = "transportation", "Transportation"
        OFFICIANT = "officiant", "Officiant & Legal"
        GIFTS = "gifts", "Gifts & Favors"
        ACCOMMODATION = "accommodation", "Accommodation"
        HONEYMOON = "honeymoon", "Honeymoon & Travel"
        OTHER = "other", "Other Services"
    
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    category_type = models.CharField(
        max_length=20,
        choices=CategoryType.choices,
        default=CategoryType.OTHER,
        help_text="Parent category type for grouping"
    )
    icon = models.CharField(max_length=50, blank=True, help_text="Icon name (lucide/heroicons) or emoji")
    description = models.TextField(blank=True)
    
    # Sorting - lower number = higher priority (displayed first)
    sort_order = models.PositiveIntegerField(
        default=100,
        help_text="Sort order for display (lower = first). Backend handles sorting."
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False, help_text="Featured categories shown first")
    
    # SEO
    meta_title = models.CharField(max_length=60, blank=True)
    meta_description = models.CharField(max_length=160, blank=True)
    
    class Meta:
        verbose_name = "Vendor Category"
        verbose_name_plural = "Vendor Categories"
        # Backend sorting: featured first, then by sort_order, then by name
        ordering = ["-is_featured", "sort_order", "name"]
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        # Auto-generate slug from name if not provided
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Vendor(TimeStampedBaseModel):
    """
    Vendor/Business profiles for wedding services.
    
    Supports multiple businesses per category with:
    - Location and contact information
    - Pricing and packages
    - Business hours
    - Social media links
    - Image gallery
    - Customer reviews
    """
    
    class PriceRange(models.TextChoices):
        BUDGET = "$", "Budget"
        MODERATE = "$$", "Moderate"
        PREMIUM = "$$$", "Premium"
        LUXURY = "$$$$", "Luxury"
    
    class BookingStatus(models.TextChoices):
        AVAILABLE = "available", "Available"
        LIMITED = "limited", "Limited Availability"
        BOOKED = "booked", "Fully Booked"
    
    # Basic info
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, blank=True)
    category = models.ForeignKey(
        VendorCategory,
        on_delete=models.CASCADE,
        related_name="vendors"
    )
    tagline = models.CharField(
        max_length=200, 
        blank=True, 
        help_text="Short catchy description (e.g., 'Capturing your love story')"
    )
    description = models.TextField(blank=True)
    
    # Primary image (single image upload or URL)
    primary_image = models.ImageField(
        upload_to="vendors/images/",
        blank=True,
        null=True,
        help_text="Main vendor image/logo (file upload)"
    )
    primary_image_url = models.URLField(
        blank=True,
        help_text="Main vendor image URL (external link)"
    )
    
    # Contact info
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    secondary_phone = models.CharField(max_length=30, blank=True)
    whatsapp = models.CharField(max_length=30, blank=True)
    website = models.URLField(blank=True)
    
    # Social media
    facebook_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)
    tiktok_url = models.URLField(blank=True)
    youtube_url = models.URLField(blank=True)
    pinterest_url = models.URLField(blank=True)
    
    # Location for geolocation search
    address = models.TextField(blank=True)
    address_line_2 = models.CharField(max_length=200, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, default="Thailand")
    postal_code = models.CharField(max_length=20, blank=True)
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True
    )
    service_area = models.TextField(
        blank=True, 
        help_text="Areas where vendor provides service (e.g., 'Bangkok, Phuket, Chiang Mai')"
    )
    
    # Business details & pricing
    price_range = models.CharField(
        max_length=20,
        choices=PriceRange.choices,
        blank=True
    )
    min_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        help_text="Starting price for services"
    )
    max_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        help_text="Maximum price for services"
    )
    currency = models.CharField(max_length=3, default="THB")
    deposit_percentage = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Required deposit percentage (e.g., 50)"
    )
    
    # Capacity (for venues)
    min_capacity = models.PositiveIntegerField(null=True, blank=True)
    max_capacity = models.PositiveIntegerField(null=True, blank=True)
    
    # Booking status
    booking_status = models.CharField(
        max_length=20,
        choices=BookingStatus.choices,
        default=BookingStatus.AVAILABLE
    )
    lead_time_days = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Minimum days notice required for booking"
    )
    
    # Business hours (JSON field for flexibility)
    business_hours = models.JSONField(
        default=dict,
        blank=True,
        help_text="""
        Format: {"monday": {"open": "09:00", "close": "18:00", "closed": false}, ...}
        """
    )
    
    # Experience & credentials
    years_in_business = models.PositiveIntegerField(null=True, blank=True)
    licenses = models.TextField(blank=True, help_text="Business licenses, certifications")
    awards = models.TextField(blank=True, help_text="Awards and recognition")
    insurance_info = models.TextField(blank=True)
    
    # Languages
    languages_spoken = models.CharField(
        max_length=200, 
        blank=True,
        help_text="Comma-separated list (e.g., 'Thai, English, Chinese')"
    )
    
    # Ratings
    average_rating = models.DecimalField(
        max_digits=3, decimal_places=2, default=0
    )
    review_count = models.PositiveIntegerField(default=0)
    
    # Status flags
    is_verified = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    accepts_credit_card = models.BooleanField(default=True)
    offers_payment_plan = models.BooleanField(default=False)
    
    # Sustainability
    is_eco_friendly = models.BooleanField(default=False)
    eco_certifications = models.TextField(blank=True)
    
    # Sorting for display
    sort_order = models.PositiveIntegerField(default=100)
    
    class Meta:
        verbose_name = "Vendor"
        verbose_name_plural = "Vendors"
        # Backend sorting: featured first, then by rating, then by sort_order
        ordering = ["-is_featured", "-average_rating", "sort_order", "name"]
        indexes = [
            models.Index(fields=["category", "is_active"]),
            models.Index(fields=["city", "country"]),
            models.Index(fields=["-average_rating"]),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.category.name})"
    
    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    @property
    def price_display(self):
        """Display formatted price range"""
        if self.min_price and self.max_price:
            return f"{self.currency} {self.min_price:,.0f} - {self.max_price:,.0f}"
        elif self.min_price:
            return f"From {self.currency} {self.min_price:,.0f}"
        elif self.max_price:
            return f"Up to {self.currency} {self.max_price:,.0f}"
        return self.get_price_range_display() if self.price_range else "Contact for price"
    
    def update_rating(self):
        """Recalculate average rating from reviews"""
        from django.db.models import Avg
        result = self.reviews.aggregate(avg_rating=Avg("rating"))
        self.average_rating = result["avg_rating"] or 0
        self.review_count = self.reviews.count()
        self.save(update_fields=["average_rating", "review_count"])


class VendorImage(TimeStampedBaseModel):
    """
    Gallery images for vendors.
    Allows multiple images per vendor.
    """
    
    class ImageType(models.TextChoices):
        GALLERY = "gallery", "Gallery"
        PORTFOLIO = "portfolio", "Portfolio"
        VENUE = "venue", "Venue"
        FOOD = "food", "Food"
        TEAM = "team", "Team"
        CERTIFICATE = "certificate", "Certificate"
        OTHER = "other", "Other"
    
    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="images"
    )
    image = models.ImageField(upload_to="vendors/gallery/")
    image_type = models.CharField(
        max_length=20,
        choices=ImageType.choices,
        default=ImageType.GALLERY
    )
    caption = models.CharField(max_length=200, blank=True)
    alt_text = models.CharField(max_length=200, blank=True)
    sort_order = models.PositiveIntegerField(default=100)
    is_featured = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = "Vendor Image"
        verbose_name_plural = "Vendor Images"
        ordering = ["-is_featured", "sort_order"]
    
    def __str__(self):
        return f"{self.vendor.name} - {self.image_type}"


class VendorOffer(TimeStampedBaseModel):
    """
    Business offers, packages, and services offered by vendors.
    Each vendor can have multiple offers/packages.
    """
    
    class OfferType(models.TextChoices):
        PACKAGE = "package", "Package"
        SERVICE = "service", "Individual Service"
        PROMO = "promo", "Promotion"
        BUNDLE = "bundle", "Bundle Deal"
        ADDON = "addon", "Add-on"
    
    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="offers"
    )
    
    name = models.CharField(max_length=200)
    offer_type = models.CharField(
        max_length=20,
        choices=OfferType.choices,
        default=OfferType.PACKAGE
    )
    description = models.TextField()
    
    # Pricing
    price = models.DecimalField(max_digits=12, decimal_places=2)
    original_price = models.DecimalField(
        max_digits=12, decimal_places=2, 
        null=True, blank=True,
        help_text="Original price before discount (for promos)"
    )
    currency = models.CharField(max_length=3, default="THB")
    
    # Package details (what's included)
    includes = models.JSONField(
        default=list,
        help_text="""
        List of included items/services. Format:
        ["8 hours coverage", "2 photographers", "500 edited photos", "Online gallery"]
        """
    )
    excludes = models.JSONField(
        default=list,
        help_text="List of items NOT included"
    )
    
    # Validity
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    valid_from = models.DateField(null=True, blank=True)
    valid_until = models.DateField(null=True, blank=True)
    
    # Terms
    terms_and_conditions = models.TextField(blank=True)
    deposit_required = models.DecimalField(
        max_digits=12, decimal_places=2, 
        null=True, blank=True
    )
    
    # For packages with duration (e.g., photography hours)
    duration_hours = models.PositiveIntegerField(null=True, blank=True)
    
    # Sorting
    sort_order = models.PositiveIntegerField(default=100)
    
    class Meta:
        verbose_name = "Vendor Offer"
        verbose_name_plural = "Vendor Offers"
        ordering = ["-is_featured", "sort_order", "price"]
    
    def __str__(self):
        return f"{self.vendor.name} - {self.name}"
    
    @property
    def discount_percentage(self):
        """Calculate discount percentage if original price is set"""
        if self.original_price and self.original_price > self.price:
            return int(((self.original_price - self.price) / self.original_price) * 100)
        return 0


class VendorReview(TimeStampedBaseModel):
    """Reviews for vendors"""
    
    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="reviews"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="vendor_reviews"
    )
    rating = models.PositiveIntegerField(
        choices=[(i, str(i)) for i in range(1, 6)]
    )
    title = models.CharField(max_length=200, blank=True)
    content = models.TextField()
    
    # Helpful votes
    helpful_count = models.PositiveIntegerField(default=0)
    
    is_verified_purchase = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = "Vendor Review"
        verbose_name_plural = "Vendor Reviews"
        ordering = ["-created_at"]
        unique_together = ["vendor", "user"]
    
    def __str__(self):
        return f"{self.vendor.name} - {self.rating}★ by {self.user}"


class VendorQuote(TimeStampedBaseModel):
    """Store vendor quotes and contracts"""
    
    class QuoteStatus(models.TextChoices):
        REQUESTED = "requested", "Requested"
        RECEIVED = "received", "Received"
        NEGOTIATING = "negotiating", "Negotiating"
        ACCEPTED = "accepted", "Accepted"
        REJECTED = "rejected", "Rejected"
    
    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="quotes"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="vendor_quotes"
    )
    
    status = models.CharField(
        max_length=20,
        choices=QuoteStatus.choices,
        default=QuoteStatus.REQUESTED
    )
    
    description = models.TextField(help_text="What services are being quoted")
    quoted_amount = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    deposit_amount = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    deposit_due_date = models.DateField(null=True, blank=True)
    final_due_date = models.DateField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    contract_file = models.FileField(
        upload_to="vendor_contracts/",
        blank=True
    )
    
    class Meta:
        verbose_name = "Vendor Quote"
        verbose_name_plural = "Vendor Quotes"
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"Quote from {self.vendor.name} - {self.status}"


class SavedVendor(TimeStampedBaseModel):
    """Vendors saved/bookmarked by users"""
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="saved_vendors"
    )
    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name="saved_by"
    )
    notes = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Saved Vendor"
        verbose_name_plural = "Saved Vendors"
        unique_together = ["user", "vendor"]
    
    def __str__(self):
        return f"{self.user} saved {self.vendor.name}"
