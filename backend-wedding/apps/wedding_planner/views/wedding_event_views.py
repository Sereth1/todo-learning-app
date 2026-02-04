from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.wedding_planner.models import Wedding
from apps.wedding_planner.models.wedding_event_model import WeddingEvent
from apps.wedding_planner.serializers.wedding_event_serializer import (
    WeddingEventSerializer,
)


class WeddingEventViews(viewsets.ModelViewSet):
    """
    ViewSet for managing wedding events.
    Events are filtered by the wedding owned by the current user.
    """
    serializer_class = WeddingEventSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter events by wedding owned by the current user."""
        user = self.request.user
        wedding_id = self.kwargs.get("wedding_pk") or self.request.query_params.get("wedding")
        
        if wedding_id:
            return WeddingEvent.objects.filter(
                wedding_id=wedding_id,
                wedding__owner=user
            )
        
        # Return all events from all user's weddings
        return WeddingEvent.objects.filter(wedding__owner=user)
    
    def get_permissions(self):
        """Allow public access for specific actions."""
        if self.action in ["get_current_event", "get_countdown", "by_wedding_code"]:
            return [AllowAny()]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        """Set the wedding when creating an event."""
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
    
    @action(detail=False, methods=["get"], url_path="current")
    def get_current_event(self, request):
        """Get the currently active wedding event for authenticated user."""
        if request.user.is_authenticated:
            event = WeddingEvent.objects.filter(
                wedding__owner=request.user,
                is_active=True
            ).first()
        else:
            # For unauthenticated users, get any active public event
            event = WeddingEvent.objects.filter(
                is_active=True,
                wedding__is_website_public=True
            ).first()
            
        if not event:
            return Response(
                {"message": "No active wedding event found."},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = self.get_serializer(event)
        return Response(serializer.data)
    
    @action(
        detail=False, 
        methods=["get"], 
        url_path="by-wedding-code/(?P<code>[^/.]+)",
        permission_classes=[AllowAny]
    )
    def by_wedding_code(self, request, code=None):
        """
        Get active event for a wedding by its public code.
        Used by guests to access event details.
        """
        try:
            wedding = Wedding.objects.get(public_code=code)
            event = WeddingEvent.objects.filter(wedding=wedding, is_active=True).first()
            if not event:
                return Response(
                    {"message": "No active event found for this wedding."},
                    status=status.HTTP_404_NOT_FOUND
                )
            serializer = self.get_serializer(event)
            return Response(serializer.data)
        except Wedding.DoesNotExist:
            return Response(
                {"message": "Wedding not found."},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=["get"], url_path="countdown")
    def get_countdown(self, request, pk=None):
        """Get countdown information for the event."""
        event = self.get_object()
        return Response({
            "event_name": event.name,
            "event_date": event.event_date,
            "days_until_wedding": event.days_until_wedding,
            "is_rsvp_open": event.is_rsvp_open,
            "rsvp_deadline": event.rsvp_deadline,
        })
