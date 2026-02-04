from rest_framework import serializers
from apps.wedding_planner.models.wedding_event_model import WeddingEvent


class WeddingEventSerializer(serializers.ModelSerializer):
    days_until_wedding = serializers.ReadOnlyField()
    is_rsvp_open = serializers.ReadOnlyField()
    dress_code_display = serializers.CharField(
        source="get_dress_code_display", read_only=True
    )
    
    class Meta:
        model = WeddingEvent
        fields = [
            "id",
            "uid",
            "wedding",
            "name",
            "event_date",
            "ceremony_time",
            "reception_time",
            "venue_name",
            "venue_address",
            "venue_city",
            "venue_map_url",
            "reception_venue_name",
            "reception_venue_address",
            "dress_code",
            "dress_code_display",
            "dress_code_notes",
            "rsvp_deadline",
            "special_instructions",
            "is_active",
            "days_until_wedding",
            "is_rsvp_open",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["uid", "created_at", "updated_at"]
    
    def validate(self, attrs):
        event_date = attrs.get("event_date")
        rsvp_deadline = attrs.get("rsvp_deadline")
        
        if event_date and rsvp_deadline:
            if rsvp_deadline > event_date:
                raise serializers.ValidationError({
                    "rsvp_deadline": "RSVP deadline must be before the wedding date."
                })
        
        return attrs
