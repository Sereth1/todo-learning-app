from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from apps.wedding_planner.models.seating_model import Table, SeatingAssignment
from apps.wedding_planner.serializers.seating_serializer import (
    TableSerializer,
    TableSummarySerializer,
    SeatingAssignmentSerializer,
)


class TableViews(viewsets.ModelViewSet):
    queryset = Table.objects.all()
    serializer_class = TableSerializer
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        """Use summary serializer for list view."""
        if self.action == "list":
            return TableSummarySerializer
        return TableSerializer
    
    @action(detail=False, methods=["get"], url_path="available")
    def get_available_tables(self, request):
        """Get tables with available seats."""
        tables = Table.objects.all()
        available = [t for t in tables if not t.is_full]
        serializer = TableSummarySerializer(available, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=["get"], url_path="summary")
    def get_seating_summary(self, request):
        """Get overall seating summary."""
        tables = Table.objects.all()
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
            guest = Guest.objects.get(pk=guest_id)
        except Guest.DoesNotExist:
            return Response(
                {"error": "Guest not found"},
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
    queryset = SeatingAssignment.objects.select_related("guest", "table").all()
    serializer_class = SeatingAssignmentSerializer
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=["get"], url_path="unassigned-guests")
    def get_unassigned_guests(self, request):
        """Get guests who don't have seating assignments."""
        from apps.wedding_planner.models import Guest, AttendanceStatus
        
        assigned_guest_ids = SeatingAssignment.objects.values_list("guest_id", flat=True)
        unassigned = Guest.objects.filter(
            attendance_status=AttendanceStatus.YES
        ).exclude(id__in=assigned_guest_ids)
        
        from apps.wedding_planner.serializers.guest_serializer import GuestSerializer
        serializer = GuestSerializer(unassigned, many=True)
        
        return Response({
            "count": unassigned.count(),
            "guests": serializer.data,
        })
