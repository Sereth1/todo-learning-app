from rest_framework import serializers
from apps.wedding_planner.models.guest_model import Guest  
from .guest_child_serializer import ChildSerializer

class GuestSerializer(serializers.ModelSerializer):
    children = ChildSerializer(source='child_set', many=True, read_only=True)
    
    class Meta:
        model = Guest
        fields = "__all__"