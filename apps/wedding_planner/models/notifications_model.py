from django.db import models
from django.conf import settings
from config.models import TimeStampedBaseModel


class NotificationPreference(TimeStampedBaseModel):
    """User notification preferences"""
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notification_preferences"
    )
    
    # Email notifications
    email_rsvp_received = models.BooleanField(default=True)
    email_payment_reminder = models.BooleanField(default=True)
    email_task_due = models.BooleanField(default=True)
    email_vendor_message = models.BooleanField(default=True)
    email_team_activity = models.BooleanField(default=False)
    email_guest_message = models.BooleanField(default=True)
    email_weekly_summary = models.BooleanField(default=True)
    
    # Push notifications (if mobile app)
    push_enabled = models.BooleanField(default=True)
    push_rsvp_received = models.BooleanField(default=True)
    push_check_in = models.BooleanField(default=True)
    push_urgent_only = models.BooleanField(default=False)
    
    # Quiet hours
    quiet_hours_enabled = models.BooleanField(default=False)
    quiet_start_time = models.TimeField(null=True, blank=True)
    quiet_end_time = models.TimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = "Notification Preference"
        verbose_name_plural = "Notification Preferences"
    
    def __str__(self):
        return f"Notifications for {self.user}"


class Notification(TimeStampedBaseModel):
    """Individual notifications"""
    
    class NotificationType(models.TextChoices):
        RSVP = "rsvp", "RSVP Update"
        PAYMENT = "payment", "Payment"
        TASK = "task", "Task"
        VENDOR = "vendor", "Vendor"
        TEAM = "team", "Team"
        GUEST = "guest", "Guest"
        SYSTEM = "system", "System"
        REMINDER = "reminder", "Reminder"
    
    class Priority(models.TextChoices):
        LOW = "low", "Low"
        NORMAL = "normal", "Normal"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications"
    )
    
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices
    )
    
    title = models.CharField(max_length=300)
    message = models.TextField()
    
    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.NORMAL
    )
    
    # Link to related object
    link_url = models.CharField(max_length=500, blank=True)
    
    # Status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    is_email_sent = models.BooleanField(default=False)
    is_push_sent = models.BooleanField(default=False)
    
    # Auto-delete after
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"{self.title}"
    
    def mark_read(self):
        from django.utils import timezone
        self.is_read = True
        self.read_at = timezone.now()
        self.save()


class ScheduledReminder(TimeStampedBaseModel):
    """Scheduled reminders"""
    
    class ReminderType(models.TextChoices):
        PAYMENT = "payment", "Payment Due"
        TASK = "task", "Task Due"
        RSVP = "rsvp", "RSVP Deadline"
        VENDOR = "vendor", "Vendor Follow-up"
        CUSTOM = "custom", "Custom"
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="scheduled_reminders"
    )
    
    reminder_type = models.CharField(
        max_length=20,
        choices=ReminderType.choices
    )
    
    title = models.CharField(max_length=300)
    message = models.TextField(blank=True)
    
    remind_at = models.DateTimeField()
    
    # Repeat settings
    is_recurring = models.BooleanField(default=False)
    recurrence_pattern = models.CharField(
        max_length=20,
        choices=[
            ("daily", "Daily"),
            ("weekly", "Weekly"),
            ("monthly", "Monthly"),
        ],
        blank=True
    )
    
    # Status
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Scheduled Reminder"
        verbose_name_plural = "Scheduled Reminders"
        ordering = ["remind_at"]
    
    def __str__(self):
        return f"{self.title} - {self.remind_at}"
