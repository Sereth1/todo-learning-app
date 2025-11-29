from django.db import models
from django.conf import settings
from config.models import TimeStampedBaseModel
from django.utils import timezone


class GuestCheckIn(TimeStampedBaseModel):
    """Day-of guest check-in system"""
    
    event = models.OneToOneField(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="check_in_config"
    )
    
    is_enabled = models.BooleanField(default=True)
    
    # Check-in settings
    allow_qr_checkin = models.BooleanField(default=True)
    allow_manual_checkin = models.BooleanField(default=True)
    allow_self_checkin = models.BooleanField(default=False)
    
    # Notifications
    notify_on_vip_arrival = models.BooleanField(default=True)
    notify_on_late_arrival = models.BooleanField(default=False)
    late_threshold_minutes = models.PositiveIntegerField(default=30)
    
    # Expected arrival time
    expected_arrival_start = models.TimeField(null=True, blank=True)
    expected_arrival_end = models.TimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = "Guest Check-In Config"
        verbose_name_plural = "Guest Check-In Configs"
    
    def __str__(self):
        return f"Check-in for {self.event.name}"
    
    @property
    def checked_in_count(self):
        return self.arrivals.filter(checked_in=True).count()
    
    @property
    def pending_count(self):
        return self.arrivals.filter(checked_in=False).count()


class GuestArrival(TimeStampedBaseModel):
    """Track individual guest arrivals"""
    
    check_in_config = models.ForeignKey(
        GuestCheckIn,
        on_delete=models.CASCADE,
        related_name="arrivals"
    )
    
    guest = models.ForeignKey(
        "wedding_planner.Guest",
        on_delete=models.CASCADE,
        related_name="arrivals"
    )
    
    # Check-in status
    checked_in = models.BooleanField(default=False)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    
    # How they checked in
    check_in_method = models.CharField(
        max_length=20,
        choices=[
            ("qr", "QR Code Scan"),
            ("manual", "Manual Check-in"),
            ("self", "Self Check-in"),
        ],
        blank=True
    )
    
    # Who checked them in
    checked_in_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="checked_in_guests"
    )
    
    # Plus-one tracking
    plus_one_arrived = models.BooleanField(default=False)
    children_count_arrived = models.PositiveIntegerField(default=0)
    
    # Notes
    notes = models.TextField(blank=True)
    special_needs_noted = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Guest Arrival"
        verbose_name_plural = "Guest Arrivals"
        unique_together = ["check_in_config", "guest"]
    
    def __str__(self):
        status = "✓" if self.checked_in else "○"
        return f"{status} {self.guest}"
    
    def check_in(self, method="manual", checked_by=None):
        self.checked_in = True
        self.checked_in_at = timezone.now()
        self.check_in_method = method
        self.checked_in_by = checked_by
        self.save()


class CheckInStation(TimeStampedBaseModel):
    """Multiple check-in stations for larger events"""
    
    check_in_config = models.ForeignKey(
        GuestCheckIn,
        on_delete=models.CASCADE,
        related_name="stations"
    )
    
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=200, blank=True)
    
    # Assign guests by letter range, table, etc.
    guest_filter_type = models.CharField(
        max_length=20,
        choices=[
            ("all", "All Guests"),
            ("letter_range", "By Last Name"),
            ("table", "By Table"),
            ("tag", "By Guest Tag"),
        ],
        default="all"
    )
    filter_value = models.CharField(max_length=100, blank=True)
    
    # Station staff
    assigned_users = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name="check_in_stations"
    )
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Check-In Station"
        verbose_name_plural = "Check-In Stations"
    
    def __str__(self):
        return self.name
