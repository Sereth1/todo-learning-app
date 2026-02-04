from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers

from apps.commons.models.todo_model import Todo


class TodoSerializer(serializers.ModelSerializer):
    is_active = serializers.ReadOnlyField()

    class Meta:
        model = Todo
        fields = [
            "id",
            "user",
            "category",
            "title",
            "description",
            "start_datetime",
            "end_datetime",
            "is_active",
        ]
        read_only_fields = ["id"]

    def validate_title(self, value):
        if len(value) > 20:
            raise serializers.ValidationError("Title must be 20 characters or fewer.")
        return value

    def validate(self, attrs):
        start = attrs.get("start_datetime")
        end = attrs.get("end_datetime")
        user = attrs.get("user")

        if start and start <= timezone.now():
            raise serializers.ValidationError(
                {"start_datetime": "Start datetime cannot be in the past."}
            )

        if start and end and end <= start:
            raise serializers.ValidationError(
                {"end_datetime": "End datetime must be after start datetime."}
            )

        # Check for overlapping todos (with a 1-minute buffer)
        if user and start and end:
            buffer = timedelta(minutes=1)
            overlapping = Todo.objects.filter(
                user=user,
                end_datetime__gt=start - buffer,
                start_datetime__lt=end + buffer,
            )
            # Exclude current instance on update
            if self.instance:
                overlapping = overlapping.exclude(pk=self.instance.pk)

            if overlapping.exists():
                raise serializers.ValidationError(
                    "This todo overlaps with an existing one. Please adjust the time."
                )

        return attrs
