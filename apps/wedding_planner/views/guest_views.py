from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from apps.wedding_planner.models.guest_model import Guest, AttendanceStatus
from apps.wedding_planner.models import Wedding
from apps.wedding_planner.serializers.guest_serializer import (
    GuestSerializer, 
    GuestCreateSerializer,
    GuestPublicSerializer,
    GuestRSVPSerializer,
)
from apps.email_services.services import EmailService


class GuestViews(viewsets.ModelViewSet):

    serializer_class = GuestSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['attendance_status', 'guest_type', 'is_plus_one_coming', 'has_children']
    search_fields = ['first_name', 'last_name', 'email', 'phone_number']
    ordering_fields = ['created_at', 'first_name', 'last_name', 'attendance_status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter guests by wedding. Additional filtering handled by django-filter."""
        user = self.request.user
        wedding_id = self.kwargs.get("wedding_pk") or self.request.query_params.get("wedding")
        
        if wedding_id:
            queryset = Guest.objects.filter(
                wedding_id=wedding_id,
                wedding__owner=user
            )
        else:
            # Return all guests from all user's weddings
            queryset = Guest.objects.filter(wedding__owner=user)
        
        # Note: Filtering by attendance_status, guest_type, and search
        # is now handled automatically by django-filter and SearchFilter
        return queryset
    
    def get_serializer_class(self):
        if self.action == "create":
            return GuestCreateSerializer
        if self.action in ["get_by_code", "public_rsvp"]:
            return GuestPublicSerializer
        if self.action == "update_rsvp":
            return GuestRSVPSerializer
        return GuestSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        wedding_id = self.kwargs.get("wedding_pk") or self.request.query_params.get("wedding")
        if wedding_id:
            context["wedding"] = Wedding.objects.filter(
                id=wedding_id, 
                owner=self.request.user
            ).first()
        return context
    
    def perform_create(self, serializer):
        """Set the wedding when creating a guest."""
        wedding_id = self.kwargs.get("wedding_pk") or self.request.data.get("wedding")
        if wedding_id:
            wedding = Wedding.objects.filter(
                id=wedding_id,
                owner=self.request.user
            ).first()
            if wedding:
                serializer.save(wedding=wedding)
                return
        serializer.save()
    
    @action(methods=['get'], url_path='attendance_status', detail=False)
    def attendance_status_search(self, request):
        attendance_status = request.query_params.get("attendance_status", "yes")
        if not attendance_status:
            return Response({"message": "something is wrong"})
        search = self.get_queryset().filter(attendance_status=attendance_status)
        if not search.exists():
            return Response(
                {"message": "no one has accepted yet"}
            )
        serializer = self.get_serializer(search, many=True)        
        return Response(serializer.data)
    
    @action(detail=False, methods=["get"], url_path="stats")
    def get_guest_stats(self, request):
        """Get comprehensive guest statistics for dashboard."""
        queryset = self.get_queryset()
        
        total = queryset.count()
        confirmed = queryset.filter(attendance_status=AttendanceStatus.YES).count()
        pending = queryset.filter(attendance_status=AttendanceStatus.PENDING).count()
        declined = queryset.filter(attendance_status=AttendanceStatus.NO).count()
        
        # Count plus ones and children
        plus_ones = queryset.filter(
            attendance_status=AttendanceStatus.YES,
            is_plus_one_coming=True
        ).count()
        
        guests_with_children = queryset.filter(
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
        """Send reminder emails to all pending guests for the current wedding."""
        deadline = request.data.get("deadline", "Please respond as soon as possible")
        pending_guests = self.get_queryset().filter(attendance_status=AttendanceStatus.PENDING)
        
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
    
    @action(
        detail=False, 
        methods=["get"], 
        url_path="by-code/(?P<user_code>[^/.]+)",
        permission_classes=[AllowAny]
    )
    def get_by_code(self, request, user_code=None):
        """
        Get guest by their unique user_code (for RSVP links).
        This is a public endpoint for guests to access their RSVP.
        """
        try:
            guest = Guest.objects.get(user_code=user_code)
            serializer = GuestPublicSerializer(guest)
            return Response(serializer.data)
        except Guest.DoesNotExist:
            return Response(
                {"error": "Guest not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(
        detail=False, 
        methods=["post"], 
        url_path="public-rsvp/(?P<user_code>[^/.]+)",
        permission_classes=[AllowAny]
    )
    def public_rsvp(self, request, user_code=None):
        """
        Public endpoint for guests to submit their RSVP.
        No authentication required - uses user_code for identification.
        """
        from apps.wedding_planner.models.guest_child_model import Child
        from apps.wedding_planner.models.meal_model import GuestMealSelection, MealChoice
        
        try:
            guest = Guest.objects.get(user_code=user_code)
        except Guest.DoesNotExist:
            return Response(
                {"error": "Guest not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
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
            
            # Update plus one name if provided
            plus_one_name = request.data.get("plus_one_name")
            if plus_one_name:
                guest.plus_one_name = plus_one_name
            
            # Update dietary restrictions if provided
            dietary_restrictions = request.data.get("dietary_restrictions")
            if dietary_restrictions:
                guest.dietary_restrictions = dietary_restrictions
            
            # Handle meal selection
            meal_choice_id = request.data.get("meal_choice_id")
            if meal_choice_id:
                try:
                    meal_choice = MealChoice.objects.get(id=meal_choice_id)
                    # Create or update meal selection
                    meal_selection, _ = GuestMealSelection.objects.get_or_create(guest=guest)
                    meal_selection.meal_choice = meal_choice
                    meal_selection.save()
                except MealChoice.DoesNotExist:
                    pass  # Silently ignore invalid meal choice
            
            # Handle children data
            children_data = request.data.get("children", [])
            if children_data and guest.has_children:
                # Delete existing children
                guest.child_set.all().delete()
                
                # Create new children
                for child_data in children_data:
                    Child.objects.create(
                        guest=guest,
                        first_name=child_data.get("first_name", ""),
                        age=child_data.get("age", 0)
                    )
        else:
            guest.is_plus_one_coming = False
            guest.has_children = False
            # Clear children if declining
            guest.child_set.all().delete()
        
        guest.save()
        
        # Send confirmation email
        email_sent = EmailService.send_rsvp_confirmation(guest, confirmed=attending)
        
        serializer = GuestPublicSerializer(guest)
        return Response({
            "guest": serializer.data,
            "email_sent": email_sent,
            "message": "Thank you for your response! We're excited to see you!" if attending else "We'll miss you! Thank you for letting us know."
        })