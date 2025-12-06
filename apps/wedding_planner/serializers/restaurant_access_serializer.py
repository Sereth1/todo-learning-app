"""
Restaurant Access Serializers

Serializers for managing restaurant access tokens and for the restaurant portal itself.
"""
import json
from rest_framework import serializers
from ..models import RestaurantAccessToken, Table, MealChoice, Guest


class FlexibleJSONField(serializers.Field):
    """
    A field that accepts both JSON strings and native Python objects.
    Useful for handling FormData where JSON gets sent as a string.
    """
    def to_internal_value(self, data):
        if data is None or data == '':
            return []
        if isinstance(data, str):
            try:
                return json.loads(data)
            except json.JSONDecodeError:
                return []
        if isinstance(data, list):
            return data
        return []
    
    def to_representation(self, value):
        return value or []


class RestaurantAccessTokenSerializer(serializers.ModelSerializer):
    """
    Serializer for wedding owners to manage their restaurant access tokens.
    """
    access_url = serializers.SerializerMethodField()
    is_valid = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField()
    
    class Meta:
        model = RestaurantAccessToken
        fields = [
            "id",
            "uid",
            "access_code",
            "access_url",
            "name",
            "restaurant_name",
            "contact_email",
            "contact_phone",
            "can_manage_tables",
            "can_manage_meals",
            "can_view_guest_count",
            "is_active",
            "is_valid",
            "is_expired",
            "expires_at",
            "last_accessed_at",
            "access_count",
            "notes",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "uid",
            "access_code",
            "access_url",
            "is_valid",
            "is_expired",
            "last_accessed_at",
            "access_count",
            "created_at",
        ]
    
    def get_access_url(self, obj):
        """Generate the shareable URL for the restaurant portal."""
        request = self.context.get("request")
        if request:
            # Build the frontend URL
            # Format: /restaurant/{access_code}
            return f"/restaurant/{obj.access_code}"
        return f"/restaurant/{obj.access_code}"


class RestaurantAccessTokenCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new restaurant access tokens.
    """
    days_valid = serializers.IntegerField(
        required=False,
        default=90,
        min_value=1,
        max_value=365,
        help_text="Number of days until the token expires (1-365, default 3 days)"
    )
    
    class Meta:
        model = RestaurantAccessToken
        fields = [
            "name",
            "restaurant_name",
            "contact_email",
            "contact_phone",
            "can_manage_tables",
            "can_manage_meals",
            "can_view_guest_count",
            "days_valid",
            "notes",
        ]


# =====================================================
# Restaurant Portal Serializers (used by restaurants)
# =====================================================

class RestaurantPortalInfoSerializer(serializers.Serializer):
    """
    Information shown to the restaurant when they access the portal.
    """
    wedding_name = serializers.CharField()
    wedding_date = serializers.DateField()
    token_name = serializers.CharField()
    can_manage_tables = serializers.BooleanField()
    can_manage_meals = serializers.BooleanField()
    can_view_guest_count = serializers.BooleanField()
    confirmed_guest_count = serializers.IntegerField(required=False)


class RestaurantTableSerializer(serializers.ModelSerializer):
    """
    Serializer for tables - used by restaurants.
    Note: table_category is READ-ONLY for restaurants (they can see it but not change it).
    """
    seats_taken = serializers.ReadOnlyField()
    seats_available = serializers.ReadOnlyField()
    is_full = serializers.ReadOnlyField()
    table_category_display = serializers.CharField(
        source="get_table_category_display",
        read_only=True
    )
    
    class Meta:
        model = Table
        fields = [
            "id",
            "uid",
            "table_number",
            "name",
            "capacity",
            "location",
            "notes",
            "is_vip",
            "table_category",  # Read-only for restaurants
            "table_category_display",
            "seats_taken",
            "seats_available",
            "is_full",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "uid",
            "table_category",  # Restaurants cannot change the guest category
            "table_category_display",
            "seats_taken",
            "seats_available",
            "is_full",
            "created_at",
            "updated_at",
        ]


class RestaurantTableCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for restaurants creating tables.
    They can set: table_number, name, capacity, location, notes, is_vip
    They CANNOT set: table_category (that's for the couple to organize guests)
    """
    
    class Meta:
        model = Table
        fields = [
            "table_number",
            "name",
            "capacity",
            "location",
            "notes",
            "is_vip",
        ]
    
    def validate_table_number(self, value):
        """Ensure table number is unique within the wedding."""
        wedding = self.context.get("wedding")
        if wedding:
            existing = Table.objects.filter(wedding=wedding, table_number=value)
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            if existing.exists():
                raise serializers.ValidationError(
                    f"Table {value} already exists for this wedding."
                )
        return value


class RestaurantMealSerializer(serializers.ModelSerializer):
    """
    Serializer for meals - used by restaurants.
    """
    meal_type_display = serializers.CharField(
        source="get_meal_type_display",
        read_only=True
    )
    request_status_display = serializers.CharField(
        source="get_request_status_display",
        read_only=True
    )
    restaurant_status_display = serializers.CharField(
        source="get_restaurant_status_display",
        read_only=True
    )
    client_status_display = serializers.CharField(
        source="get_client_status_display",
        read_only=True
    )
    created_by_display = serializers.CharField(
        source="get_created_by_display",
        read_only=True
    )
    overall_status = serializers.ReadOnlyField()
    needs_restaurant_approval = serializers.ReadOnlyField()
    needs_client_approval = serializers.ReadOnlyField()
    allergen_display = serializers.ReadOnlyField()
    is_allergen_free = serializers.ReadOnlyField()
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = MealChoice
        fields = [
            "id",
            "uid",
            "name",
            "description",
            "meal_type",
            "meal_type_display",
            "contains_allergens",
            "allergen_display",
            "is_allergen_free",
            "image",
            "image_url",
            "is_available",
            # Created by info
            "created_by",
            "created_by_display",
            # Two-way approval
            "restaurant_status",
            "restaurant_status_display",
            "restaurant_decline_reason",
            "restaurant_status_updated_at",
            "client_status",
            "client_status_display",
            "client_decline_reason",
            "client_status_updated_at",
            # Overall/legacy status
            "request_status",
            "request_status_display",
            "overall_status",
            "needs_restaurant_approval",
            "needs_client_approval",
            "decline_reason",
            "status_updated_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "uid",
            "allergen_display",
            "is_allergen_free",
            "status_updated_at",
            "restaurant_status_updated_at",
            "client_status_updated_at",
            "created_at",
            "updated_at",
        ]
    
    def get_image_url(self, obj):
        """Return full URL for the meal image."""
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class RestaurantMealCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for restaurants creating meals.
    """
    contains_allergens = FlexibleJSONField(required=False)
    is_available = serializers.BooleanField(required=False, default=True)
    
    class Meta:
        model = MealChoice
        fields = [
            "name",
            "description",
            "meal_type",
            "contains_allergens",
            "image",
            "is_available",
        ]
    
    def validate_is_available(self, value):
        """Handle string boolean from FormData."""
        if isinstance(value, str):
            return value.lower() in ('true', '1', 'yes')
        return bool(value)
    
    def validate_contains_allergens(self, value):
        """Validate that allergens are valid choices."""
        if value:
            valid_allergens = [choice[0] for choice in MealChoice.Allergen.choices]
            for allergen in value:
                if allergen not in valid_allergens:
                    raise serializers.ValidationError(
                        f"Invalid allergen: {allergen}. Valid options: {valid_allergens}"
                    )
        return value or []
