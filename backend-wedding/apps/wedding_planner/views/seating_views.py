from django.db import models
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.wedding_planner.models.seating_model import Table, SeatingAssignment
from apps.wedding_planner.models import Wedding, Guest, AttendanceStatus
from apps.wedding_planner.serializers.seating_serializer import (
    TableSerializer,
    TableSummarySerializer,
    SeatingAssignmentSerializer,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_TIER_PRIORITY = {"first": 1, "second": 2, "third": 3}


def _get_seating_summary(tables):
    """Calculate seating summary stats from a queryset of tables."""
    total_capacity = sum(t.capacity for t in tables)
    total_seated = sum(t.seats_taken for t in tables)
    return {
        "total_tables": tables.count(),
        "total_capacity": total_capacity,
        "total_seated": total_seated,
        "seats_available": total_capacity - total_seated,
        "occupancy_rate": (
            round(total_seated / total_capacity * 100, 1) if total_capacity > 0 else 0
        ),
        "tables_full": sum(1 for t in tables if t.is_full),
        "vip_tables": tables.filter(is_vip=True).count(),
    }


def _build_unassigned_guests_list(user, wedding_id=None):
    """
    Build the expanded list of unassigned attendees
    (guests, plus-ones, children) sorted by priority.
    """
    confirmed_guests = (
        Guest.objects.filter(
            wedding__owner=user,
            attendance_status=AttendanceStatus.YES,
        )
        .prefetch_related("child_set")
        .order_by("guest_type", "relationship_tier", "last_name", "first_name")
    )
    if wedding_id:
        confirmed_guests = confirmed_guests.filter(wedding_id=wedding_id)

    existing_assignments = SeatingAssignment.objects.filter(
        guest__wedding__owner=user,
    ).select_related("child")
    if wedding_id:
        existing_assignments = existing_assignments.filter(
            guest__wedding_id=wedding_id,
        )

    # Build sets of already-assigned IDs
    assigned_guests: set[int] = set()
    assigned_plus_ones: set[int] = set()
    assigned_children: set[int] = set()

    for a in existing_assignments:
        if a.attendee_type == "guest":
            assigned_guests.add(a.guest_id)
        elif a.attendee_type == "plus_one":
            assigned_plus_ones.add(a.guest_id)
        elif a.attendee_type == "child" and a.child_id:
            assigned_children.add(a.child_id)

    expanded: list[dict] = []

    for guest in confirmed_guests:
        priority = (
            _TIER_PRIORITY.get(guest.relationship_tier, 4)
            if guest.guest_type == "family"
            else 5
        )

        # Primary guest
        if guest.id not in assigned_guests:
            expanded.append(
                {
                    "id": f"guest-{guest.id}",
                    "guest_id": guest.id,
                    "type": "guest",
                    "name": f"{guest.first_name} {guest.last_name}",
                    "email": guest.email,
                    "guest_type": guest.guest_type,
                    "guest_type_display": guest.get_guest_type_display(),
                    "family_relationship": guest.family_relationship,
                    "family_relationship_display": (
                        guest.get_family_relationship_display()
                        if guest.family_relationship
                        else None
                    ),
                    "relationship_tier": guest.relationship_tier,
                    "relationship_tier_display": (
                        guest.get_relationship_tier_display()
                        if guest.relationship_tier
                        else None
                    ),
                    "is_primary": True,
                    "priority": priority,
                    "sort_order": 1,
                    "has_plus_one": guest.is_plus_one_coming,
                    "has_children": guest.has_children,
                    "children_count": (
                        guest.child_set.count() if guest.has_children else 0
                    ),
                }
            )

        # Plus-one
        if guest.is_plus_one_coming and guest.id not in assigned_plus_ones:
            plus_one_name = guest.plus_one_name or "Plus One"
            expanded.append(
                {
                    "id": f"plusone-{guest.id}",
                    "guest_id": guest.id,
                    "type": "plus_one",
                    "name": plus_one_name,
                    "display_name": f"{plus_one_name} (+ of {guest.first_name})",
                    "email": "",
                    "guest_type": "plus_one",
                    "is_primary": False,
                    "parent_guest": f"{guest.first_name} {guest.last_name}",
                    "parent_guest_id": guest.id,
                    "priority": priority,
                    "sort_order": 2,
                }
            )

        # Children
        if guest.has_children:
            for idx, child in enumerate(guest.child_set.all(), 1):
                if child.id not in assigned_children:
                    expanded.append(
                        {
                            "id": f"child-{child.id}",
                            "guest_id": guest.id,
                            "child_id": child.id,
                            "type": "child",
                            "name": child.first_name,
                            "display_name": (
                                f"{child.first_name} "
                                f"(child of {guest.first_name}, age {child.age})"
                            ),
                            "email": "",
                            "guest_type": "child",
                            "is_primary": False,
                            "parent_guest": f"{guest.first_name} {guest.last_name}",
                            "parent_guest_id": guest.id,
                            "age": child.age,
                            "priority": priority,
                            "sort_order": 3,
                            "child_order": idx,
                        }
                    )

    expanded.sort(
        key=lambda x: (
            x["priority"],
            x["sort_order"],
            x.get("child_order", 0),
            x["name"],
        )
    )
    return expanded


# ---------------------------------------------------------------------------
# ViewSets
# ---------------------------------------------------------------------------


class TableViews(viewsets.ModelViewSet):
    """
    ViewSet for managing tables.
    Tables are filtered by wedding owned by the current user.
    """

    serializer_class = TableSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        wedding_id = (
            self.kwargs.get("wedding_pk")
            or self.request.query_params.get("wedding")
        )
        if wedding_id:
            return Table.objects.filter(wedding_id=wedding_id, wedding__owner=user)
        return Table.objects.filter(wedding__owner=user)

    def perform_create(self, serializer):
        """Set the wedding and auto-generate table_number when creating a table."""
        wedding_id = self.kwargs.get("wedding_pk") or self.request.data.get("wedding")
        if wedding_id:
            wedding = Wedding.objects.filter(
                id=wedding_id, owner=self.request.user
            ).first()
            if wedding:
                table_number = self.request.data.get("table_number")
                if not table_number:
                    max_number = (
                        Table.objects.filter(wedding=wedding).aggregate(
                            models.Max("table_number")
                        )["table_number__max"]
                        or 0
                    )
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
        return Response(_get_seating_summary(self.get_queryset()))

    @action(detail=False, methods=["get"], url_path="dashboard")
    def dashboard(self, request):
        """
        Get all seating data in a single call: tables, unassigned guests, and
        summary stats.  Reduces 3 API calls to 1 for the seating page.
        """
        wedding_id = request.query_params.get("wedding")
        tables = self.get_queryset()

        return Response(
            {
                "tables": TableSerializer(tables, many=True).data,
                "unassigned_guests": _build_unassigned_guests_list(
                    request.user, wedding_id
                ),
                "summary": _get_seating_summary(tables),
            }
        )

    @action(detail=True, methods=["post"], url_path="assign-guest")
    def assign_guest(self, request, pk=None):
        """Assign a guest to this table."""
        table = self.get_object()
        guest_id = request.data.get("guest_id")
        seat_number = request.data.get("seat_number")

        if not guest_id:
            return Response(
                {"error": "guest_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if table.is_full:
            return Response(
                {"error": f"Table {table} is already at capacity"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            guest = Guest.objects.get(pk=guest_id, wedding=table.wedding)
        except Guest.DoesNotExist:
            return Response(
                {"error": "Guest not found or doesn't belong to this wedding"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if SeatingAssignment.objects.filter(guest=guest, attendee_type="guest").exists():
            return Response(
                {"error": "Guest is already assigned to a table"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        assignment = SeatingAssignment.objects.create(
            guest=guest, table=table, seat_number=seat_number
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
        user = self.request.user
        wedding_id = (
            self.kwargs.get("wedding_pk")
            or self.request.query_params.get("wedding")
        )
        qs = SeatingAssignment.objects.select_related("guest", "table").filter(
            table__wedding__owner=user
        )
        if wedding_id:
            qs = qs.filter(table__wedding_id=wedding_id)
        return qs

    def destroy(self, request, *args, **kwargs):
        """Delete a seating assignment with proper ownership check."""
        try:
            assignment = SeatingAssignment.objects.select_related(
                "table__wedding"
            ).get(pk=kwargs.get("pk"), table__wedding__owner=request.user)
            assignment.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except SeatingAssignment.DoesNotExist:
            return Response(
                {"error": "Assignment not found or you don't have permission"},
                status=status.HTTP_404_NOT_FOUND,
            )

    def create(self, request, *args, **kwargs):
        """Create a seating assignment, validating ownership."""
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
                status=status.HTTP_404_NOT_FOUND,
            )

        # Validate table ownership
        try:
            table = Table.objects.get(pk=table_id, wedding__owner=user)
        except Table.DoesNotExist:
            return Response(
                {"error": "Table not found or doesn't belong to your wedding"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Validate child if attendee_type is child
        child = None
        if attendee_type == "child":
            if not child_id:
                return Response(
                    {"error": "child_id is required for child attendee type"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                child = Child.objects.get(pk=child_id, guest=guest)
            except Child.DoesNotExist:
                return Response(
                    {"error": "Child not found or doesn't belong to this guest"},
                    status=status.HTTP_404_NOT_FOUND,
                )

        # Check if this specific attendee is already assigned
        existing = SeatingAssignment.objects.filter(
            guest=guest, attendee_type=attendee_type
        )
        if attendee_type == "child":
            existing = existing.filter(child=child)

        if existing.exists():
            return Response(
                {"error": "This attendee is already assigned to a table"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check table capacity
        if table.is_full:
            return Response(
                {"error": f"Table {table.name or table.table_number} is at capacity"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        assignment = SeatingAssignment.objects.create(
            guest=guest,
            table=table,
            attendee_type=attendee_type,
            child=child,
            seat_number=request.data.get("seat_number"),
        )
        serializer = self.get_serializer(assignment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(
        detail=False, methods=["delete"], url_path="by-guest/(?P<guest_id>[^/.]+)"
    )
    def delete_by_guest(self, request, guest_id=None):
        """Delete seating assignment by guest ID."""
        try:
            assignment = SeatingAssignment.objects.get(
                guest_id=guest_id, table__wedding__owner=request.user
            )
            assignment.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except SeatingAssignment.DoesNotExist:
            return Response(
                {"error": "Assignment not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

    @action(detail=False, methods=["get"], url_path="unassigned-guests")
    def get_unassigned_guests(self, request):
        """
        Get guests who don't have seating assignments.
        Returns an expanded list including the guest, their plus one, and children.
        """
        wedding_id = self.request.query_params.get("wedding")
        expanded_list = _build_unassigned_guests_list(request.user, wedding_id)

        return Response(
            {
                "count": len(expanded_list),
                "guests": expanded_list,
            }
        )
