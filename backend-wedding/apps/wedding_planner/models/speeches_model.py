from django.db import models
from django.conf import settings
from config.models import TimeStampedBaseModel


class SpeechSchedule(TimeStampedBaseModel):
    """Schedule of speeches and toasts"""
    
    event = models.OneToOneField(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="speech_schedule"
    )
    
    mc_name = models.CharField(max_length=200, blank=True, help_text="Master of Ceremonies")
    mc_phone = models.CharField(max_length=30, blank=True)
    mc_email = models.EmailField(blank=True)
    
    notes_for_mc = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Speech Schedule"
        verbose_name_plural = "Speech Schedules"
    
    def __str__(self):
        return f"Speech Schedule: {self.event.name}"


class Speech(TimeStampedBaseModel):
    """Individual speech or toast"""
    
    class SpeechType(models.TextChoices):
        WELCOME = "welcome", "Welcome Speech"
        TOAST = "toast", "Toast"
        BLESSING = "blessing", "Blessing"
        PARENT = "parent", "Parent Speech"
        BEST_MAN = "best_man", "Best Man Speech"
        MAID_OF_HONOR = "maid_of_honor", "Maid of Honor Speech"
        COUPLE = "couple", "Couple's Speech"
        THANK_YOU = "thank_you", "Thank You"
        OTHER = "other", "Other"
    
    schedule = models.ForeignKey(
        SpeechSchedule,
        on_delete=models.CASCADE,
        related_name="speeches"
    )
    
    # Speaker
    speaker_name = models.CharField(max_length=200)
    speaker_relationship = models.CharField(max_length=200, blank=True)
    speaker_guest = models.ForeignKey(
        "wedding_planner.Guest",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="speeches"
    )
    speaker_phone = models.CharField(max_length=30, blank=True)
    speaker_email = models.EmailField(blank=True)
    
    speech_type = models.CharField(
        max_length=20,
        choices=SpeechType.choices
    )
    
    title = models.CharField(max_length=200, blank=True)
    
    # Timing
    scheduled_time = models.TimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(default=5)
    
    # Status
    has_confirmed = models.BooleanField(default=False)
    needs_microphone = models.BooleanField(default=True)
    
    # Notes
    notes = models.TextField(blank=True)
    
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        verbose_name = "Speech"
        verbose_name_plural = "Speeches"
        ordering = ["order", "scheduled_time"]
    
    def __str__(self):
        return f"{self.speaker_name}: {self.get_speech_type_display()}"
