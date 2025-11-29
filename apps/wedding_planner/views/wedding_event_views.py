from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from apps.wedding_planner.models.wedding_event_model import WeddingEvent
from apps.wedding_planner.serializers.wedding_event_serializer import WeddingEventSerializer


class WeddingEventViews(viewsets.ModelViewSet):
    queryset = WeddingEvent.objects.all()
    serializer_class = WeddingEventSerializer
    permission_classes = [AllowAny]  # Public access for guests
    
    def get_queryset(self):
        """Filter to active events by default."""
        queryset = super().get_queryset()
        if self.action == "list":
            return queryset.filter(is_active=True)
        return queryset
    
    @action(detail=False, methods=["get"], url_path="current")
    def get_current_event(self, request):
        """Get the currently active wedding event."""
        event = WeddingEvent.objects.filter(is_active=True).first()
        if not event:
            return Response(
                {"message": "No active wedding event found."},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = self.get_serializer(event)
        return Response(serializer.data)
    
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
