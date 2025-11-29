from django.db import models
from django.conf import settings
from config.models import TimeStampedBaseModel


class EmailTemplate(TimeStampedBaseModel):
    """Pre-built email templates for wedding communications"""
    
    class TemplateType(models.TextChoices):
        SAVE_THE_DATE = "save_the_date", "Save the Date"
        FORMAL_INVITE = "formal_invite", "Formal Invitation"
        RSVP_REQUEST = "rsvp_request", "RSVP Request"
        RSVP_REMINDER = "rsvp_reminder", "RSVP Reminder"
        RSVP_CONFIRMED = "rsvp_confirmed", "RSVP Confirmed"
        RSVP_DECLINED = "rsvp_declined", "RSVP Declined"
        EVENT_DETAILS = "event_details", "Event Details"
        SEATING_INFO = "seating_info", "Seating Information"
        THANK_YOU = "thank_you", "Thank You"
        CUSTOM = "custom", "Custom"
    
    name = models.CharField(max_length=200)
    template_type = models.CharField(
        max_length=30,
        choices=TemplateType.choices,
        default=TemplateType.CUSTOM
    )
    subject = models.CharField(max_length=300)
    html_content = models.TextField(
        help_text="HTML content with placeholders: {{first_name}}, {{last_name}}, {{event_date}}, etc."
    )
    text_content = models.TextField(
        blank=True,
        help_text="Plain text fallback"
    )
    is_default = models.BooleanField(
        default=False,
        help_text="Default template for this type"
    )
    is_active = models.BooleanField(default=True)
    
    # Personalization tokens available
    available_tokens = models.JSONField(
        default=list,
        help_text="List of available personalization tokens"
    )
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="email_templates"
    )
    
    class Meta:
        verbose_name = "Email Template"
        verbose_name_plural = "Email Templates"
        ordering = ["template_type", "name"]
    
    def __str__(self):
        return f"{self.name} ({self.get_template_type_display()})"
    
    def save(self, *args, **kwargs):
        # Set default tokens if not provided
        if not self.available_tokens:
            self.available_tokens = [
                "first_name", "last_name", "full_name", "email",
                "event_date", "event_time", "venue_name", "venue_address",
                "rsvp_link", "rsvp_deadline", "table_number", "meal_choice",
                "couple_names", "wedding_website_url"
            ]
        super().save(*args, **kwargs)


class EmailLog(TimeStampedBaseModel):
    """Track sent emails for analytics"""
    
    class EmailStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        SENT = "sent", "Sent"
        DELIVERED = "delivered", "Delivered"
        OPENED = "opened", "Opened"
        CLICKED = "clicked", "Clicked"
        BOUNCED = "bounced", "Bounced"
        FAILED = "failed", "Failed"
    
    guest = models.ForeignKey(
        "wedding_planner.Guest",
        on_delete=models.CASCADE,
        related_name="email_logs"
    )
    template = models.ForeignKey(
        EmailTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    subject = models.CharField(max_length=300)
    recipient_email = models.EmailField()
    status = models.CharField(
        max_length=20,
        choices=EmailStatus.choices,
        default=EmailStatus.PENDING
    )
    
    # Tracking
    sent_at = models.DateTimeField(null=True, blank=True)
    opened_at = models.DateTimeField(null=True, blank=True)
    clicked_at = models.DateTimeField(null=True, blank=True)
    open_count = models.PositiveIntegerField(default=0)
    click_count = models.PositiveIntegerField(default=0)
    
    # Error tracking
    error_message = models.TextField(blank=True)
    
    # Message ID for tracking
    message_id = models.CharField(max_length=200, blank=True)
    
    class Meta:
        verbose_name = "Email Log"
        verbose_name_plural = "Email Logs"
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"Email to {self.recipient_email} - {self.status}"


class ScheduledEmail(TimeStampedBaseModel):
    """Schedule emails for future sending (reminders, etc.)"""
    
    class ScheduleType(models.TextChoices):
        ONE_TIME = "one_time", "One Time"
        RECURRING = "recurring", "Recurring"
    
    name = models.CharField(max_length=200)
    template = models.ForeignKey(
        EmailTemplate,
        on_delete=models.CASCADE
    )
    schedule_type = models.CharField(
        max_length=20,
        choices=ScheduleType.choices,
        default=ScheduleType.ONE_TIME
    )
    scheduled_datetime = models.DateTimeField()
    
    # Target guests (filter criteria)
    target_attendance_status = models.CharField(
        max_length=20,
        blank=True,
        help_text="Filter by attendance status (pending, yes, no)"
    )
    target_tags = models.ManyToManyField(
        "wedding_planner.GuestTag",
        blank=True,
        help_text="Send only to guests with these tags"
    )
    
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    sent_count = models.PositiveIntegerField(default=0)
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Scheduled Email"
        verbose_name_plural = "Scheduled Emails"
        ordering = ["scheduled_datetime"]
    
    def __str__(self):
        return f"{self.name} - {self.scheduled_datetime}"


class Announcement(TimeStampedBaseModel):
    """Broadcast announcements to guests"""
    
    class AnnouncementType(models.TextChoices):
        INFO = "info", "Information"
        UPDATE = "update", "Schedule Update"
        REMINDER = "reminder", "Reminder"
        URGENT = "urgent", "Urgent"
    
    title = models.CharField(max_length=300)
    content = models.TextField()
    announcement_type = models.CharField(
        max_length=20,
        choices=AnnouncementType.choices,
        default=AnnouncementType.INFO
    )
    
    # Targeting
    send_to_all = models.BooleanField(default=True)
    target_tags = models.ManyToManyField(
        "wedding_planner.GuestTag",
        blank=True
    )
    target_confirmed_only = models.BooleanField(default=False)
    
    # Delivery channels
    send_email = models.BooleanField(default=True)
    send_sms = models.BooleanField(default=False)
    show_on_portal = models.BooleanField(default=True)
    
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    
    class Meta:
        verbose_name = "Announcement"
        verbose_name_plural = "Announcements"
        ordering = ["-created_at"]
    
    def __str__(self):
        return self.title
