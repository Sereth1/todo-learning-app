from rest_framework import viewsets
from apps.commons.serializers.categories_serializer import CategoriesSerializer
from apps.commons.models.categories_model import Category
from rest_framework.permissions import AllowAny


class Categories(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategoriesSerializer
    permission_classes = [AllowAny]
