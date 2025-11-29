from django.db import models
from django.conf import settings
from config.models import TimeStampedBaseModel
import uuid


class QRCode(TimeStampedBaseModel):
    """QR codes for various wedding elements"""
    
    class QRType(models.TextChoices):
        RSVP = "rsvp", "RSVP Link"
        WEBSITE = "website", "Wedding Website"
        TABLE = "table", "Table Info"
        MENU = "menu", "Menu"
        WIFI = "wifi", "WiFi"
        PLAYLIST = "playlist", "Music Playlist"
        PHOTO_ALBUM = "photo_album", "Photo Album"
        LIVESTREAM = "livestream", "Livestream"
        DIRECTIONS = "directions", "Venue Directions"
        SCHEDULE = "schedule", "Event Schedule"
    
    event = models.ForeignKey(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="qr_codes"
    )
    
    qr_type = models.CharField(
        max_length=20,
        choices=QRType.choices
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Target content
    target_url = models.URLField(blank=True)
    target_text = models.TextField(blank=True)  # For WiFi passwords, etc.
    
    # QR code image (generated)
    qr_image = models.ImageField(upload_to="qr_codes/", blank=True)
    
    # Customization
    foreground_color = models.CharField(max_length=7, default="#000000")
    background_color = models.CharField(max_length=7, default="#FFFFFF")
    logo = models.ImageField(upload_to="qr_logos/", blank=True)
    
    # Analytics
    scan_count = models.PositiveIntegerField(default=0)
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "QR Code"
        verbose_name_plural = "QR Codes"
    
    def __str__(self):
        return f"{self.title} ({self.get_qr_type_display()})"


class QRScan(TimeStampedBaseModel):
    """Track QR code scans"""
    
    qr_code = models.ForeignKey(
        QRCode,
        on_delete=models.CASCADE,
        related_name="scans"
    )
    
    # Optional guest tracking
    guest = models.ForeignKey(
        "wedding_planner.Guest",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    # Device/location info
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "QR Scan"
        verbose_name_plural = "QR Scans"
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"Scan of {self.qr_code.title}"


class Livestream(TimeStampedBaseModel):
    """Livestream configuration for virtual guests"""
    
    class Platform(models.TextChoices):
        YOUTUBE = "youtube", "YouTube"
        VIMEO = "vimeo", "Vimeo"
        ZOOM = "zoom", "Zoom"
        FACEBOOK = "facebook", "Facebook Live"
        INSTAGRAM = "instagram", "Instagram Live"
        CUSTOM = "custom", "Custom/Self-hosted"
    
    class Status(models.TextChoices):
        SCHEDULED = "scheduled", "Scheduled"
        LIVE = "live", "Live Now"
        ENDED = "ended", "Ended"
        CANCELLED = "cancelled", "Cancelled"
    
    event = models.ForeignKey(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="livestreams"
    )
    
    title = models.CharField(max_length=200, default="Wedding Ceremony")
    description = models.TextField(blank=True)
    
    platform = models.CharField(
        max_length=20,
        choices=Platform.choices,
        default=Platform.YOUTUBE
    )
    
    stream_url = models.URLField(blank=True)
    embed_code = models.TextField(blank=True)
    
    # For password-protected streams
    access_password = models.CharField(max_length=100, blank=True)
    
    scheduled_start = models.DateTimeField()
    scheduled_end = models.DateTimeField(null=True, blank=True)
    
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SCHEDULED
    )
    
    # Recording
    recording_url = models.URLField(blank=True)
    is_recording_available = models.BooleanField(default=False)
    
    # Analytics
    peak_viewers = models.PositiveIntegerField(default=0)
    total_unique_viewers = models.PositiveIntegerField(default=0)
    
    class Meta:
        verbose_name = "Livestream"
        verbose_name_plural = "Livestreams"
    
    def __str__(self):
        return self.title


class VirtualGuest(TimeStampedBaseModel):
    """Track virtual/remote guests watching livestream"""
    
    livestream = models.ForeignKey(
        Livestream,
        on_delete=models.CASCADE,
        related_name="virtual_guests"
    )
    
    guest = models.ForeignKey(
        "wedding_planner.Guest",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="virtual_attendance"
    )
    
    name = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    
    joined_at = models.DateTimeField(auto_now_add=True)
    left_at = models.DateTimeField(null=True, blank=True)
    
    # Device info
    device_type = models.CharField(max_length=50, blank=True)
    location = models.CharField(max_length=100, blank=True)
    
    sent_message = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = "Virtual Guest"
        verbose_name_plural = "Virtual Guests"
    
    def __str__(self):
        return self.name or str(self.guest) or "Anonymous Viewer"


class LiveChatMessage(TimeStampedBaseModel):
    """Chat messages during livestream"""
    
    livestream = models.ForeignKey(
        Livestream,
        on_delete=models.CASCADE,
        related_name="chat_messages"
    )
    
    virtual_guest = models.ForeignKey(
        VirtualGuest,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    
    sender_name = models.CharField(max_length=100)
    message = models.TextField()
    
    is_pinned = models.BooleanField(default=False)
    is_hidden = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = "Live Chat Message"
        verbose_name_plural = "Live Chat Messages"
        ordering = ["created_at"]
    
    def __str__(self):
        return f"{self.sender_name}: {self.message[:50]}"
