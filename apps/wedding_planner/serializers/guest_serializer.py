from rest_framework import serializers
from apps.wedding_planner.models.guest_model import Guest  
from .guest_child_serializer import ChildSerializer


class GuestMealSelectionSummarySerializer(serializers.Serializer):
    """Summary serializer for guest meal selection (for guest list)"""
    meal_name = serializers.CharField(source='meal_choice.name', allow_null=True)
    meal_type = serializers.CharField(source='meal_choice.meal_type', allow_null=True)
    meal_type_display = serializers.CharField(source='meal_choice.get_meal_type_display', allow_null=True)


class GuestClaimedGiftSerializer(serializers.Serializer):
    """Summary serializer for gift claimed by guest"""
    id = serializers.IntegerField()
    name = serializers.CharField()
    category = serializers.CharField(source='get_category_display', allow_null=True)


class GuestSerializer(serializers.ModelSerializer):
    """Serializer for Guest model with nested children"""
    children = ChildSerializer(source='child_set', many=True, read_only=True)
    full_name = serializers.SerializerMethodField()
    table_assignment = serializers.SerializerMethodField()
    guest_type_display = serializers.SerializerMethodField()
    family_relationship_display = serializers.SerializerMethodField()
    relationship_tier_display = serializers.SerializerMethodField()
    meal_selection = serializers.SerializerMethodField()
    claimed_gifts = serializers.SerializerMethodField()
    
    class Meta:
        model = Guest
        fields = [
            "id",
            "uid",
            "wedding",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "guest_type",
            "guest_type_display",
            "family_relationship",
            "family_relationship_display",
            "relationship_tier",
            "relationship_tier_display",
            "is_plus_one_coming",
            "plus_one_name",
            "has_children",
            "children",
            "attendance_status",
            "user_code",
            "table_assignment",
            "meal_selection",
            "claimed_gifts",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "uid", "user_code", "created_at", "updated_at"]
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
    
    def get_table_assignment(self, obj):
        """Get the table ID if guest has a seating assignment (primary guest only)."""
        from apps.wedding_planner.models.seating_model import SeatingAssignment
        try:
            # Get assignment for the primary guest (not plus_one or child)
            assignment = SeatingAssignment.objects.filter(
                guest=obj, 
                attendee_type="guest"
            ).first()
            return assignment.table_id if assignment else None
        except SeatingAssignment.DoesNotExist:
            return None
    
    def get_meal_selection(self, obj):
        """Get the guest's meal selection summary."""
        try:
            selection = obj.meal_selection
            if selection and selection.meal_choice:
                return {
                    "meal_name": selection.meal_choice.name,
                    "meal_type": selection.meal_choice.meal_type,
                    "meal_type_display": selection.meal_choice.get_meal_type_display(),
                }
        except Exception:
            pass
        return None
    
    def get_claimed_gifts(self, obj):
        """Get the gifts claimed by this guest."""
        from apps.wedding_planner.models.registry_model import RegistryItem
        try:
            claimed_items = RegistryItem.objects.filter(claimed_by=obj)
            return [
                {
                    "id": item.id,
                    "name": item.name,
                    "category": item.get_category_display() if item.category else None,
                }
                for item in claimed_items
            ]
        except Exception:
            return []
    
    def get_guest_type_display(self, obj):
        return obj.get_guest_type_display() if obj.guest_type else None
    
    def get_family_relationship_display(self, obj):
        return obj.get_family_relationship_display() if obj.family_relationship else None
    
    def get_relationship_tier_display(self, obj):
        return obj.get_relationship_tier_display() if obj.relationship_tier else None


class GuestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating guests - wedding is set from context"""
    
    class Meta:
        model = Guest
        fields = [
            "first_name",
            "last_name",
            "email",
            "guest_type",
            "family_relationship",
            "relationship_tier",
            "is_plus_one_coming",
            "has_children",
            "attendance_status",
        ]
    
    def create(self, validated_data):
        # Wedding should be set from the view context
        wedding = self.context.get("wedding")
        if wedding:
            validated_data["wedding"] = wedding
        return super().create(validated_data)


class GuestPublicSerializer(serializers.ModelSerializer):
    """Public serializer for guests (for RSVP page)"""
    full_name = serializers.SerializerMethodField()
    children = ChildSerializer(source='child_set', many=True, read_only=True)
    
    class Meta:
        model = Guest
        fields = [
            "id",
            "uid",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "is_plus_one_coming",
            "plus_one_name",
            "has_children",
            "children",
            "attendance_status",
            "dietary_restrictions",
            "user_code",
        ]
        read_only_fields = ["id", "uid", "first_name", "last_name", "email", "user_code"]
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"


class GuestRSVPSerializer(serializers.ModelSerializer):
    """Serializer for guest RSVP updates"""
    
    class Meta:
        model = Guest
        fields = [
            "attendance_status",
            "is_plus_one_coming",
            "has_children",
        ]