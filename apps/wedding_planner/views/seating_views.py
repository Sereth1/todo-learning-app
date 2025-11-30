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
        """Use full serializer with guests for seating management."""
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
        from apps.wedding_planner.models.guest_child_model import Child
        
        user = request.user
        guest_id = request.data.get("guest")
        table_id = request.data.get("table")
        attendee_type = request.data.get("attendee_type", "guest")
        child_id = request.data.get("child")
        
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
        
        # Validate child if attendee_type is child
        child = None
        if attendee_type == "child":
            if not child_id:
                return Response(
                    {"error": "child_id is required for child attendee type"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            try:
                child = Child.objects.get(pk=child_id, guest=guest)
            except Child.DoesNotExist:
                return Response(
                    {"error": "Child not found or doesn't belong to this guest"},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Check if this specific attendee is already assigned
        existing = SeatingAssignment.objects.filter(
            guest=guest,
            attendee_type=attendee_type
        )
        if attendee_type == "child":
            existing = existing.filter(child=child)
        
        if existing.exists():
            return Response(
                {"error": "This attendee is already assigned to a table"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check table capacity
        if table.is_full:
            return Response(
                {"error": f"Table {table.name or table.table_number} is at capacity"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create assignment
        assignment = SeatingAssignment.objects.create(
            guest=guest,
            table=table,
            attendee_type=attendee_type,
            child=child,
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
        """
        Get guests who don't have seating assignments.
        Returns an expanded list including the guest, their plus one, and children.
        Sorted by: Primary guests (by family tier) -> Plus ones -> Children
        """
        from apps.wedding_planner.models import Guest, AttendanceStatus
        
        user = self.request.user
        wedding_id = self.request.query_params.get("wedding")
        
        # Get all confirmed guests (we'll filter out assigned entities individually)
        confirmed_guests = Guest.objects.filter(
            wedding__owner=user,
            attendance_status=AttendanceStatus.YES
        ).prefetch_related('child_set').order_by(
            'guest_type',  # Family first
            'relationship_tier',  # Then by tier (first, second, third)
            'last_name',
            'first_name'
        )
        
        if wedding_id:
            confirmed_guests = confirmed_guests.filter(wedding_id=wedding_id)
        
        # Get all existing assignments to check what's already assigned
        existing_assignments = SeatingAssignment.objects.filter(
            guest__wedding__owner=user
        ).select_related('child')
        
        if wedding_id:
            existing_assignments = existing_assignments.filter(guest__wedding_id=wedding_id)
        
        # Build sets of what's assigned
        assigned_guests = set()  # guest_id for primary guests
        assigned_plus_ones = set()  # guest_id for plus ones
        assigned_children = set()  # child_id for children
        
        for assignment in existing_assignments:
            if assignment.attendee_type == "guest":
                assigned_guests.add(assignment.guest_id)
            elif assignment.attendee_type == "plus_one":
                assigned_plus_ones.add(assignment.guest_id)
            elif assignment.attendee_type == "child" and assignment.child_id:
                assigned_children.add(assignment.child_id)
        
        # Build expanded list with guest + plus one + children (only if not assigned)
        expanded_list = []
        
        for guest in confirmed_guests:
            # Determine sort priority
            if guest.guest_type == "family":
                if guest.relationship_tier == "first":
                    priority = 1
                elif guest.relationship_tier == "second":
                    priority = 2
                elif guest.relationship_tier == "third":
                    priority = 3
                else:
                    priority = 4
            else:
                priority = 5  # Friends, coworkers, etc.
            
            # Add the primary guest ONLY if not assigned
            if guest.id not in assigned_guests:
                guest_data = {
                    "id": f"guest-{guest.id}",
                    "guest_id": guest.id,
                    "type": "guest",
                    "name": f"{guest.first_name} {guest.last_name}",
                    "email": guest.email,
                    "guest_type": guest.guest_type,
                    "guest_type_display": guest.get_guest_type_display(),
                    "family_relationship": guest.family_relationship,
                    "family_relationship_display": guest.get_family_relationship_display() if guest.family_relationship else None,
                    "relationship_tier": guest.relationship_tier,
                    "relationship_tier_display": guest.get_relationship_tier_display() if guest.relationship_tier else None,
                    "is_primary": True,
                    "priority": priority,
                    "sort_order": 1,  # Primary guest
                    "has_plus_one": guest.is_plus_one_coming,
                    "has_children": guest.has_children,
                    "children_count": guest.child_set.count() if guest.has_children else 0,
                }
                expanded_list.append(guest_data)
            
            # Add plus one ONLY if they're bringing one AND it's not assigned
            if guest.is_plus_one_coming and guest.id not in assigned_plus_ones:
                plus_one_name = guest.plus_one_name or "Plus One"
                plus_one_data = {
                    "id": f"plusone-{guest.id}",
                    "guest_id": guest.id,
                    "type": "plus_one",
                    "name": f"{plus_one_name}",
                    "display_name": f"{plus_one_name} (+ of {guest.first_name})",
                    "email": "",
                    "guest_type": "plus_one",
                    "is_primary": False,
                    "parent_guest": f"{guest.first_name} {guest.last_name}",
                    "parent_guest_id": guest.id,
                    "priority": priority,
                    "sort_order": 2,  # Plus ones second
                }
                expanded_list.append(plus_one_data)
            
            # Add children ONLY if they have any AND each child is not assigned
            if guest.has_children:
                for idx, child in enumerate(guest.child_set.all(), 1):
                    if child.id not in assigned_children:
                        child_data = {
                            "id": f"child-{child.id}",
                            "guest_id": guest.id,
                            "child_id": child.id,
                            "type": "child",
                            "name": child.first_name,
                            "display_name": f"{child.first_name} (child of {guest.first_name}, age {child.age})",
                            "email": "",
                            "guest_type": "child",
                            "is_primary": False,
                            "parent_guest": f"{guest.first_name} {guest.last_name}",
                            "parent_guest_id": guest.id,
                            "age": child.age,
                            "priority": priority,
                            "sort_order": 3,  # Children third
                            "child_order": idx,
                        }
                        expanded_list.append(child_data)
        
        # Sort by priority, then sort_order, then name
        expanded_list.sort(key=lambda x: (x['priority'], x['sort_order'], x.get('child_order', 0), x['name']))
        
        return Response({
            "count": len(expanded_list),
            "guests": expanded_list,
        })
