from django.db import models
from django.conf import settings
from config.models import TimeStampedBaseModel
import uuid


class WeddingWebsite(TimeStampedBaseModel):
    """Public wedding website/portal for guests"""
    
    # Link to wedding instead of event
    wedding = models.OneToOneField(
        "wedding_planner.Wedding",
        on_delete=models.CASCADE,
        related_name="website",
        null=True,  # Temporarily nullable for migration
        blank=True
    )
    
    # Keep for backwards compatibility during migration
    event = models.OneToOneField(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="old_website",
        null=True,
        blank=True
    )
    
    # URL and access
    slug = models.SlugField(max_length=100, unique=True)
    custom_domain = models.CharField(max_length=200, blank=True)
    
    # Access control
    is_public = models.BooleanField(default=False)
    password = models.CharField(max_length=100, blank=True)
    requires_invitation = models.BooleanField(default=False)
    
    # Content
    title = models.CharField(max_length=200)
    subtitle = models.CharField(max_length=300, blank=True)
    
    # Couple info
    partner1_name = models.CharField(max_length=100)
    partner2_name = models.CharField(max_length=100)
    our_story = models.TextField(blank=True)
    
    # Media
    cover_image = models.ImageField(upload_to="website_covers/", blank=True)
    gallery_enabled = models.BooleanField(default=True)
    
    # Sections to show
    show_schedule = models.BooleanField(default=True)
    show_venue = models.BooleanField(default=True)
    show_rsvp = models.BooleanField(default=True)
    show_registry = models.BooleanField(default=True)
    show_faq = models.BooleanField(default=True)
    show_travel = models.BooleanField(default=True)
    show_photos = models.BooleanField(default=True)
    
    # Theme
    theme = models.CharField(max_length=50, default="elegant")
    primary_color = models.CharField(max_length=7, default="#d4af37")
    secondary_color = models.CharField(max_length=7, default="#2c3e50")
    
    # Analytics
    view_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        verbose_name = "Wedding Website"
        verbose_name_plural = "Wedding Websites"
    
    def __str__(self):
        return f"Website: {self.title}"


class WebsitePage(TimeStampedBaseModel):
    """Custom pages for the wedding website"""
    
    website = models.ForeignKey(
        WeddingWebsite,
        on_delete=models.CASCADE,
        related_name="pages"
    )
    
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=100)
    content = models.TextField()
    
    order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)
    show_in_nav = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Website Page"
        verbose_name_plural = "Website Pages"
        unique_together = ["website", "slug"]
        ordering = ["order"]
    
    def __str__(self):
        return self.title


class WebsiteFAQ(TimeStampedBaseModel):
    """FAQs for the wedding website"""
    
    website = models.ForeignKey(
        WeddingWebsite,
        on_delete=models.CASCADE,
        related_name="faqs"
    )
    
    question = models.CharField(max_length=500)
    answer = models.TextField()
    order = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Website FAQ"
        verbose_name_plural = "Website FAQs"
        ordering = ["order"]
    
    def __str__(self):
        return self.question


class TravelInfo(TimeStampedBaseModel):
    """Travel and accommodation info for guests"""
    
    website = models.ForeignKey(
        WeddingWebsite,
        on_delete=models.CASCADE,
        related_name="travel_info"
    )
    
    class InfoType(models.TextChoices):
        HOTEL = "hotel", "Hotel"
        AIRPORT = "airport", "Airport"
        TRANSPORT = "transport", "Transportation"
        PARKING = "parking", "Parking"
        OTHER = "other", "Other"
    
    info_type = models.CharField(
        max_length=20,
        choices=InfoType.choices,
        default=InfoType.HOTEL
    )
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    website = models.URLField(blank=True)
    booking_code = models.CharField(max_length=100, blank=True, help_text="Discount code for guests")
    map_url = models.URLField(blank=True)
    
    special_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    rate_valid_until = models.DateField(null=True, blank=True)
    
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        verbose_name = "Travel Info"
        verbose_name_plural = "Travel Info"
        ordering = ["info_type", "order"]
    
    def __str__(self):
        return f"{self.get_info_type_display()}: {self.name}"
