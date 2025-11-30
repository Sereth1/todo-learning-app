"""
TodoCategory serializers with business logic.
"""
from rest_framework import serializers
from django.db.models import Count, Q, Max

from apps.todo_list_wedding.models import TodoCategory, Todo


class TodoCategorySummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for dropdowns and references."""
    
    class Meta:
        model = TodoCategory
        fields = ["id", "uid", "name", "color", "icon"]
        read_only_fields = ["id", "uid"]


class TodoCategorySerializer(serializers.ModelSerializer):
    """
    Full TodoCategory serializer with computed stats.
    Business logic for progress calculation is handled here.
    """
    # Computed fields
    total_todos = serializers.SerializerMethodField()
    completed_todos = serializers.SerializerMethodField()
    in_progress_todos = serializers.SerializerMethodField()
    overdue_todos = serializers.SerializerMethodField()
    progress_percent = serializers.SerializerMethodField()
    
    class Meta:
        model = TodoCategory
        fields = [
            "id",
            "uid",
            "wedding",
            "name",
            "description",
            "color",
            "icon",
            "order",
            "is_active",
            "created_at",
            "updated_at",
            # Computed
            "total_todos",
            "completed_todos",
            "in_progress_todos",
            "overdue_todos",
            "progress_percent",
        ]
        read_only_fields = ["id", "uid", "created_at", "updated_at"]

    def get_total_todos(self, obj) -> int:
        """Count all non-cancelled todos in this category."""
        return obj.todos.exclude(status=Todo.Status.CANCELLED).count()

    def get_completed_todos(self, obj) -> int:
        """Count completed todos in this category."""
        return obj.todos.filter(status=Todo.Status.COMPLETED).count()

    def get_in_progress_todos(self, obj) -> int:
        """Count in-progress todos in this category."""
        return obj.todos.filter(status=Todo.Status.IN_PROGRESS).count()

    def get_overdue_todos(self, obj) -> int:
        """Count overdue todos (past due date, not completed/cancelled)."""
        from django.utils import timezone
        today = timezone.now().date()
        return obj.todos.filter(
            due_date__lt=today
        ).exclude(
            status__in=[Todo.Status.COMPLETED, Todo.Status.CANCELLED]
        ).count()

    def get_progress_percent(self, obj) -> int:
        """Calculate category progress as percentage of completed todos."""
        total = self.get_total_todos(obj)
        if total == 0:
            return 0
        completed = self.get_completed_todos(obj)
        return round((completed / total) * 100)

    def validate_name(self, value):
        """Ensure category name is unique within the wedding."""
        wedding = self.context.get("wedding") or self.initial_data.get("wedding")
        instance = self.instance
        
        queryset = TodoCategory.objects.filter(wedding=wedding, name__iexact=value)
        if instance:
            queryset = queryset.exclude(pk=instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError(
                "A category with this name already exists for this wedding."
            )
        return value

    def validate_color(self, value):
        """Validate hex color format."""
        if value and not value.startswith("#"):
            value = f"#{value}"
        if value and (len(value) != 7 or not all(c in "0123456789ABCDEFabcdef" for c in value[1:])):
            raise serializers.ValidationError(
                "Color must be a valid hex color code (e.g., #3B82F6)."
            )
        return value

    def create(self, validated_data):
        """Set default order if not provided."""
        if "order" not in validated_data:
            wedding = validated_data.get("wedding")
            max_order = TodoCategory.objects.filter(wedding=wedding).aggregate(
                max_order=Max("order")
            )["max_order"] or 0
            validated_data["order"] = max_order + 1
        return super().create(validated_data)
