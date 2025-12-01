"""
Registry Serializers - Business logic for gift registry and wishlist.
All validation and claim/unclaim logic is handled here, not in views.
"""
from rest_framework import serializers
from django.utils import timezone
from django.db import transaction

from apps.wedding_planner.models.registry_model import (
    GiftRegistry, ExternalRegistry, RegistryItem, Gift
)
from apps.wedding_planner.models import Guest


# =============================================================================
# Registry Item Serializers (Wishlist)
# =============================================================================

class RegistryItemListSerializer(serializers.ModelSerializer):
    """List view - minimal data for grid/list display"""
    
    claimed_by_name = serializers.ReadOnlyField()
    price_display = serializers.ReadOnlyField()
    is_fulfilled = serializers.ReadOnlyField()
    group_gift_percentage = serializers.ReadOnlyField()
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = RegistryItem
        fields = [
            "id", "name", "description", "image_url", "external_url",
            "price", "currency", "price_display",
            "category", "priority", "display_order",
            "is_claimed", "claimed_by_name", "claimed_at",
            "is_group_gift", "group_gift_collected", "group_gift_percentage",
            "is_available", "is_visible", "is_fulfilled",
            "quantity_requested", "quantity_received",
        ]
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class RegistryItemDetailSerializer(serializers.ModelSerializer):
    """Detail view - full data including claim info"""
    
    claimed_by_name = serializers.ReadOnlyField()
    price_display = serializers.ReadOnlyField()
    is_fulfilled = serializers.ReadOnlyField()
    group_gift_percentage = serializers.ReadOnlyField()
    image_url = serializers.SerializerMethodField()
    registry_title = serializers.CharField(source="registry.title", read_only=True)
    
    class Meta:
        model = RegistryItem
        fields = [
            "id", "registry", "registry_title",
            "name", "description", "image", "image_url", "external_url",
            "price", "currency", "price_display",
            "category", "priority", "display_order",
            "is_claimed", "claimed_by", "claimed_by_name", "claimed_at", "claim_message",
            "is_group_gift", "group_gift_collected", "group_gift_percentage",
            "is_available", "is_visible", "is_fulfilled",
            "quantity_requested", "quantity_received",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "is_claimed", "claimed_by", "claimed_at", 
            "quantity_received", "group_gift_collected",
        ]
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class RegistryItemCreateSerializer(serializers.ModelSerializer):
    """Create/Update registry item - validation for image size"""
    
    # Default is_available to True for new items
    is_available = serializers.BooleanField(default=True, required=False)
    
    class Meta:
        model = RegistryItem
        fields = [
            "name", "description", "image", "external_url",
            "price", "currency", "category", "priority",
            "quantity_requested", "is_group_gift",
            "is_available", "is_visible", "display_order",
        ]
    
    def validate_image(self, value):
        """Validate image size is not bigger than 1MB"""
        if value and value.size > 1 * 1024 * 1024:
            raise serializers.ValidationError(
                "Image file size must be less than 1MB. "
                f"Your file is {value.size / 1024 / 1024:.2f}MB."
            )
        return value
    
    def validate_external_url(self, value):
        """Ensure URL is valid and accessible"""
        if value and not value.startswith(("http://", "https://")):
            raise serializers.ValidationError("URL must start with http:// or https://")
        return value
    
    def validate_price(self, value):
        """Ensure price is positive if provided"""
        if value is not None and value < 0:
            raise serializers.ValidationError("Price cannot be negative")
        return value


