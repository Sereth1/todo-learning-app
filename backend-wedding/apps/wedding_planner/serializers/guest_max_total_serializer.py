from rest_framework import serializers

from apps.wedding_planner.models.guest_max_model import GuestsMax
from apps.wedding_planner.models.guest_model import Guest, AttendanceStatus


class GuestMaxTotalSerializer(serializers.ModelSerializer):
    total_guests = serializers.SerializerMethodField()
    confirmed_guests = serializers.SerializerMethodField()
    pending_guests = serializers.SerializerMethodField()
    declined_guests = serializers.SerializerMethodField()
    remaining_slots = serializers.SerializerMethodField()

    class Meta:
        model = GuestsMax
        fields = [
            "id",
            "max_allowed",
            "total_guests",
            "confirmed_guests",
            "pending_guests",
            "declined_guests",
            "remaining_slots",
        ]

    def _get_guest_queryset(self):
        """
        Return the guest queryset scoped to the requesting user's weddings.
        Falls back to empty queryset if there is no request context.
        """
        request = self.context.get("request")
        if request and hasattr(request, "user") and request.user.is_authenticated:
            return Guest.objects.filter(wedding__owner=request.user)
        return Guest.objects.none()

    def get_total_guests(self, obj):
        return self._get_guest_queryset().count()

    def get_confirmed_guests(self, obj):
        return self._get_guest_queryset().filter(
            attendance_status=AttendanceStatus.YES
        ).count()

    def get_pending_guests(self, obj):
        return self._get_guest_queryset().filter(
            attendance_status=AttendanceStatus.PENDING
        ).count()

    def get_declined_guests(self, obj):
        return self._get_guest_queryset().filter(
            attendance_status=AttendanceStatus.NO
        ).count()

    def get_remaining_slots(self, obj):
        return obj.max_allowed - self._get_guest_queryset().count()
