from django.db import models
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.wedding_planner.models.seating_model import Table, SeatingAssignment
from apps.wedding_planner.models import Wedding
from apps.wedding_planner.serializers.seating_serializer import (
    TableSerializer,
    TableSummarySerializer,
    SeatingAssignmentSerializer,
)


class TableViews(viewsets.ModelViewSet):
    """
    ViewSet for managing tables.
    Tables are filtered by wedding owned by the current user.
    """
    serializer_class = TableSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter tables by wedding owned by the current user."""
        user = self.request.user
        wedding_id = self.kwargs.get("wedding_pk") or self.request.query_params.get("wedding")
        
        if wedding_id:
            return Table.objects.filter(
                wedding_id=wedding_id,
                wedding__owner=user
            )
        
        return Table.objects.filter(wedding__owner=user)
    
    def get_serializer_class(self):
        """Use summary serializer for list view."""
        if self.action == "list":
            return TableSummarySerializer
        return TableSerializer
    
    def perform_create(self, serializer):
        """Set the wedding when creating a table."""
        wedding_id = self.kwargs.get("wedding_pk") or self.request.data.get("wedding")
        if wedding_id:
            wedding = Wedding.objects.filter(
                id=wedding_id,
                owner=self.request.user
            ).first()
            if wedding:
                # Auto-generate table_number if not provided
                table_number = self.request.data.get("table_number")
                if not table_number:
                    # Get max table number for this wedding and increment
                    max_number = Table.objects.filter(wedding=wedding).aggregate(
                        models.Max("table_number")
                    )["table_number__max"] or 0
                    table_number = max_number + 1
                
                serializer.save(wedding=wedding, table_number=table_number)
                return
        serializer.save()
    
    @action(detail=False, methods=["get"], url_path="available")
    def get_available_tables(self, request):
        """Get tables with available seats."""
        tables = self.get_queryset()
        available = [t for t in tables if not t.is_full]
        serializer = TableSummarySerializer(available, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=["get"], url_path="summary")
    def get_seating_summary(self, request):
        """Get overall seating summary."""
        tables = self.get_queryset()
        total_capacity = sum(t.capacity for t in tables)
        total_seated = sum(t.seats_taken for t in tables)
        
        return Response({
            "total_tables": tables.count(),
            "total_capacity": total_capacity,
            "total_seated": total_seated,
            "seats_available": total_capacity - total_seated,
            "occupancy_rate": round((total_seated / total_capacity * 100), 1) if total_capacity > 0 else 0,
            "tables_full": sum(1 for t in tables if t.is_full),
            "vip_tables": tables.filter(is_vip=True).count(),
        })
    
    @action(detail=True, methods=["post"], url_path="assign-guest")
    def assign_guest(self, request, pk=None):
        """Assign a guest to this table."""
        table = self.get_object()
        guest_id = request.data.get("guest_id")
        seat_number = request.data.get("seat_number")
        
        if not guest_id:
            return Response(
                {"error": "guest_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if table.is_full:
            return Response(
                {"error": f"Table {table} is already at capacity"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from apps.wedding_planner.models import Guest
        try:
            # Make sure the guest belongs to the same wedding
            guest = Guest.objects.get(pk=guest_id, wedding=table.wedding)
        except Guest.DoesNotExist:
            return Response(
                {"error": "Guest not found or doesn't belong to this wedding"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if guest already has a seating assignment
        if hasattr(guest, "seating_assignment"):
            return Response(
                {"error": f"Guest already assigned to {guest.seating_assignment.table}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        assignment = SeatingAssignment.objects.create(
            guest=guest,
            table=table,
            seat_number=seat_number,
        )
        
        serializer = SeatingAssignmentSerializer(assignment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SeatingAssignmentViews(viewsets.ModelViewSet):
    """
    ViewSet for managing seating assignments.
    Assignments are filtered by wedding owned by the current user.
    """
    serializer_class = SeatingAssignmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter assignments by wedding owned by the current user."""
        user = self.request.user
        wedding_id = self.kwargs.get("wedding_pk") or self.request.query_params.get("wedding")
        
        if wedding_id:
            return SeatingAssignment.objects.select_related("guest", "table").filter(
                table__wedding_id=wedding_id,
                table__wedding__owner=user
            )
        
        return SeatingAssignment.objects.select_related("guest", "table").filter(
            table__wedding__owner=user
        )
    
    def create(self, request, *args, **kwargs):
        """Create a seating assignment, validating ownership."""
        from apps.wedding_planner.models import Guest
        
        user = request.user
        guest_id = request.data.get("guest")
        table_id = request.data.get("table")
        
        # Validate guest ownership
        try:
            guest = Guest.objects.get(pk=guest_id, wedding__owner=user)
        except Guest.DoesNotExist:
            return Response(
                {"error": "Guest not found or doesn't belong to your wedding"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Validate table ownership
        try:
            table = Table.objects.get(pk=table_id, wedding__owner=user)
        except Table.DoesNotExist:
            return Response(
                {"error": "Table not found or doesn't belong to your wedding"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if guest is already assigned
        if SeatingAssignment.objects.filter(guest=guest).exists():
            return Response(
                {"error": "Guest is already assigned to a table"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check table capacity
        if table.is_full:
            return Response(
                {"error": f"Table {table.name} is at capacity"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create assignment
        assignment = SeatingAssignment.objects.create(
            guest=guest,
            table=table,
            seat_number=request.data.get("seat_number"),
        )
        
        serializer = self.get_serializer(assignment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=["delete"], url_path="by-guest/(?P<guest_id>[^/.]+)")
    def delete_by_guest(self, request, guest_id=None):
        """Delete seating assignment by guest ID."""
        user = request.user
        try:
            assignment = SeatingAssignment.objects.get(
                guest_id=guest_id,
                table__wedding__owner=user
            )
            assignment.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except SeatingAssignment.DoesNotExist:
            return Response(
                {"error": "Assignment not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=["get"], url_path="unassigned-guests")
    def get_unassigned_guests(self, request):
        """Get guests who don't have seating assignments."""
        from apps.wedding_planner.models import Guest, AttendanceStatus
        
        user = self.request.user
        wedding_id = self.request.query_params.get("wedding")
        
        # Get guest IDs that have assignments
        assigned_guest_ids = SeatingAssignment.objects.values_list("guest_id", flat=True)
        
        # Filter unassigned guests by wedding
        unassigned = Guest.objects.filter(
            wedding__owner=user,
            attendance_status=AttendanceStatus.YES
        ).exclude(id__in=assigned_guest_ids)
        
        if wedding_id:
            unassigned = unassigned.filter(wedding_id=wedding_id)
        
        from apps.wedding_planner.serializers.guest_serializer import GuestSerializer
        serializer = GuestSerializer(unassigned, many=True)
        
        return Response({
            "count": unassigned.count(),
            "guests": serializer.data,
        })
