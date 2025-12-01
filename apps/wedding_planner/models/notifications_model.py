from django.db import models
from django.conf import settings
from django.utils import timezone
from config.models import TimeStampedBaseModel


class NotificationPreference(TimeStampedBaseModel):
    """User notification preferences per wedding"""
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notification_preferences"
    )
    wedding = models.ForeignKey(
        "wedding_planner.Wedding",
        on_delete=models.CASCADE,
        related_name="notification_preferences",
        null=True,
        blank=True,
    )
    
    # Todo notifications
    todo_due_soon_enabled = models.BooleanField(
        default=True,
        help_text="Notify 30 minutes before todo is due"
    )
    todo_due_now_enabled = models.BooleanField(
        default=True,
        help_text="Notify when todo is due"
    )
    todo_overdue_enabled = models.BooleanField(
        default=True,
        help_text="Notify when todo becomes overdue"
    )
    
    # RSVP notifications
    rsvp_accepted_enabled = models.BooleanField(
        default=True,
        help_text="Notify when guest accepts invitation"
    )
    rsvp_declined_enabled = models.BooleanField(
        default=True,
        help_text="Notify when guest declines invitation"
    )
    
    # Gift Registry notifications
    gift_claimed_enabled = models.BooleanField(
        default=True,
        help_text="Notify when a guest claims a gift from the registry"
    )
    
    # Email notifications (legacy)
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
        unique_together = ["user", "wedding"]
    
    def __str__(self):
        return f"Notifications for {self.user}"


class Notification(TimeStampedBaseModel):
    """Individual notifications"""
    
    class NotificationType(models.TextChoices):
        # Todo related
        TODO_DUE_SOON = "todo_due_soon", "Todo Due Soon (30 min)"
        TODO_DUE_NOW = "todo_due_now", "Todo Due Now"
        TODO_OVERDUE = "todo_overdue", "Todo Overdue"
        TODO_REMINDER = "todo_reminder", "Todo Reminder"
        TODO_COMPLETED = "todo_completed", "Todo Completed"
        
        # RSVP related
        RSVP_ACCEPTED = "rsvp_accepted", "RSVP Accepted"
        RSVP_DECLINED = "rsvp_declined", "RSVP Declined"
        RSVP_PENDING = "rsvp_pending", "RSVP Pending Reminder"
        
        # Gift Registry related
        GIFT_CLAIMED = "gift_claimed", "Gift Claimed"
        GIFT_UNCLAIMED = "gift_unclaimed", "Gift Unclaimed"
        
        # Legacy types
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
    wedding = models.ForeignKey(
        "wedding_planner.Wedding",
        on_delete=models.CASCADE,
        related_name="notifications",
        null=True,
        blank=True,
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
    
    # Link to related objects
    link_url = models.CharField(max_length=500, blank=True)
    
    related_todo = models.ForeignKey(
        "todo_list_wedding.Todo",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )
    related_guest = models.ForeignKey(
        "wedding_planner.Guest",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )
    
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
        indexes = [
            models.Index(fields=["user", "is_read"]),
            models.Index(fields=["wedding", "-created_at"]),
            models.Index(fields=["notification_type"]),
        ]
    
    def __str__(self):
        return f"{self.title}"
    
    def mark_read(self):
        self.is_read = True
        self.read_at = timezone.now()
        self.save(update_fields=["is_read", "read_at", "updated_at"])
    
    def mark_unread(self):
        self.is_read = False
        self.read_at = None
        self.save(update_fields=["is_read", "read_at", "updated_at"])


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
