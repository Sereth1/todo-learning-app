from django.db import models
from config.models import TimeStampedBaseModel


class WeddingEvent(TimeStampedBaseModel):
    """
    Core wedding event details - date, venue, times, and logistics.
    Typically only one active event per wedding, but supports multiple events.
    """
    
    name = models.CharField(
        max_length=200, 
        default="Our Wedding",
        verbose_name="Event Name"
    )
    
    # Date & Time
    event_date = models.DateField(
        verbose_name="Wedding Date"
    )
    ceremony_time = models.TimeField(
        verbose_name="Ceremony Start Time"
    )
    reception_time = models.TimeField(
        null=True, 
        blank=True,
        verbose_name="Reception Start Time"
    )
    
    # Venue Details
    venue_name = models.CharField(
        max_length=300,
        verbose_name="Venue Name"
    )
    venue_address = models.TextField(
        verbose_name="Venue Address"
    )
    venue_city = models.CharField(
        max_length=100,
        verbose_name="City"
    )
    venue_map_url = models.URLField(
        blank=True,
        verbose_name="Google Maps URL"
    )
    
    # Additional Venues (if ceremony and reception are separate)
    reception_venue_name = models.CharField(
        max_length=300,
        blank=True,
        verbose_name="Reception Venue Name"
    )
    reception_venue_address = models.TextField(
        blank=True,
        verbose_name="Reception Venue Address"
    )
    
    # Event Details
    class DressCode(models.TextChoices):
        CASUAL = "casual", "Casual"
        SMART_CASUAL = "smart_casual", "Smart Casual"
        COCKTAIL = "cocktail", "Cocktail"
        FORMAL = "formal", "Formal / Black Tie Optional"
        BLACK_TIE = "black_tie", "Black Tie"
        WHITE_TIE = "white_tie", "White Tie"
        THEMED = "themed", "Themed"
    
    dress_code = models.CharField(
        max_length=20,
        choices=DressCode.choices,
        default=DressCode.FORMAL,
        verbose_name="Dress Code"
    )
    dress_code_notes = models.TextField(
        blank=True,
        help_text="Additional notes about dress code (e.g., color theme, outdoor venue)"
    )
    
    # RSVP Settings
    rsvp_deadline = models.DateField(
        verbose_name="RSVP Deadline"
    )
    
    # Additional Info
    special_instructions = models.TextField(
        blank=True,
        help_text="Parking info, accessibility notes, etc."
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text="Active event is displayed to guests"
    )
    
    class Meta:
        verbose_name = "Wedding Event"
        verbose_name_plural = "Wedding Events"
        ordering = ["-event_date"]
    
    def __str__(self):
        return f"{self.name} - {self.event_date}"
    
    @property
    def days_until_wedding(self):
        """Calculate days until the wedding."""
        from django.utils import timezone
        today = timezone.now().date()
        delta = self.event_date - today
        return delta.days
    
    @property
    def is_rsvp_open(self):
        """Check if RSVP deadline hasn't passed."""
        from django.utils import timezone
        return timezone.now().date() <= self.rsvp_deadline
