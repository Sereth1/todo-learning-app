from rest_framework import serializers
from apps.wedding_planner.models.guest_model import Guest  
from .guest_child_serializer import ChildSerializer


class GuestSerializer(serializers.ModelSerializer):
    """Serializer for Guest model with nested children"""
    children = ChildSerializer(source='child_set', many=True, read_only=True)
    full_name = serializers.SerializerMethodField()
    
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
            "is_plus_one_coming",
            "has_children",
            "attendance_status",
            "user_code",
            "children",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "uid", "user_code", "created_at", "updated_at"]
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"


class GuestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating guests - wedding is set from context"""
    
    class Meta:
        model = Guest
        fields = [
            "first_name",
            "last_name",
            "email",
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
    
    class Meta:
        model = Guest
        fields = [
            "uid",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "is_plus_one_coming",
            "has_children",
            "attendance_status",
            "user_code",
        ]
        read_only_fields = ["uid", "first_name", "last_name", "email", "user_code"]
    
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