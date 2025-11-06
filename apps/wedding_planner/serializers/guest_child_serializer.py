from rest_framework import serializers
from apps.wedding_planner.models.guest_child_model import Child
from apps.wedding_planner.models.gender_model import Gender
from apps.wedding_planner.serializers.gender_serializer import GenderSerializer


class ChildSerializer(serializers.ModelSerializer):
    gender = GenderSerializer(read_only=True)
    gender_id = serializers.PrimaryKeyRelatedField(source='gender', queryset=Gender.objects.all(), write_only=True)

    class Meta:
        model = Child
        fields = "__all__"