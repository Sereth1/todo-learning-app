from rest_framework import serializers
from apps.wedding_planner.models.guest_max_model import GuestsMax 
from apps.wedding_planner.models.guest_model import Guest

class GuestMaxTotalSerializer(serializers.ModelSerializer):
    total_guests = serializers.SerializerMethodField()
    confirmed_guests = serializers.SerializerMethodField()
    pending_guests = serializers.SerializerMethodField()
    declined_guests = serializers.SerializerMethodField()
    remaining_slots = serializers.SerializerMethodField()
    
    class Meta:
        model = GuestsMax
        fields = ['max_allowed', 'total_guests', 'confirmed_guests', 'pending_guests', 'declined_guests', 'remaining_slots']
    
    def get_total_guests(self, obj):
        return Guest.objects.count()
    
    def get_confirmed_guests(self, obj):
        return Guest.objects.filter(attendance_status='yes').count()
    
    def get_pending_guests(self, obj):
        return Guest.objects.filter(attendance_status='pending').count()
    
    def get_declined_guests(self, obj):
        return Guest.objects.filter(attendance_status='no').count()
    
    def get_remaining_slots(self, obj):
        return obj.max_allowed - Guest.objects.count()
        
