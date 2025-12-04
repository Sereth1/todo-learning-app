from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q
from django.http import HttpResponse

from apps.wedding_planner.models import Wedding, Guest, Table, WeddingEvent, AttendanceStatus
from apps.wedding_planner.serializers.wedding_serializer import (
    WeddingSerializer,
    WeddingCreateSerializer,
    WeddingPublicSerializer,
)


class WeddingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing weddings.
    Users can only see and manage their own weddings.
    """
    
    serializer_class = WeddingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter weddings to only show the current user's weddings."""
        return Wedding.objects.filter(owner=self.request.user)
    
    def get_serializer_class(self):
        if self.action in ["public", "by_slug"]:
            return WeddingPublicSerializer
        return WeddingSerializer
    
    def create(self, request, *args, **kwargs):
        """Create a new wedding and return full serialized data with id."""
        serializer = WeddingCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        wedding = serializer.save(owner=request.user)
        
        # Return the full wedding data including id
        response_serializer = WeddingSerializer(wedding)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=["get"], url_path="current")
    def current(self, request):
        """Get the user's current/primary wedding."""
        wedding = self.get_queryset().filter(
            status__in=["planning", "active"]
        ).first()
        
        if not wedding:
            return Response(
                {"detail": "No active wedding found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(wedding)
        return Response(serializer.data)
    
    @action(detail=True, methods=["get"], url_path="dashboard")
    def dashboard(self, request, pk=None):
        """Get dashboard statistics for a wedding."""
        wedding = self.get_object()
        
        # Guest stats
        total_guests = wedding.guests.count()
        confirmed = wedding.guests.filter(attendance_status="yes").count()
        declined = wedding.guests.filter(attendance_status="no").count()
        pending = wedding.guests.filter(attendance_status="pending").count()
        
        # Plus ones
        plus_ones = wedding.guests.filter(is_plus_one_coming=True).count()
        
        # Children
        children_count = sum(
            guest.child_set.count() 
            for guest in wedding.guests.filter(has_children=True)
        )
        
        # Tables
        tables_count = wedding.tables.count() if hasattr(wedding, 'tables') else 0
        
        data = {
            "wedding": WeddingSerializer(wedding).data,
            "guest_stats": {
                "total": total_guests,
                "confirmed": confirmed,
                "declined": declined,
                "pending": pending,
                "plus_ones": plus_ones,
                "children": children_count,
                "total_attending": confirmed + plus_ones + children_count,
            },
            "tables_count": tables_count,
        }
        
        return Response(data)

    @action(detail=False, methods=["get"], url_path="dashboard-data")
    def dashboard_data(self, request):
        """
        Get all dashboard data in a single request.
        
        Returns: guest stats, seating summary, and current event.
        This reduces multiple API calls to a single request.
        """
        wedding_id = request.query_params.get("wedding")
        if not wedding_id:
            # Try to get the user's first wedding
            wedding = self.get_queryset().first()
            if not wedding:
                return Response(
                    {"error": "No wedding found"},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            wedding = get_object_or_404(self.get_queryset(), id=wedding_id)
        
        # Guest stats
        guests = wedding.guests.all()
        total_guests = guests.count()
        confirmed = guests.filter(attendance_status=AttendanceStatus.YES).count()
        pending = guests.filter(attendance_status=AttendanceStatus.PENDING).count()
        declined = guests.filter(attendance_status=AttendanceStatus.NO).count()
        
        plus_ones = guests.filter(
            attendance_status=AttendanceStatus.YES,
            is_plus_one_coming=True
        ).count()
        
        guests_with_children = guests.filter(
            attendance_status=AttendanceStatus.YES,
            has_children=True
        ).count()
        
        # Count actual children from confirmed guests
        from apps.wedding_planner.models import Child
        total_children = Child.objects.filter(
            guest__in=guests.filter(attendance_status=AttendanceStatus.YES, has_children=True)
        ).count()
        
        total_attendees = confirmed + plus_ones + total_children
        
        guest_stats = {
            "total_invited": total_guests,
            "confirmed": confirmed,
            "pending": pending,
            "declined": declined,
            "plus_ones_coming": plus_ones,
            "guests_with_children": guests_with_children,
            "total_children": total_children,
            "total_expected_attendees": total_attendees,
            "response_rate": round((confirmed + declined) / total_guests * 100, 1) if total_guests > 0 else 0,
            "confirmation_rate": round(confirmed / total_guests * 100, 1) if total_guests > 0 else 0,
        }
        
        # Seating stats
        tables = Table.objects.filter(wedding=wedding)
        total_capacity = sum(t.capacity for t in tables)
        total_seated = sum(t.seats_taken for t in tables)
        
        seating_stats = {
            "total_tables": tables.count(),
            "total_capacity": total_capacity,
            "total_seated": total_seated,
            "seats_available": total_capacity - total_seated,
            "occupancy_rate": round((total_seated / total_capacity * 100), 1) if total_capacity > 0 else 0,
        }
        
        # Events - get current/active event
        events = WeddingEvent.objects.filter(wedding=wedding).order_by("event_date")
        events_data = []
        current_event = None
        
        from django.utils import timezone
        today = timezone.now().date()
        
        for event in events:
            event_data = {
                "id": event.id,
                "name": event.name,
                "event_date": event.event_date.isoformat() if event.event_date else None,
                "event_time": event.event_time.isoformat() if event.event_time else None,
                "venue_name": event.venue_name,
                "is_active": event.event_date >= today if event.event_date else False,
            }
            events_data.append(event_data)
            
            # Set as current if it's the next upcoming event
            if event.event_date and event.event_date >= today and not current_event:
                days_until = (event.event_date - today).days
                event_data["days_until_wedding"] = days_until
                current_event = event_data
        
        return Response({
            "guest_stats": guest_stats,
            "seating_stats": seating_stats,
            "events": events_data,
            "current_event": current_event,
        })
    
    @action(
        detail=False, 
        methods=["get"], 
        url_path="by-slug/(?P<slug>[^/.]+)",
        permission_classes=[AllowAny]
    )
    def by_slug(self, request, slug=None):
        """
        Public endpoint to get wedding details by slug.
        Only returns public weddings.
        """
        wedding = get_object_or_404(Wedding, slug=slug, is_website_public=True)
        serializer = WeddingPublicSerializer(wedding)
        return Response(serializer.data)
    
    @action(
        detail=False, 
        methods=["get"], 
        url_path="by-code/(?P<code>[^/.]+)",
        permission_classes=[AllowAny]
    )
    def by_code(self, request, code=None):
     
        wedding = get_object_or_404(Wedding, public_code=code)
        serializer = WeddingPublicSerializer(wedding)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="generate-report")
    def generate_report(self, request):
        """
        Generate a PDF report with guest meals and table seating.
        Returns a downloadable PDF file.
        """
        from apps.wedding_planner.services.pdf_report_service import generate_wedding_report_pdf
        
        # Get the user's active wedding
        wedding = self.get_queryset().filter(
            status__in=["planning", "active"]
        ).first()
        
        if not wedding:
            return Response(
                {"error": "No active wedding found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Generate PDF
        pdf_buffer = generate_wedding_report_pdf(wedding)
        
        # Create response with PDF
        response = HttpResponse(pdf_buffer.read(), content_type='application/pdf')
        filename = f"wedding_report_{wedding.slug or wedding.id}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
