from rest_framework import serializers
from apps.wedding_planner.models.meal_model import (
    DietaryRestriction,
    MealChoice,
    GuestMealSelection,
)


class DietaryRestrictionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DietaryRestriction
        fields = ["id", "uid", "name", "description", "icon"]
        read_only_fields = ["uid"]


class MealChoiceSerializer(serializers.ModelSerializer):
    meal_type_display = serializers.CharField(
        source="get_meal_type_display", read_only=True
    )
    allergen_display = serializers.ReadOnlyField()
    is_allergen_free = serializers.ReadOnlyField()
    allergen_choices = serializers.SerializerMethodField()
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
            "allergen_choices",
            "image",
            "image_url",
            "is_available",
            "max_quantity",
        ]
        read_only_fields = ["uid"]
    
    def get_allergen_choices(self, obj):
        """Return all available allergen choices for frontend dropdowns."""
        return [
            {"value": choice[0], "label": choice[1]}
            for choice in MealChoice.Allergen.choices
        ]
    
    def get_image_url(self, obj):
        """Return full URL for the image."""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class GuestMealSelectionSerializer(serializers.ModelSerializer):
    meal_choice_detail = MealChoiceSerializer(source="meal_choice", read_only=True)
    dietary_restrictions_detail = DietaryRestrictionSerializer(
        source="dietary_restrictions", many=True, read_only=True
    )
    guest_name = serializers.SerializerMethodField()
    
    class Meta:
        model = GuestMealSelection
        fields = [
            "id",
            "uid",
            "guest",
            "guest_name",
            "meal_choice",
            "meal_choice_detail",
            "dietary_restrictions",
            "dietary_restrictions_detail",
            "allergies",
            "special_requests",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["uid", "created_at", "updated_at"]
    
    def get_guest_name(self, obj):
        return f"{obj.guest.first_name} {obj.guest.last_name}"
