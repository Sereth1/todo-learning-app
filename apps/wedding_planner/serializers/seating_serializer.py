from rest_framework import serializers
from apps.wedding_planner.models.seating_model import Table, SeatingAssignment


class SeatingAssignmentSerializer(serializers.ModelSerializer):
    guest_name = serializers.SerializerMethodField()
    table_info = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    guest_type = serializers.CharField(source='guest.guest_type', read_only=True)
    family_relationship = serializers.CharField(source='guest.family_relationship', read_only=True)
    family_relationship_display = serializers.SerializerMethodField()
    relationship_tier = serializers.CharField(source='guest.relationship_tier', read_only=True)
    relationship_tier_display = serializers.SerializerMethodField()
    
    class Meta:
        model = SeatingAssignment
        fields = [
            "id",
            "uid",
            "guest",
            "guest_name",
            "guest_type",
            "family_relationship",
            "family_relationship_display",
            "relationship_tier",
            "relationship_tier_display",
            "attendee_type",
            "child",
            "table",
            "table_info",
            "seat_number",
            "notes",
            "display_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["uid", "created_at", "updated_at"]
    
    def get_guest_name(self, obj):
        return f"{obj.guest.first_name} {obj.guest.last_name}"
    
    def get_table_info(self, obj):
        return str(obj.table)
    
    def get_family_relationship_display(self, obj):
        if obj.guest.family_relationship:
            return obj.guest.get_family_relationship_display()
        return None
    
    def get_relationship_tier_display(self, obj):
        if obj.guest.relationship_tier:
            return obj.guest.get_relationship_tier_display()
        return None
    
    def get_display_name(self, obj):
        """Return a friendly display name for the assignment."""
        if obj.attendee_type == "child" and obj.child:
            return f"{obj.child.first_name} (child of {obj.guest.first_name}, age {obj.child.age})"
        elif obj.attendee_type == "plus_one":
            plus_one_name = obj.guest.plus_one_name or "Plus One"
            return f"{plus_one_name} (+1 of {obj.guest.first_name})"
        return f"{obj.guest.first_name} {obj.guest.last_name}"
    
    def validate(self, attrs):
        table = attrs.get("table")
        seat_number = attrs.get("seat_number")
        attendee_type = attrs.get("attendee_type")
        child = attrs.get("child")
        
        # Validate child is provided for child attendee type
        if attendee_type == "child" and not child:
            raise serializers.ValidationError({
                "child": "Child must be specified for child attendee type."
            })
        
        # Check table capacity
        if table and not self.instance:  # Only for new assignments
            if table.is_full:
                raise serializers.ValidationError({
                    "table": f"Table {table} is already at capacity ({table.capacity} seats)."
                })
        
        # Validate seat number
        if seat_number and table:
            if seat_number > table.capacity:
                raise serializers.ValidationError({
                    "seat_number": f"Seat number cannot exceed table capacity of {table.capacity}."
                })
        
        return attrs


class TableSerializer(serializers.ModelSerializer):
    seats_taken = serializers.ReadOnlyField()
    seats_available = serializers.ReadOnlyField()
    is_full = serializers.ReadOnlyField()
    table_category_display = serializers.SerializerMethodField()
    guests = SeatingAssignmentSerializer(
        source="seating_assignments", many=True, read_only=True
    )
    
    class Meta:
        model = Table
        fields = [
            "id",
            "uid",
            "table_number",
            "name",
            "capacity",
            "table_category",
            "table_category_display",
            "location",
            "notes",
            "is_vip",
            "seats_taken",
            "seats_available",
            "is_full",
            "guests",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["uid", "created_at", "updated_at"]
    
    def get_table_category_display(self, obj):
        if obj.table_category:
            return obj.get_table_category_display()
        return None


class TableSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for table lists without nested guests."""
    seats_taken = serializers.ReadOnlyField()
    seats_available = serializers.ReadOnlyField()
    is_full = serializers.ReadOnlyField()
    
    class Meta:
        model = Table
        fields = [
            "id",
            "uid",
            "table_number",
            "name",
            "capacity",
            "location",
            "is_vip",
            "seats_taken",
            "seats_available",
            "is_full",
        ]
