"""
Restaurant Access Token Model

Allows wedding owners to share a secure UUID token with restaurants/caterers
so they can manage tables (seating layout) and meals (menu options)
without having full access to the wedding dashboard.
"""
import uuid
from django.db import models
from django.utils import timezone
from datetime import timedelta
from config.models import TimeStampedBaseModel


class RestaurantAccessToken(TimeStampedBaseModel):
    """
    Secure token that grants restaurant staff limited access to manage:
    - Tables (name, capacity, location - NOT category which is for guest assignment)
    - Meals (menu items, allergens, images)
    
    The token can be shared via a simple URL: /restaurant/{access_code}/
    """
    
    # Link to the wedding
    wedding = models.ForeignKey(
        "wedding_planner.Wedding",
        on_delete=models.CASCADE,
        related_name="restaurant_access_tokens"
    )
    
    # Unique access code (UUID) - this is what gets shared
    access_code = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
        db_index=True,
        verbose_name="Access Code"
    )
    
    # Human-readable name for this token (e.g., "Main Caterer", "Venue Restaurant")
    name = models.CharField(
        max_length=100,
        verbose_name="Token Name",
        help_text="A friendly name to identify this access (e.g., 'Main Restaurant')"
    )
    
    # Restaurant/caterer contact info (optional)
    restaurant_name = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="Restaurant Name"
    )
    contact_email = models.EmailField(
        blank=True,
        verbose_name="Contact Email"
    )
    contact_phone = models.CharField(
        max_length=20,
        blank=True,
        verbose_name="Contact Phone"
    )
    
    # Permission flags - granular control over what they can do
    can_manage_tables = models.BooleanField(
        default=True,
        verbose_name="Can Manage Tables",
        help_text="Allow creating/editing table names, capacity, and location"
    )
    can_manage_meals = models.BooleanField(
        default=True,
        verbose_name="Can Manage Meals",
        help_text="Allow creating/editing menu items and allergens"
    )
    can_view_guest_count = models.BooleanField(
        default=True,
        verbose_name="Can View Guest Count",
        help_text="Allow viewing total confirmed guest count (no names/details)"
    )
    
    # Token lifecycle
    is_active = models.BooleanField(
        default=True,
        verbose_name="Is Active"
    )
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Expires At",
        help_text="Leave blank for no expiration"
    )
    
    # Usage tracking
    last_accessed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Last Accessed"
    )
    access_count = models.PositiveIntegerField(
        default=0,
        verbose_name="Access Count"
    )
    
    # Notes
    notes = models.TextField(
        blank=True,
        help_text="Internal notes about this access token"
    )
    
    class Meta:
        verbose_name = "Restaurant Access Token"
        verbose_name_plural = "Restaurant Access Tokens"
        ordering = ["-created_at"]
    
    def __str__(self):
        status = "active" if self.is_valid else "inactive"
        return f"{self.name} ({status}) - {self.wedding}"
    
    @property
    def is_valid(self) -> bool:
        """Check if the token is currently valid."""
        if not self.is_active:
            return False
        if self.expires_at and timezone.now() > self.expires_at:
            return False
        return True
    
    @property
    def is_expired(self) -> bool:
        """Check if the token has expired."""
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False
    
    def record_access(self):
        """Record that this token was used."""
        self.last_accessed_at = timezone.now()
        self.access_count += 1
        self.save(update_fields=["last_accessed_at", "access_count"])
    
    def regenerate_code(self):
        """Generate a new access code (invalidates old links)."""
        self.access_code = uuid.uuid4()
        self.save(update_fields=["access_code"])
        return self.access_code
    
    @classmethod
    def create_for_wedding(cls, wedding, name="Restaurant Access", days_valid=3):
        """
        Factory method to create a new access token for a wedding.
        
        Args:
            wedding: The Wedding instance
            name: Friendly name for this token
            days_valid: Number of days until expiration (None for no expiration, default 3 days)
        """
        expires_at = None
        if days_valid:
            expires_at = timezone.now() + timedelta(days=days_valid)
        
        return cls.objects.create(
            wedding=wedding,
            name=name,
            expires_at=expires_at
        )
