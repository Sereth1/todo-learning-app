"""
TodoCategory ViewSet - Minimal logic, delegates to serializer.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.todo_list_wedding.models import TodoCategory
from apps.todo_list_wedding.serializers import (
    TodoCategorySerializer,
    TodoCategorySummarySerializer,
)


class TodoCategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing todo categories.
    
    Endpoints:
        GET    /categories/?wedding=<id>     - List categories
        POST   /categories/                  - Create category
        GET    /categories/<id>/             - Get category detail
        PUT    /categories/<id>/             - Update category
        DELETE /categories/<id>/             - Delete category
        GET    /categories/summary/          - Get lightweight list for dropdowns
        POST   /categories/reorder/          - Reorder categories
    """
    queryset = TodoCategory.objects.all()
    serializer_class = TodoCategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter by wedding query parameter."""
        queryset = super().get_queryset()
        wedding_id = self.request.query_params.get("wedding")
        if wedding_id:
            queryset = queryset.filter(wedding_id=wedding_id)
        
        # Only show active categories by default
        show_inactive = self.request.query_params.get("show_inactive", "false")
        if show_inactive.lower() != "true":
            queryset = queryset.filter(is_active=True)
        
        return queryset.order_by("order", "name")

    def get_serializer_context(self):
        """Add wedding to serializer context for validation."""
        context = super().get_serializer_context()
        wedding_id = self.request.data.get("wedding") or self.request.query_params.get("wedding")
        if wedding_id:
            context["wedding"] = wedding_id
        return context

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        """Get lightweight category list for dropdowns."""
        queryset = self.get_queryset()
        serializer = TodoCategorySummarySerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["post"], url_path="reorder")
    def reorder(self, request):
        """
        Reorder categories.
        
        Request body:
            {
                "category_ids": [3, 1, 2, 4]  // IDs in new order
            }
        """
        category_ids = request.data.get("category_ids", [])
        
        if not category_ids:
            return Response(
                {"error": "category_ids is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Update order for each category
        for order, category_id in enumerate(category_ids):
            TodoCategory.objects.filter(id=category_id).update(order=order)
        
        return Response({"status": "reordered", "count": len(category_ids)})
