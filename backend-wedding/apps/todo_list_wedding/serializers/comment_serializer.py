"""
TodoComment serializer.
"""
from rest_framework import serializers

from apps.todo_list_wedding.models import TodoComment


class TodoCommentSerializer(serializers.ModelSerializer):
    """
    Serializer for todo comments with author information.
    """
    author_name = serializers.SerializerMethodField()
    author_email = serializers.EmailField(source="author.email", read_only=True)
    
    class Meta:
        model = TodoComment
        fields = [
            "id",
            "uid",
            "todo",
            "author",
            "author_name",
            "author_email",
            "content",
            "is_edited",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "uid", "author", "is_edited", "created_at", "updated_at"]

    def get_author_name(self, obj) -> str:
        """Get author's display name."""
        if obj.author:
            name = f"{obj.author.first_name} {obj.author.last_name}".strip()
            return name if name else obj.author.email
        return "Unknown"

    def validate_content(self, value):
        """Ensure comment is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("Comment cannot be empty.")
        return value.strip()

    def create(self, validated_data):
        """Set author from request context."""
        request = self.context.get("request")
        if request and request.user:
            validated_data["author"] = request.user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Mark as edited when content changes."""
        if "content" in validated_data and validated_data["content"] != instance.content:
            validated_data["is_edited"] = True
        return super().update(instance, validated_data)