class RegistryItemClaimSerializer(serializers.Serializer):
    """
    Claim an item - all claim logic is here.
    Used by guests to claim items they will bring as gifts.
    """
    guest_code = serializers.CharField(
        required=True,
        help_text="Guest's unique invitation code"
    )
    message = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=500,
        help_text="Optional message from the guest"
    )
    
    def validate_guest_code(self, value):
        """Validate guest code and get guest"""
        try:
            guest = Guest.objects.get(user_code=value)
            self.guest = guest
            return value
        except Guest.DoesNotExist:
            raise serializers.ValidationError("Invalid guest code")
    
    def validate(self, attrs):
        """Check if item can be claimed"""
        item = self.context.get("item")
        
        if not item:
            raise serializers.ValidationError("Item not found")
        
        if item.is_claimed:
            raise serializers.ValidationError({
                "non_field_errors": [
                    f"This item has already been claimed by {item.claimed_by_name or 'another guest'}"
                ]
            })
        
        if not item.is_available:
            raise serializers.ValidationError({
                "non_field_errors": ["This item is not available"]
            })
        
        if not item.is_visible:
            raise serializers.ValidationError({
                "non_field_errors": ["This item is not available"]
            })
        
        # Check guest belongs to the same wedding
        if item.registry.wedding_id != self.guest.wedding_id:
            raise serializers.ValidationError({
                "guest_code": ["This code is not valid for this wedding"]
            })
        
        return attrs
    
    @transaction.atomic
    def save(self):
        """Claim the item and notify the wedding owner"""
        from apps.wedding_planner.services.notification_service import NotificationService
        
        item = self.context.get("item")
        message = self.validated_data.get("message", "")
        
        item.is_claimed = True
        item.claimed_by = self.guest
        item.claimed_at = timezone.now()
        item.claim_message = message
        item.save(update_fields=[
            "is_claimed", "claimed_by", "claimed_at", "claim_message", "updated_at"
        ])
        
        # Create notification for wedding owner
        wedding = item.registry.wedding
        NotificationService.create_gift_claimed_notification(
            user=wedding.owner,
            wedding=wedding,
            guest=self.guest,
            item=item,
        )
        
        return item


class RegistryItemUnclaimSerializer(serializers.Serializer):
    """
    Unclaim an item - allows guest to release their claim.
    """
    guest_code = serializers.CharField(
        required=True,
        help_text="Guest's unique invitation code"
    )
    
    def validate_guest_code(self, value):
        """Validate guest code and get guest"""
        try:
            guest = Guest.objects.get(user_code=value)
            self.guest = guest
            return value
        except Guest.DoesNotExist:
            raise serializers.ValidationError("Invalid guest code")
    
    def validate(self, attrs):
        """Check if guest can unclaim this item"""
        item = self.context.get("item")
        
        if not item:
            raise serializers.ValidationError("Item not found")
        
        if not item.is_claimed:
            raise serializers.ValidationError({
                "non_field_errors": ["This item is not claimed"]
            })
        
        if item.claimed_by_id != self.guest.id:
            raise serializers.ValidationError({
                "non_field_errors": ["You can only unclaim items you have claimed"]
            })
        
        return attrs
    
    @transaction.atomic
    def save(self):
        """Unclaim the item and notify the wedding owner"""
        from apps.wedding_planner.services.notification_service import NotificationService
        
        item = self.context.get("item")
        wedding = item.registry.wedding
        
        # Create notification before clearing guest reference
        NotificationService.create_gift_unclaimed_notification(
            user=wedding.owner,
            wedding=wedding,
            guest=self.guest,
            item=item,
        )
        
        item.is_claimed = False
        item.claimed_by = None
        item.claimed_at = None
        item.claim_message = ""
        item.save(update_fields=[
            "is_claimed", "claimed_by", "claimed_at", "claim_message", "updated_at"
        ])
        
        return item


class RegistryItemContributeSerializer(serializers.Serializer):
    """
    Contribute to a group gift.
    """
    guest_code = serializers.CharField(required=True)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    message = serializers.CharField(required=False, allow_blank=True, max_length=500)
    
    def validate_guest_code(self, value):
        try:
            guest = Guest.objects.get(user_code=value)
            self.guest = guest
            return value
        except Guest.DoesNotExist:
            raise serializers.ValidationError("Invalid guest code")
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
        return value
    
    def validate(self, attrs):
        item = self.context.get("item")
        
        if not item:
            raise serializers.ValidationError("Item not found")
        
        if not item.is_group_gift:
            raise serializers.ValidationError({
                "non_field_errors": ["This item is not a group gift"]
            })
        
        if not item.is_available or not item.is_visible:
            raise serializers.ValidationError({
                "non_field_errors": ["This item is not available"]
            })
        
        if item.registry.wedding_id != self.guest.wedding_id:
            raise serializers.ValidationError({
                "guest_code": ["This code is not valid for this wedding"]
            })
        
        return attrs
    
    @transaction.atomic
    def save(self):
        item = self.context.get("item")
        amount = self.validated_data["amount"]
        message = self.validated_data.get("message", "")
        
        # Update collected amount
        item.group_gift_collected += amount
        item.save(update_fields=["group_gift_collected", "updated_at"])
        
        # Create a Gift record for tracking
        Gift.objects.create(
            registry=item.registry,
            registry_item=item,
            guest=self.guest,
            amount=amount,
            description=message or f"Contribution to {item.name}",
            is_received=False,
        )
        
        return item


