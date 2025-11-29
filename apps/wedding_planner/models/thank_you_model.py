from django.db import models
from django.conf import settings
from config.models import TimeStampedBaseModel


class ThankYouTracker(TimeStampedBaseModel):
    """Track thank you notes sent to guests"""
    
    event = models.OneToOneField(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="thank_you_tracker"
    )
    
    # Default template
    default_template = models.TextField(blank=True)
    
    # Goal
    target_completion_date = models.DateField(null=True, blank=True)
    
    class Meta:
        verbose_name = "Thank You Tracker"
        verbose_name_plural = "Thank You Trackers"
    
    def __str__(self):
        return f"Thank You Tracker: {self.event.name}"
    
    @property
    def total_notes(self):
        return self.notes.count()
    
    @property
    def sent_notes(self):
        return self.notes.filter(is_sent=True).count()
    
    @property
    def completion_percentage(self):
        total = self.total_notes
        if total > 0:
            return round((self.sent_notes / total) * 100, 1)
        return 0


class ThankYouNote(TimeStampedBaseModel):
    """Individual thank you notes"""
    
    class NoteType(models.TextChoices):
        GIFT = "gift", "Gift Thank You"
        ATTENDANCE = "attendance", "Attendance Thank You"
        HELP = "help", "Help/Support Thank You"
        VENDOR = "vendor", "Vendor Thank You"
        OTHER = "other", "Other"
    
    class DeliveryMethod(models.TextChoices):
        EMAIL = "email", "Email"
        MAIL = "mail", "Physical Mail"
        BOTH = "both", "Email & Mail"
    
    tracker = models.ForeignKey(
        ThankYouTracker,
        on_delete=models.CASCADE,
        related_name="notes"
    )
    
    # Recipient
    guest = models.ForeignKey(
        "wedding_planner.Guest",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="thank_you_notes"
    )
    recipient_name = models.CharField(max_length=200, blank=True)
    recipient_email = models.EmailField(blank=True)
    recipient_address = models.TextField(blank=True)
    
    note_type = models.CharField(
        max_length=20,
        choices=NoteType.choices,
        default=NoteType.GIFT
    )
    
    # Related gift if applicable
    gift = models.ForeignKey(
        "wedding_planner.Gift",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="thank_you_notes"
    )
    
    # Note content
    subject = models.CharField(max_length=300, blank=True)
    message = models.TextField()
    
    delivery_method = models.CharField(
        max_length=10,
        choices=DeliveryMethod.choices,
        default=DeliveryMethod.EMAIL
    )
    
    # Status
    is_drafted = models.BooleanField(default=True)
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    # For physical mail
    is_printed = models.BooleanField(default=False)
    is_mailed = models.BooleanField(default=False)
    mailed_at = models.DateField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Thank You Note"
        verbose_name_plural = "Thank You Notes"
        ordering = ["-created_at"]
    
    def __str__(self):
        recipient = self.recipient_name or (str(self.guest) if self.guest else "Unknown")
        status = "✓" if self.is_sent else "○"
        return f"{status} Thank you to {recipient}"


class ThankYouTemplate(TimeStampedBaseModel):
    """Templates for thank you notes"""
    
    tracker = models.ForeignKey(
        ThankYouTracker,
        on_delete=models.CASCADE,
        related_name="templates"
    )
    
    name = models.CharField(max_length=200)
    
    # For which type
    note_type = models.CharField(
        max_length=20,
        choices=ThankYouNote.NoteType.choices,
        default=ThankYouNote.NoteType.GIFT
    )
    
    subject = models.CharField(max_length=300)
    body = models.TextField(help_text="Use {{name}}, {{gift}}, {{amount}} as placeholders")
    
    is_default = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = "Thank You Template"
        verbose_name_plural = "Thank You Templates"
    
    def __str__(self):
        return self.name
