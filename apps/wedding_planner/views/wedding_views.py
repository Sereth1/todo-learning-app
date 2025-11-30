from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404

from apps.wedding_planner.models import Wedding
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
        """
        Public endpoint to get wedding details by public code.
        Used by guests to access wedding info.
        """
        wedding = get_object_or_404(Wedding, public_code=code)
        serializer = WeddingPublicSerializer(wedding)
        return Response(serializer.data)
