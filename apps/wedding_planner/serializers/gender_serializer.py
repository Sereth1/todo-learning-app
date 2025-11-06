from rest_framework import serializers
from apps.wedding_planner.models.gender_model import Gender, GenderType


class GenderSerializer(serializers.ModelSerializer):
    gender = serializers.ChoiceField(
        choices=GenderType.choices,
        error_messages={
            "invalid_choice": "Choose a valid choice. Valid options are: male, female, prefer_not_to_say "
        },
    )

    class Meta:
        model = Gender
        fields = "__all__"
