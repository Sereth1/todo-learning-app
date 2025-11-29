import uuid
from django.conf import settings
from django.db import models
from config.models import TimeStampedBaseModel


class Wedding(TimeStampedBaseModel):
    """
    Central model representing a wedding. Each user/couple has their own wedding.
    All other models (guests, events, tables, etc.) belong to a specific wedding.
    """
    
    # Owner (the user who created this wedding)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="weddings"
    )
    
    # Partner names for display
    partner1_name = models.CharField(
        max_length=100,
        verbose_name="Partner 1 Name"
    )
    partner2_name = models.CharField(
        max_length=100,
        verbose_name="Partner 2 Name"
    )
    
    # Wedding title/slug for URLs
    slug = models.SlugField(
        max_length=100,
        unique=True,
        help_text="Unique URL-friendly identifier for this wedding"
    )
    
    # Wedding details
    wedding_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="Wedding Date"
    )
    
    # Status
    class WeddingStatus(models.TextChoices):
        PLANNING = "planning", "Planning"
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"
    
    status = models.CharField(
        max_length=20,
        choices=WeddingStatus.choices,
        default=WeddingStatus.PLANNING
    )
    
    # Website settings
    is_website_public = models.BooleanField(
        default=False,
        verbose_name="Public Wedding Website"
    )
    
    # Theme/customization
    primary_color = models.CharField(
        max_length=7,
        default="#e11d48",  # rose-600
        help_text="Primary color hex code"
    )
    secondary_color = models.CharField(
        max_length=7,
        default="#fda4af",  # rose-300
        help_text="Secondary color hex code"
    )
    
    # Cover image URL
    cover_image_url = models.URLField(
        blank=True,
        verbose_name="Cover Image URL"
    )
    
    # Access code for guests (to find their invitation)
    public_code = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True,
        help_text="Public code for guests to access the wedding website"
    )
    
    class Meta:
        verbose_name = "Wedding"
        verbose_name_plural = "Weddings"
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"{self.partner1_name} & {self.partner2_name}'s Wedding"
    
    @property
    def display_name(self):
        return f"{self.partner1_name} & {self.partner2_name}"
    
    @property
    def guest_count(self):
        return self.guests.count()
    
    @property
    def confirmed_guest_count(self):
        return self.guests.filter(attendance_status="yes").count()
