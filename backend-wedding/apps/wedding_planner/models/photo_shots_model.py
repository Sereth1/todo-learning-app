from django.db import models
from django.conf import settings
from config.models import TimeStampedBaseModel


class PhotoShotList(TimeStampedBaseModel):
    """Must-have photo shots checklist"""
    
    event = models.OneToOneField(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="photo_shot_list"
    )
    
    photographer_notes = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Photo Shot List"
        verbose_name_plural = "Photo Shot Lists"
    
    def __str__(self):
        return f"Photo Shot List: {self.event.name}"


class PhotoShot(TimeStampedBaseModel):
    """Individual photo shots"""
    
    class ShotType(models.TextChoices):
        GETTING_READY = "getting_ready", "Getting Ready"
        CEREMONY = "ceremony", "Ceremony"
        FAMILY = "family", "Family Portraits"
        WEDDING_PARTY = "wedding_party", "Wedding Party"
        COUPLE = "couple", "Couple Portraits"
        RECEPTION = "reception", "Reception"
        DETAILS = "details", "Details"
        CANDID = "candid", "Candid Moments"
        OTHER = "other", "Other"
    
    class Priority(models.TextChoices):
        MUST_HAVE = "must_have", "Must Have"
        IMPORTANT = "important", "Important"
        NICE_TO_HAVE = "nice_to_have", "Nice to Have"
    
    shot_list = models.ForeignKey(
        PhotoShotList,
        on_delete=models.CASCADE,
        related_name="shots"
    )
    
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    
    shot_type = models.CharField(
        max_length=20,
        choices=ShotType.choices
    )
    
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.IMPORTANT
    )
    
    # People in the shot
    people_description = models.TextField(blank=True, help_text="Who should be in this photo")
    guests = models.ManyToManyField(
        "wedding_planner.Guest",
        blank=True,
        related_name="required_photos"
    )
    
    # Location/timing
    location = models.CharField(max_length=200, blank=True)
    suggested_time = models.TimeField(null=True, blank=True)
    
    # Inspiration
    reference_image = models.ImageField(upload_to="photo_inspiration/", blank=True)
    reference_url = models.URLField(blank=True)
    
    is_completed = models.BooleanField(default=False)
    
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        verbose_name = "Photo Shot"
        verbose_name_plural = "Photo Shots"
        ordering = ["shot_type", "-priority", "order"]
    
    def __str__(self):
        return f"{self.get_priority_display()}: {self.title}"


class FamilyPhotoGroup(TimeStampedBaseModel):
    """Pre-defined family photo groupings"""
    
    shot_list = models.ForeignKey(
        PhotoShotList,
        on_delete=models.CASCADE,
        related_name="family_groups"
    )
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Which side
    side = models.CharField(
        max_length=10,
        choices=[
            ("bride", "Bride's Side"),
            ("groom", "Groom's Side"),
            ("both", "Both Sides"),
        ],
        default="both"
    )
    
    # People in this group
    guests = models.ManyToManyField(
        "wedding_planner.Guest",
        related_name="family_photo_groups"
    )
    
    order = models.PositiveIntegerField(default=0)
    is_completed = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = "Family Photo Group"
        verbose_name_plural = "Family Photo Groups"
        ordering = ["side", "order"]
    
    def __str__(self):
        return self.name
