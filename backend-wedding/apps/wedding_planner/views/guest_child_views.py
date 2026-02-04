from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.wedding_planner.models.guest_child_model import Child
from apps.wedding_planner.serializers.guest_child_serializer import ChildSerializer


class ChildViews(viewsets.ModelViewSet):
    """
    ViewSet for managing guest children.
    Children are scoped to weddings owned by the authenticated user.
    """

    serializer_class = ChildSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return children belonging to the current user's weddings."""
        queryset = Child.objects.filter(
            guest__wedding__owner=self.request.user
        ).select_related("guest", "gender")

        wedding_id = self.request.query_params.get("wedding")
        if wedding_id:
            queryset = queryset.filter(guest__wedding_id=wedding_id)

        return queryset

    @action(detail=False, methods=["get"], url_name="age")
    def age(self, request):
        """List children ordered by age descending."""
        queryset = self.get_queryset().order_by("-age")
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_name="last_name_search")
    def last_name_search(self, request):
        """Search children by last name."""
        last_name = request.query_params.get("last_name", "")
        if not last_name:
            return Response(
                {"message": "provide last_name query param"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        results = self.get_queryset().filter(last_name__icontains=last_name)
        if not results.exists():
            return Response(
                {"message": "last name not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = self.get_serializer(results, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_name="gender")
    def gender(self, request):
        """Filter children by gender."""
        gender = request.query_params.get("gender", "")
        if not gender:
            return Response(
                {"message": "provide gender query param"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        results = self.get_queryset().filter(gender__gender__icontains=gender)
        if not results.exists():
            return Response(
                {"message": "gender not found; valid: male, female, prefer_not_to_say"},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = self.get_serializer(results, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_name="male")
    def male_only(self, request):
        """List only male children."""
        results = self.get_queryset().filter(gender__gender__iexact="male")
        if not results.exists():
            return Response(
                {"message": "no male children found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = self.get_serializer(results, many=True)
        return Response(serializer.data)
