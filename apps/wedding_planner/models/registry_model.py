from django.db import models
from django.conf import settings
from config.models import TimeStampedBaseModel


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
    
    class Meta:
        verbose_name = "Gift Registry"
        verbose_name_plural = "Gift Registries"
    
    def __str__(self):
        return f"Registry for {self.event.name}"
    
    @property
    def total_received(self):
        return sum(gift.amount for gift in self.gifts.filter(is_received=True) if gift.amount)


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
    """Custom registry items (for in-app registry)"""
    
    registry = models.ForeignKey(
        GiftRegistry,
        on_delete=models.CASCADE,
        related_name="items"
    )
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="registry_items/", blank=True)
    
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    quantity_requested = models.PositiveIntegerField(default=1)
    quantity_received = models.PositiveIntegerField(default=0)
    
    external_url = models.URLField(blank=True, help_text="Link to purchase")
    
    is_group_gift = models.BooleanField(default=False, help_text="Allow multiple people to contribute")
    group_gift_collected = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    is_available = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Registry Item"
        verbose_name_plural = "Registry Items"
    
    def __str__(self):
        return self.name
    
    @property
    def is_fulfilled(self):
        if self.is_group_gift:
            return self.group_gift_collected >= (self.price or 0)
        return self.quantity_received >= self.quantity_requested


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
