from django.db import models
from django.conf import settings
from config.models import TimeStampedBaseModel


class SeatingPreference(TimeStampedBaseModel):
    """Seating preferences and rules"""
    
    class PreferenceType(models.TextChoices):
        SEAT_TOGETHER = "together", "Seat Together"
        KEEP_APART = "apart", "Keep Apart"
        NEAR_FRONT = "near_front", "Seat Near Front"
        NEAR_EXIT = "near_exit", "Seat Near Exit"
        QUIET_AREA = "quiet_area", "Quiet Area"
        ACCESSIBLE = "accessible", "Accessible Seating"
    
    event = models.ForeignKey(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="seating_preferences"
    )
    
    preference_type = models.CharField(
        max_length=20,
        choices=PreferenceType.choices
    )
    
    # Guests involved (for together/apart rules)
    guests = models.ManyToManyField(
        "wedding_planner.Guest",
        related_name="seating_preferences"
    )
    
    # Priority (higher = more important)
    priority = models.PositiveIntegerField(default=5)
    
    reason = models.TextField(blank=True)
    
    is_mandatory = models.BooleanField(
        default=False,
        help_text="Must be satisfied, not just preferred"
    )
    
    class Meta:
        verbose_name = "Seating Preference"
        verbose_name_plural = "Seating Preferences"
        ordering = ["-priority"]
    
    def __str__(self):
        guest_names = ", ".join([g.first_name for g in self.guests.all()[:3]])
        return f"{self.get_preference_type_display()}: {guest_names}"


class TableGroup(TimeStampedBaseModel):
    """Group guests by category for easier seating"""
    
    event = models.ForeignKey(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="table_groups"
    )
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default="#6366f1")
    
    # Suggested table(s) for this group
    suggested_tables = models.ManyToManyField(
        "wedding_planner.Table",
        blank=True,
        related_name="suggested_for_groups"
    )
    
    class Meta:
        verbose_name = "Table Group"
        verbose_name_plural = "Table Groups"
    
    def __str__(self):
        return self.name


class GuestTableGroupAssignment(TimeStampedBaseModel):
    """Assign guests to table groups"""
    
    guest = models.ForeignKey(
        "wedding_planner.Guest",
        on_delete=models.CASCADE,
        related_name="table_group_assignments"
    )
    
    table_group = models.ForeignKey(
        TableGroup,
        on_delete=models.CASCADE,
        related_name="guest_assignments"
    )
    
    class Meta:
        verbose_name = "Guest Table Group"
        verbose_name_plural = "Guest Table Groups"
        unique_together = ["guest", "table_group"]
    
    def __str__(self):
        return f"{self.guest} in {self.table_group}"


class SeatingChart(TimeStampedBaseModel):
    """Visual seating chart configuration"""
    
    event = models.OneToOneField(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="seating_chart"
    )
    
    name = models.CharField(max_length=200, default="Reception Seating")
    
    # Canvas dimensions for visual editor
    canvas_width = models.PositiveIntegerField(default=1200)
    canvas_height = models.PositiveIntegerField(default=800)
    
    # Background image (venue floor plan)
    background_image = models.ImageField(
        upload_to="seating_charts/",
        blank=True
    )
    
    # Table positions (stored as JSON for flexibility)
    table_positions = models.JSONField(
        default=dict,
        help_text="Table ID -> {x, y, rotation} mapping"
    )
    
    # Display settings
    show_guest_names = models.BooleanField(default=True)
    show_meal_choices = models.BooleanField(default=False)
    show_dietary_icons = models.BooleanField(default=True)
    
    is_published = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = "Seating Chart"
        verbose_name_plural = "Seating Charts"
    
    def __str__(self):
        return f"Seating Chart: {self.event.name}"


class SeatingConflict(TimeStampedBaseModel):
    """Track conflicts in seating arrangements"""
    
    class Severity(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"
    
    event = models.ForeignKey(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="seating_conflicts"
    )
    
    description = models.TextField()
    severity = models.CharField(
        max_length=10,
        choices=Severity.choices,
        default=Severity.MEDIUM
    )
    
    # Guests/tables involved
    guests_involved = models.ManyToManyField(
        "wedding_planner.Guest",
        related_name="seating_conflicts"
    )
    table = models.ForeignKey(
        "wedding_planner.Table",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    # Related preference that was violated
    violated_preference = models.ForeignKey(
        SeatingPreference,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    is_resolved = models.BooleanField(default=False)
    resolution_notes = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Seating Conflict"
        verbose_name_plural = "Seating Conflicts"
        ordering = ["-severity", "-created_at"]
    
    def __str__(self):
        return f"Conflict: {self.description[:50]}"
