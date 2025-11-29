from rest_framework import viewsets, status
from rest_framework.decorators import action
from apps.wedding_planner.models.guest_model import Guest, AttendanceStatus
from apps.wedding_planner.serializers.guest_serializer import GuestSerializer
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from apps.email_services.services import EmailService


class GuestViews(viewsets.ModelViewSet):
    queryset = Guest.objects.all()
    serializer_class = GuestSerializer
    permission_classes = [AllowAny]
    
    @action(methods=['get'], url_path='attendance_status', detail=False)
    def attendance_status_search(self, request):
        attendance_status = request.query_params.get("attendance_status", "yes")
        if not attendance_status:
            return Response({"message": "something is wrong"})
        search = self.queryset.filter(attendance_status=attendance_status)
        if not search.exists():
            return Response(
                {"message": "no one has accepted yet"}
            )
        serializer = self.get_serializer(search, many=True)        
        return Response(serializer.data)
    
    @action(detail=False, methods=["get"], url_path="stats")
    def get_guest_stats(self, request):
        """Get comprehensive guest statistics for dashboard."""
        from django.db.models import Count, Q
        
        total = Guest.objects.count()
        confirmed = Guest.objects.filter(attendance_status=AttendanceStatus.YES).count()
        pending = Guest.objects.filter(attendance_status=AttendanceStatus.PENDING).count()
        declined = Guest.objects.filter(attendance_status=AttendanceStatus.NO).count()
        
        # Count plus ones and children
        plus_ones = Guest.objects.filter(
            attendance_status=AttendanceStatus.YES,
            is_plus_one_coming=True
        ).count()
        
        guests_with_children = Guest.objects.filter(
            attendance_status=AttendanceStatus.YES,
            has_children=True
        ).count()
        
        # Total expected attendees (confirmed guests + plus ones)
        total_attendees = confirmed + plus_ones
        
        return Response({
            "total_invited": total,
            "confirmed": confirmed,
            "pending": pending,
            "declined": declined,
            "plus_ones_coming": plus_ones,
            "guests_with_children": guests_with_children,
            "total_expected_attendees": total_attendees,
            "response_rate": round((confirmed + declined) / total * 100, 1) if total > 0 else 0,
            "confirmation_rate": round(confirmed / total * 100, 1) if total > 0 else 0,
        })
    
    @action(detail=True, methods=["post"], url_path="rsvp")
    def update_rsvp(self, request, pk=None):
        """
        Update guest RSVP and send confirmation email.
        Expected payload: { "attending": true/false, "is_plus_one_coming": bool, "has_children": bool }
        """
        guest = self.get_object()
        attending = request.data.get("attending")
        
        if attending is None:
            return Response(
                {"error": "attending field is required (true/false)"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update guest
        guest.attendance_status = AttendanceStatus.YES if attending else AttendanceStatus.NO
        
        if attending:
            guest.is_plus_one_coming = request.data.get("is_plus_one_coming", False)
            guest.has_children = request.data.get("has_children", False)
        else:
            guest.is_plus_one_coming = False
            guest.has_children = False
        
        guest.save()
        
        # Send confirmation email
        email_sent = EmailService.send_rsvp_confirmation(guest, confirmed=attending)
        
        serializer = self.get_serializer(guest)
        return Response({
            "guest": serializer.data,
            "email_sent": email_sent,
            "message": "RSVP confirmed! We're excited to see you!" if attending else "We'll miss you!"
        })
    
    @action(detail=True, methods=["post"], url_path="send-reminder")
    def send_reminder(self, request, pk=None):
        """Send RSVP reminder email to a pending guest."""
        guest = self.get_object()
        
        if guest.attendance_status != AttendanceStatus.PENDING:
            return Response(
                {"error": "Guest has already responded to RSVP"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        deadline = request.data.get("deadline", "Please respond as soon as possible")
        email_sent = EmailService.send_rsvp_reminder(guest, deadline)
        
        return Response({
            "email_sent": email_sent,
            "message": f"Reminder sent to {guest.email}" if email_sent else "Failed to send reminder"
        })
    
    @action(detail=False, methods=["post"], url_path="send-bulk-reminders")
    def send_bulk_reminders(self, request):
        """Send reminder emails to all pending guests."""
        deadline = request.data.get("deadline", "Please respond as soon as possible")
        pending_guests = Guest.objects.filter(attendance_status=AttendanceStatus.PENDING)
        
        sent_count = 0
        failed_count = 0
        
        for guest in pending_guests:
            if EmailService.send_rsvp_reminder(guest, deadline):
                sent_count += 1
            else:
                failed_count += 1
        
        return Response({
            "total_pending": pending_guests.count(),
            "sent_successfully": sent_count,
            "failed": failed_count,
        })
    
    @action(detail=False, methods=["get"], url_path="by-code/(?P<user_code>[^/.]+)")
    def get_by_code(self, request, user_code=None):
        """Get guest by their unique user_code (for RSVP links)."""
        try:
            guest = Guest.objects.get(user_code=user_code)
            serializer = self.get_serializer(guest)
            return Response(serializer.data)
        except Guest.DoesNotExist:
            return Response(
                {"error": "Guest not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    