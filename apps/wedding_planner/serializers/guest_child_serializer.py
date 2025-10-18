from rest_framework import serializers
from apps.wedding_planner.models.guest_child_model import Child


class ChildSerializer(serializers.ModelSerializer):
    class Meta:
        model = Child
        fields = '__all__'