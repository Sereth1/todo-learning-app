from rest_framework import serializers
from apps.commons.models.todo_model import Todo
from django.utils import timezone
from datetime import timedelta


class TodoSerializer(serializers.ModelSerializer):
    is_active = serializers.ReadOnlyField()

    class Meta:
        model = Todo
        fields = [
            "user",
            "category",
            "title",
            "description",
            "start_datetime",
            "end_datetime",
            "is_active",  # ← Must be in fields list AND declared above
        ]

    def validate(self, attrs):
        user = attrs.get("user")
        start = attrs.get("start_datetime")
        end = attrs.get("end_datetime")

        if start <= timezone.now():
            raise serializers.ValidationError(
                {"start_datetime": "You cannot use past time for start date."}
            )
        if end <= start:
            raise serializers.ValidationError(
                {"end_datetime": "End datetime must be after start datetime."}
            )

        one_minute = timedelta(minutes=1)
        overlapping_todos = Todo.objects.filter(
            user=user,
            end_datetime__gt=start - one_minute,
            start_datetime__lt=end + one_minute,
        )

        if overlapping_todos.exists():
            raise serializers.ValidationError("You need to have more time space")

        return attrs

    def validate_title(self, value):
        if len(value) > 20:
            raise serializers.ValidationError("Title must be less than 20 characters")
        return value
