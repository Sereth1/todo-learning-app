from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from config.models import TimeStampedBaseModel


def validate_image_size(image):
    """Validate image size is not bigger than 1MB"""
    if image and image.size > 1 * 1024 * 1024:  # 1MB in bytes
        raise ValidationError("Image file size must be less than 1MB")


class GiftRegistry(TimeStampedBaseModel):
    """Gift registry for the wedding"""
    
    # Link to wedding instead of event
    wedding = models.OneToOneField(
        "wedding_planner.Wedding",
        on_delete=models.CASCADE,
        related_name="registry",
        null=True,  # Temporarily nullable for migration
        blank=True
    )
    
    # Keep for backwards compatibility during migration
    event = models.OneToOneField(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="old_registry",
        null=True,
        blank=True
    )
    
    title = models.CharField(max_length=200, default="Our Gift Registry")
    message = models.TextField(blank=True, help_text="Message to display to guests")
    
    # Cash fund option
    accept_cash_gifts = models.BooleanField(default=True)
    cash_fund_title = models.CharField(max_length=200, default="Honeymoon Fund")
    cash_fund_description = models.TextField(blank=True)
    cash_fund_goal = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Visibility settings
    is_visible = models.BooleanField(default=True, help_text="Show registry to guests")
    show_prices = models.BooleanField(default=True, help_text="Show item prices to guests")
    allow_anonymous_claims = models.BooleanField(default=False, help_text="Allow claiming without guest code")
    
    class Meta:
        verbose_name = "Gift Registry"
        verbose_name_plural = "Gift Registries"
    
    def __str__(self):
        if self.wedding:
            return f"Registry for {self.wedding}"
        return f"Registry for {self.event.name}" if self.event else "Gift Registry"
    
    @property
    def total_received(self):
        return sum(gift.amount for gift in self.gifts.filter(is_received=True) if gift.amount)
    
    @property
    def total_items(self):
        return self.items.count()
    
    @property
    def claimed_items(self):
        return self.items.filter(is_claimed=True).count()
    
    @property
    def available_items(self):
        return self.items.filter(is_claimed=False, is_available=True).count()


class ExternalRegistry(TimeStampedBaseModel):
    """Links to external registries (Amazon, Target, etc.)"""
    
    registry = models.ForeignKey(
        GiftRegistry,
        on_delete=models.CASCADE,
        related_name="external_registries"
    )
    
    name = models.CharField(max_length=100, help_text="e.g., Amazon, Target, Crate & Barrel")
    url = models.URLField()
    logo = models.ImageField(upload_to="registry_logos/", blank=True)
    
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        verbose_name = "External Registry"
        verbose_name_plural = "External Registries"
        ordering = ["order"]
    
    def __str__(self):
        return self.name


class RegistryItem(TimeStampedBaseModel):
    """Custom registry items (for in-app registry) - Wishlist items guests can claim"""
    
    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
    
    class Category(models.TextChoices):
        KITCHEN = "kitchen", "Kitchen"
        BEDROOM = "bedroom", "Bedroom"
        BATHROOM = "bathroom", "Bathroom"
        LIVING_ROOM = "living_room", "Living Room"
        DINING = "dining", "Dining"
        GARDEN = "garden", "Garden"
        ELECTRONICS = "electronics", "Electronics"
        EXPERIENCES = "experiences", "Experiences"
        HONEYMOON = "honeymoon", "Honeymoon"
        HOME_DECOR = "home_decor", "Home Decor"
        OTHER = "other", "Other"
    
    registry = models.ForeignKey(
        GiftRegistry,
        on_delete=models.CASCADE,
        related_name="items"
    )
    
    # Item details
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    image = models.ImageField(
        upload_to="registry_items/", 
        blank=True,
        validators=[validate_image_size],
        help_text="Product image (max 1MB)"
    )
    
    # Product link
    external_url = models.URLField(
        blank=True, 
        max_length=500,
        help_text="Link to product page"
    )
    
    # Price info
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default="EUR")
    
    # Quantity management
    quantity_requested = models.PositiveIntegerField(default=1)
    quantity_received = models.PositiveIntegerField(default=0)
    
    # Categorization & Priority
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.OTHER,
    )
    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )
    
    # Group gift option
    is_group_gift = models.BooleanField(default=False, help_text="Allow multiple people to contribute")
    group_gift_collected = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Claim status - NEW FIELDS
    is_claimed = models.BooleanField(default=False)
    claimed_by = models.ForeignKey(
        "wedding_planner.Guest",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="claimed_registry_items",
        help_text="Guest who claimed this item"
    )
    claimed_at = models.DateTimeField(null=True, blank=True)
    claim_message = models.TextField(
        blank=True,
        help_text="Optional message from the guest who claimed the item"
    )
    
    # Visibility & Status
    is_available = models.BooleanField(default=True)
    is_visible = models.BooleanField(default=True, help_text="Show this item to guests")
    
    # Ordering
    display_order = models.PositiveIntegerField(default=0)
    
    class Meta:
        verbose_name = "Registry Item"
        verbose_name_plural = "Registry Items"
        ordering = ["display_order", "-priority", "-created_at"]
    
    def __str__(self):
        status = "✓ Claimed" if self.is_claimed else "Available"
        return f"{self.name} ({status})"
    
    @property
    def is_fulfilled(self):
        if self.is_group_gift:
            return self.group_gift_collected >= (self.price or 0)
        return self.quantity_received >= self.quantity_requested or self.is_claimed
    
    @property
    def claimed_by_name(self):
        """Return the name of the guest who claimed this item."""
        if self.claimed_by:
            return f"{self.claimed_by.first_name} {self.claimed_by.last_name}"
        return None
    
    @property
    def price_display(self):
        """Return formatted price string."""
        if self.price:
            return f"{self.currency} {self.price:.2f}"
        return None
    
    @property
    def group_gift_percentage(self):
        """Return percentage of group gift collected."""
        if self.is_group_gift and self.price:
            return min(100, int((self.group_gift_collected / self.price) * 100))
        return 0


class Gift(TimeStampedBaseModel):
    """Track received gifts"""
    
    registry = models.ForeignKey(
        GiftRegistry,
        on_delete=models.CASCADE,
        related_name="gifts"
    )
    registry_item = models.ForeignKey(
        RegistryItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="gifts"
    )
    
    # Who gave the gift
    guest = models.ForeignKey(
        "wedding_planner.Guest",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="gifts_given"
    )
    giver_name = models.CharField(max_length=200, blank=True, help_text="If not a guest")
    
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    is_received = models.BooleanField(default=False)
    received_at = models.DateField(null=True, blank=True)
    
    # Thank you tracking
    thank_you_sent = models.BooleanField(default=False)
    thank_you_sent_at = models.DateTimeField(null=True, blank=True)
    thank_you_note = models.TextField(blank=True)
    
    notes = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Gift"
        verbose_name_plural = "Gifts"
        ordering = ["-created_at"]
    
    def __str__(self):
        giver = self.guest or self.giver_name or "Anonymous"
        return f"Gift from {giver}"
