from django.db import models
from django.conf import settings
from config.models import TimeStampedBaseModel


class EventTimeline(TimeStampedBaseModel):
    """Master timeline for the wedding day"""
    
    event = models.OneToOneField(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="timeline"
    )
    
    name = models.CharField(max_length=200, default="Wedding Day Timeline")
    notes = models.TextField(blank=True)
    
    # Timeline settings
    buffer_minutes = models.PositiveIntegerField(
        default=15,
        help_text="Default buffer between activities"
    )
    
    class Meta:
        verbose_name = "Event Timeline"
        verbose_name_plural = "Event Timelines"
    
    def __str__(self):
        return f"Timeline: {self.event.name}"


class TimelineItem(TimeStampedBaseModel):
    """Individual items in the timeline"""
    
    class ItemType(models.TextChoices):
        CEREMONY = "ceremony", "Ceremony"
        RECEPTION = "reception", "Reception"
        PHOTOS = "photos", "Photos"
        PREPARATION = "preparation", "Preparation"
        TRANSPORTATION = "transportation", "Transportation"
        MEAL = "meal", "Meal"
        ENTERTAINMENT = "entertainment", "Entertainment"
        TRADITION = "tradition", "Tradition/Custom"
        BREAK = "break", "Break"
        OTHER = "other", "Other"
    
    class Visibility(models.TextChoices):
        PUBLIC = "public", "Visible to All"
        VENDORS = "vendors", "Visible to Vendors"
        PARTY = "party", "Wedding Party Only"
        PRIVATE = "private", "Couple Only"
    
    timeline = models.ForeignKey(
        EventTimeline,
        on_delete=models.CASCADE,
        related_name="items"
    )
    
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    
    item_type = models.CharField(
        max_length=20,
        choices=ItemType.choices,
        default=ItemType.OTHER
    )
    
    start_time = models.TimeField()
    end_time = models.TimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    
    location = models.CharField(max_length=300, blank=True)
    
    # Who needs to be there
    visibility = models.CharField(
        max_length=20,
        choices=Visibility.choices,
        default=Visibility.PUBLIC
    )
    
    # Assigned people
    assigned_vendors = models.ManyToManyField(
        "wedding_planner.Vendor",
        blank=True,
        related_name="timeline_items"
    )
    assigned_party_members = models.ManyToManyField(
        "wedding_planner.WeddingPartyMember",
        blank=True,
        related_name="timeline_items"
    )
    
    notes_for_vendors = models.TextField(blank=True)
    
    # Status
    is_completed = models.BooleanField(default=False)
    actual_start_time = models.TimeField(null=True, blank=True)
    actual_end_time = models.TimeField(null=True, blank=True)
    
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        verbose_name = "Timeline Item"
        verbose_name_plural = "Timeline Items"
        ordering = ["start_time", "order"]
    
    def __str__(self):
        return f"{self.start_time.strftime('%H:%M')} - {self.title}"


class Milestone(TimeStampedBaseModel):
    """Planning milestones and progress tracking"""
    
    class Category(models.TextChoices):
        VENUE = "venue", "Venue"
        CATERING = "catering", "Catering"
        ATTIRE = "attire", "Attire"
        PHOTOGRAPHY = "photography", "Photography"
        FLOWERS = "flowers", "Flowers"
        MUSIC = "music", "Music"
        INVITATIONS = "invitations", "Invitations"
        LEGAL = "legal", "Legal"
        OTHER = "other", "Other"
    
    event = models.ForeignKey(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="milestones"
    )
    
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.OTHER
    )
    
    target_date = models.DateField()
    completed_date = models.DateField(null=True, blank=True)
    
    is_completed = models.BooleanField(default=False)
    
    # Linked items
    linked_vendors = models.ManyToManyField(
        "wedding_planner.Vendor",
        blank=True
    )
    linked_budget_items = models.ManyToManyField(
        "wedding_planner.BudgetItem",
        blank=True
    )
    
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        verbose_name = "Milestone"
        verbose_name_plural = "Milestones"
        ordering = ["target_date", "order"]
    
    def __str__(self):
        status = "✓" if self.is_completed else "○"
        return f"{status} {self.title}"
    
    @property
    def is_overdue(self):
        from django.utils import timezone
        if not self.is_completed and self.target_date:
            return self.target_date < timezone.now().date()
        return False
