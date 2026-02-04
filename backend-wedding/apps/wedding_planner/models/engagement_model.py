from django.db import models
from django.conf import settings
from config.models import TimeStampedBaseModel
import uuid


class PhotoAlbum(TimeStampedBaseModel):
    """Shared photo albums for guests"""
    
    event = models.ForeignKey(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="photo_albums"
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    cover_photo = models.ImageField(upload_to="album_covers/", blank=True)
    
    # Access control
    is_public = models.BooleanField(default=False)
    allow_guest_uploads = models.BooleanField(default=True)
    require_approval = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = "Photo Album"
        verbose_name_plural = "Photo Albums"
    
    def __str__(self):
        return self.title
    
    @property
    def photo_count(self):
        return self.photos.filter(is_approved=True).count()


class Photo(TimeStampedBaseModel):
    """Individual photos in albums"""
    
    album = models.ForeignKey(
        PhotoAlbum,
        on_delete=models.CASCADE,
        related_name="photos"
    )
    
    image = models.ImageField(upload_to="wedding_photos/")
    thumbnail = models.ImageField(upload_to="wedding_photos/thumbs/", blank=True)
    
    caption = models.TextField(blank=True)
    
    # Who uploaded
    uploaded_by_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_photos"
    )
    uploaded_by_guest = models.ForeignKey(
        "wedding_planner.Guest",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_photos"
    )
    
    is_approved = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    
    # Engagement
    like_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        verbose_name = "Photo"
        verbose_name_plural = "Photos"
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"Photo in {self.album.title}"


class PhotoComment(TimeStampedBaseModel):
    """Comments on photos"""
    
    photo = models.ForeignKey(
        Photo,
        on_delete=models.CASCADE,
        related_name="comments"
    )
    
    # Who commented
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    guest = models.ForeignKey(
        "wedding_planner.Guest",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    guest_name = models.CharField(max_length=100, blank=True)
    
    content = models.TextField()
    
    is_approved = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Photo Comment"
        verbose_name_plural = "Photo Comments"
        ordering = ["created_at"]
    
    def __str__(self):
        return f"Comment on {self.photo}"


class PhotoReaction(TimeStampedBaseModel):
    """Reactions/likes on photos"""
    
    class ReactionType(models.TextChoices):
        LIKE = "like", "❤️"
        LOVE = "love", "😍"
        LAUGH = "laugh", "😂"
        WOW = "wow", "😮"
        CONGRATS = "congrats", "🎉"
    
    photo = models.ForeignKey(
        Photo,
        on_delete=models.CASCADE,
        related_name="reactions"
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    guest = models.ForeignKey(
        "wedding_planner.Guest",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    reaction_type = models.CharField(
        max_length=10,
        choices=ReactionType.choices,
        default=ReactionType.LIKE
    )
    
    class Meta:
        verbose_name = "Photo Reaction"
        verbose_name_plural = "Photo Reactions"
        unique_together = [("photo", "user"), ("photo", "guest")]


class GuestMessage(TimeStampedBaseModel):
    """Messages/wishes from guests (guestbook)"""
    
    event = models.ForeignKey(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="guest_messages"
    )
    
    guest = models.ForeignKey(
        "wedding_planner.Guest",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    guest_name = models.CharField(max_length=100, blank=True)
    
    message = models.TextField()
    
    # Optional video/audio message
    video = models.FileField(upload_to="guest_videos/", blank=True)
    audio = models.FileField(upload_to="guest_audio/", blank=True)
    
    is_approved = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = "Guest Message"
        verbose_name_plural = "Guest Messages"
        ordering = ["-created_at"]
    
    def __str__(self):
        name = self.guest or self.guest_name or "Anonymous"
        return f"Message from {name}"
