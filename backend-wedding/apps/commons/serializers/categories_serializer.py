from rest_framework import serializers

from apps.commons.models import Category


class CategoriesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "uid", "types", "created_at", "updated_at"]
        read_only_fields = ["id", "uid", "created_at", "updated_at"]

    def validate_types(self, value):
        if len(value) > 50:
            raise serializers.ValidationError(
                "Category type must be 50 characters or fewer."
            )
        return value
