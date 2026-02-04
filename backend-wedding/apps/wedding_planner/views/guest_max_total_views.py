from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.wedding_planner.models.guest_max_model import GuestsMax
from apps.wedding_planner.serializers.guest_max_total_serializer import (
    GuestMaxTotalSerializer,
)


class GuestMaxTotalViews(viewsets.ModelViewSet):
    """ViewSet for managing maximum guest limits."""

    queryset = GuestsMax.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = GuestMaxTotalSerializer
