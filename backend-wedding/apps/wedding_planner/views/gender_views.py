from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from apps.wedding_planner.models.gender_model import Gender
from apps.wedding_planner.serializers.gender_serializer import GenderSerializer


class GenderViews(viewsets.ModelViewSet):
    """ViewSet for gender options. Public read access."""

    queryset = Gender.objects.all()
    serializer_class = GenderSerializer
    permission_classes = [AllowAny]
