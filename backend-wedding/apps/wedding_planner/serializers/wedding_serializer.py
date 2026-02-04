from rest_framework import serializers
from apps.wedding_planner.models import Wedding


class WeddingSerializer(serializers.ModelSerializer):
    """Serializer for Wedding model"""
    
    display_name = serializers.ReadOnlyField()
    guest_count = serializers.ReadOnlyField()
    confirmed_guest_count = serializers.ReadOnlyField()
    
    class Meta:
        model = Wedding
        fields = [
            "id",
            "uid",
            "partner1_name",
            "partner2_name",
            "slug",
            "wedding_date",
            "status",
            "is_website_public",
            "primary_color",
            "secondary_color",
            "cover_image_url",
            "public_code",
            "display_name",
            "guest_count",
            "confirmed_guest_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "uid", "public_code", "created_at", "updated_at"]


class WeddingCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new Wedding"""
    
    class Meta:
        model = Wedding
        fields = [
            "partner1_name",
            "partner2_name",
            "slug",
            "wedding_date",
        ]
    
    def create(self, validated_data):
        # Automatically set the owner to the current user
        validated_data["owner"] = self.context["request"].user
        return super().create(validated_data)


class WeddingPublicSerializer(serializers.ModelSerializer):
    """Public serializer for Wedding (for guests visiting the wedding website)"""
    
    display_name = serializers.ReadOnlyField()
    
    class Meta:
        model = Wedding
        fields = [
            "uid",
            "partner1_name",
            "partner2_name",
            "slug",
            "wedding_date",
            "display_name",
            "primary_color",
            "secondary_color",
            "cover_image_url",
        ]
