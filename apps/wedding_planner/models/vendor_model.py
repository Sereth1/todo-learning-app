from django.db import models
from django.conf import settings
from config.models import TimeStampedBaseModel


class VendorCategory(TimeStampedBaseModel):
    """Categories for vendors (Florist, Caterer, Photographer, etc.)"""
    
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Icon name or emoji")
    description = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Vendor Category"
        verbose_name_plural = "Vendor Categories"
        ordering = ["name"]
    
    def __str__(self):
        return self.name


class Vendor(TimeStampedBaseModel):
    """Vendor profiles for wedding services"""
    
    name = models.CharField(max_length=200)
    category = models.ForeignKey(
        VendorCategory,
        on_delete=models.CASCADE,
        related_name="vendors"
    )
    description = models.TextField(blank=True)
    
    # Contact info
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    website = models.URLField(blank=True)
    
    # Location for geolocation search
    address = models.TextField(blank=True)
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
    
    # Business details
    price_range = models.CharField(
        max_length=20,
        choices=[
            ("$", "Budget"),
            ("$$", "Moderate"),
            ("$$$", "Premium"),
            ("$$$$", "Luxury"),
        ],
        blank=True
    )
    min_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    max_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    
    # Ratings
    average_rating = models.DecimalField(
        max_digits=3, decimal_places=2, default=0
    )
    review_count = models.PositiveIntegerField(default=0)
    
    # Status
    is_verified = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    # Sustainability
    is_eco_friendly = models.BooleanField(default=False)
    eco_certifications = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Vendor"
        verbose_name_plural = "Vendors"
        ordering = ["-is_featured", "-average_rating", "name"]
    
    def __str__(self):
        return f"{self.name} ({self.category.name})"


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