# =============================================================================
# Public Serializers (for guest-facing views)
# =============================================================================

class RegistryItemPublicSerializer(serializers.ModelSerializer):
    """
    Public view of registry items - for guests viewing the wishlist.
    Hides sensitive info like who claimed (shows only if claimed or not).
    """
    
    price_display = serializers.ReadOnlyField()
    is_fulfilled = serializers.ReadOnlyField()
    group_gift_percentage = serializers.ReadOnlyField()
    image_url = serializers.SerializerMethodField()
    # Only show if current guest claimed it
    is_claimed_by_me = serializers.SerializerMethodField()
    
    class Meta:
        model = RegistryItem
        fields = [
            "id", "name", "description", "image_url", "external_url",
            "price", "currency", "price_display",
            "category", "priority",
            "is_claimed", "is_claimed_by_me",
            "is_group_gift", "group_gift_percentage",
            "is_available", "is_fulfilled",
        ]
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
    def get_is_claimed_by_me(self, obj):
        """Check if the current guest claimed this item"""
        guest = self.context.get("guest")
        if guest and obj.is_claimed and obj.claimed_by_id == guest.id:
            return True
        return False


# =============================================================================
# Gift Registry Serializers
# =============================================================================

class ExternalRegistrySerializer(serializers.ModelSerializer):
    """External registry links (Amazon, Target, etc.)"""
    
    logo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ExternalRegistry
        fields = ["id", "name", "url", "logo", "logo_url", "order"]
    
    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None


class GiftRegistrySerializer(serializers.ModelSerializer):
    """Gift registry with stats"""
    
    total_items = serializers.ReadOnlyField()
    claimed_items = serializers.ReadOnlyField()
    available_items = serializers.ReadOnlyField()
    total_received = serializers.ReadOnlyField()
    external_registries = ExternalRegistrySerializer(many=True, read_only=True)
    
    class Meta:
        model = GiftRegistry
        fields = [
            "id", "title", "message",
            "accept_cash_gifts", "cash_fund_title", "cash_fund_description", "cash_fund_goal",
            "is_visible", "show_prices", "allow_anonymous_claims",
            "total_items", "claimed_items", "available_items", "total_received",
            "external_registries",
            "created_at", "updated_at",
        ]
        read_only_fields = ["total_items", "claimed_items", "available_items", "total_received"]


class GiftRegistryPublicSerializer(serializers.ModelSerializer):
    """Public view of gift registry for guests"""
    
    total_items = serializers.ReadOnlyField()
    claimed_items = serializers.ReadOnlyField()
    available_items = serializers.ReadOnlyField()
    external_registries = ExternalRegistrySerializer(many=True, read_only=True)
    
    class Meta:
        model = GiftRegistry
        fields = [
            "id", "title", "message",
            "accept_cash_gifts", "cash_fund_title", "cash_fund_description",
            "show_prices",
            "total_items", "claimed_items", "available_items",
            "external_registries",
        ]


# =============================================================================
# Gift Tracking Serializers
# =============================================================================

class GiftSerializer(serializers.ModelSerializer):
    """Track received gifts"""
    
    guest_name = serializers.SerializerMethodField()
    registry_item_name = serializers.CharField(source="registry_item.name", read_only=True)
    
    class Meta:
        model = Gift
        fields = [
            "id", "registry", "registry_item", "registry_item_name",
            "guest", "guest_name", "giver_name",
            "description", "amount",
            "is_received", "received_at",
            "thank_you_sent", "thank_you_sent_at", "thank_you_note",
            "notes", "created_at",
        ]
    
    def get_guest_name(self, obj):
        if obj.guest:
            return f"{obj.guest.first_name} {obj.guest.last_name}"
        return obj.giver_name or "Anonymous"


# =============================================================================
# Dashboard Serializer (Combined endpoint)
# =============================================================================

class RegistryDashboardSerializer(serializers.Serializer):
    """
    Combined dashboard data for registry management.
    Single API call for all registry data.
    """
    registry = GiftRegistrySerializer()
    items = RegistryItemListSerializer(many=True)
    stats = serializers.DictField()
    filters = serializers.DictField()
