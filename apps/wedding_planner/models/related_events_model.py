from django.db import models
from django.conf import settings
from config.models import TimeStampedBaseModel


class RehearsalDinner(TimeStampedBaseModel):
    """Rehearsal dinner event"""
    
    event = models.OneToOneField(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="rehearsal_dinner"
    )
    
    name = models.CharField(max_length=200, default="Rehearsal Dinner")
    
    # Date and time
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField(null=True, blank=True)
    
    # Venue
    venue_name = models.CharField(max_length=200)
    venue_address = models.TextField()
    venue_phone = models.CharField(max_length=30, blank=True)
    venue_map_url = models.URLField(blank=True)
    
    # Details
    dress_code = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    
    # RSVP
    rsvp_deadline = models.DateField(null=True, blank=True)
    
    # Cost
    estimated_cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    cost_per_person = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    
    # Host
    hosted_by = models.CharField(max_length=200, blank=True)
    
    class Meta:
        verbose_name = "Rehearsal Dinner"
        verbose_name_plural = "Rehearsal Dinners"
    
    def __str__(self):
        return f"{self.name} - {self.date}"


class RehearsalDinnerGuest(TimeStampedBaseModel):
    """Guests invited to rehearsal dinner"""
    
    class RSVPStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        ATTENDING = "attending", "Attending"
        NOT_ATTENDING = "not_attending", "Not Attending"
    
    rehearsal_dinner = models.ForeignKey(
        RehearsalDinner,
        on_delete=models.CASCADE,
        related_name="guests"
    )
    
    # Link to main guest or manual entry
    guest = models.ForeignKey(
        "wedding_planner.Guest",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="rehearsal_invitations"
    )
    name = models.CharField(max_length=200, blank=True)
    email = models.EmailField(blank=True)
    
    rsvp_status = models.CharField(
        max_length=20,
        choices=RSVPStatus.choices,
        default=RSVPStatus.PENDING
    )
    
    meal_preference = models.CharField(max_length=200, blank=True)
    dietary_notes = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Rehearsal Dinner Guest"
        verbose_name_plural = "Rehearsal Dinner Guests"
    
    def __str__(self):
        name = self.name or (str(self.guest) if self.guest else "Unknown")
        return f"{name} - {self.get_rsvp_status_display()}"


class WeddingRelatedEvent(TimeStampedBaseModel):
    """Other related events (bridal shower, bachelor/ette party, etc.)"""
    
    class EventType(models.TextChoices):
        BRIDAL_SHOWER = "bridal_shower", "Bridal Shower"
        BACHELOR_PARTY = "bachelor_party", "Bachelor Party"
        BACHELORETTE_PARTY = "bachelorette_party", "Bachelorette Party"
        ENGAGEMENT_PARTY = "engagement_party", "Engagement Party"
        WELCOME_PARTY = "welcome_party", "Welcome Party"
        FAREWELL_BRUNCH = "farewell_brunch", "Farewell Brunch"
        OTHER = "other", "Other"
    
    main_event = models.ForeignKey(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="related_events"
    )
    
    name = models.CharField(max_length=200)
    event_type = models.CharField(
        max_length=20,
        choices=EventType.choices
    )
    
    date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    
    venue_name = models.CharField(max_length=200, blank=True)
    venue_address = models.TextField(blank=True)
    
    hosted_by = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    
    # Cost tracking
    estimated_cost = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    class Meta:
        verbose_name = "Related Event"
        verbose_name_plural = "Related Events"
        ordering = ["date", "start_time"]
    
    def __str__(self):
        return f"{self.name} - {self.date}"


class RelatedEventGuest(TimeStampedBaseModel):
    """Guests for related events"""
    
    class RSVPStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        ATTENDING = "attending", "Attending"
        NOT_ATTENDING = "not_attending", "Not Attending"
    
    related_event = models.ForeignKey(
        WeddingRelatedEvent,
        on_delete=models.CASCADE,
        related_name="guests"
    )
    
    guest = models.ForeignKey(
        "wedding_planner.Guest",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    name = models.CharField(max_length=200, blank=True)
    email = models.EmailField(blank=True)
    
    rsvp_status = models.CharField(
        max_length=20,
        choices=RSVPStatus.choices,
        default=RSVPStatus.PENDING
    )
    
    class Meta:
        verbose_name = "Related Event Guest"
        verbose_name_plural = "Related Event Guests"
    
    def __str__(self):
        name = self.name or (str(self.guest) if self.guest else "Unknown")
        return f"{name}"
