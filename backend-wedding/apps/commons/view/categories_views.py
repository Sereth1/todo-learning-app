from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from apps.commons.models.categories_model import Category
from apps.commons.serializers.categories_serializer import CategoriesSerializer


class Categories(viewsets.ModelViewSet):
    """CRUD ViewSet for category types."""

    queryset = Category.objects.all()
    serializer_class = CategoriesSerializer
    permission_classes = [AllowAny]
