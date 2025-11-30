"""
TodoTemplate ViewSet for managing and applying templates.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.todo_list_wedding.models import TodoTemplate
from apps.todo_list_wedding.serializers import (
    TodoTemplateSerializer,
    ApplyTemplateSerializer,
    TodoListSerializer,
)
from apps.todo_list_wedding.serializers.template_serializer import DEFAULT_WEDDING_TEMPLATES


class TodoTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing todo templates.
    
    Endpoints:
        GET    /templates/?wedding=<id>     - List templates
        POST   /templates/                  - Create template
        GET    /templates/<id>/             - Get template detail
        PUT    /templates/<id>/             - Update template
        DELETE /templates/<id>/             - Delete template
        POST   /templates/apply/            - Apply templates to wedding
        POST   /templates/load-defaults/    - Load default wedding templates
        GET    /templates/by-timeline/      - Get templates grouped by timeline
    """
    queryset = TodoTemplate.objects.all()
    serializer_class = TodoTemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter by wedding (including global templates)."""
        queryset = super().get_queryset().filter(is_active=True)
        wedding_id = self.request.query_params.get("wedding")
        
        if wedding_id:
            # Include wedding-specific and global templates
            from django.db.models import Q
            queryset = queryset.filter(
                Q(wedding_id=wedding_id) | Q(wedding__isnull=True)
            )
        else:
            # Only global templates if no wedding specified
            queryset = queryset.filter(wedding__isnull=True)
        
        return queryset.order_by("timeline_position", "order")

    @action(detail=False, methods=["post"], url_path="apply")
    def apply(self, request):
        """
        Apply templates to create todos for a wedding.
        
        Request body:
            {
                "wedding": 1,
                "template_ids": [1, 2, 3],  // optional, applies all if empty
                "include_global": true,
                "wedding_date": "2025-06-15",  // optional
                "skip_existing": true
            }
        """
        wedding_id = request.data.get("wedding")
        if not wedding_id:
            return Response(
                {"error": "wedding is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        from apps.wedding_planner.models import Wedding
        try:
            wedding = Wedding.objects.get(id=wedding_id)
        except Wedding.DoesNotExist:
            return Response(
                {"error": "Wedding not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        serializer = ApplyTemplateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        result = serializer.apply_templates(wedding, user=request.user)
        
        return Response({
            "created": result["created"],
            "skipped": result["skipped"],
            "todos": TodoListSerializer(result["todos"], many=True).data,
            "skipped_details": result["skipped_details"],
        })

    @action(detail=False, methods=["post"], url_path="load-defaults")
    def load_defaults(self, request):
        """
        Load default wedding planning templates.
        Creates global templates that can be used by any wedding.
        
        Request body:
            {
                "wedding": 1,  // optional - creates wedding-specific if provided
                "overwrite": false  // optional - delete existing before loading
            }
        """
        wedding_id = request.data.get("wedding")
        overwrite = request.data.get("overwrite", False)
        
        wedding = None
        if wedding_id:
            from apps.wedding_planner.models import Wedding
            try:
                wedding = Wedding.objects.get(id=wedding_id)
            except Wedding.DoesNotExist:
                return Response(
                    {"error": "Wedding not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )
        
        # Delete existing templates if overwrite
        if overwrite:
            if wedding:
                TodoTemplate.objects.filter(wedding=wedding).delete()
            else:
                TodoTemplate.objects.filter(wedding__isnull=True).delete()
        
        # Create templates
        created = []
        for idx, template_data in enumerate(DEFAULT_WEDDING_TEMPLATES):
            template = TodoTemplate.objects.create(
                wedding=wedding,
                category_name=template_data.get("category_name", "Planning"),
                title=template_data.get("title"),
                description=template_data.get("description", ""),
                timeline_position=template_data.get("timeline_position", "6_9"),
                days_before_wedding=template_data.get("days_before_wedding"),
                priority=template_data.get("priority", "medium"),
                is_milestone=template_data.get("is_milestone", False),
                estimated_cost=template_data.get("estimated_cost"),
                order=idx,
                checklist_items=template_data.get("checklist_items", []),
            )
            created.append(template)
        
        return Response({
            "created": len(created),
            "templates": TodoTemplateSerializer(created, many=True).data,
        })

    @action(detail=False, methods=["get"], url_path="by-timeline")
    def by_timeline(self, request):
        """
        Get templates grouped by timeline position.
        Useful for displaying a planning timeline overview.
        """
        queryset = self.get_queryset()
        
        # Group by timeline position
        from collections import defaultdict
        grouped = defaultdict(list)
        
        for template in queryset:
            grouped[template.timeline_position].append(
                TodoTemplateSerializer(template).data
            )
        
        # Convert to list ordered by timeline
        timeline_order = [
            ("12_plus", "12+ Months Before"),
            ("9_12", "9-12 Months Before"),
            ("6_9", "6-9 Months Before"),
            ("4_6", "4-6 Months Before"),
            ("2_4", "2-4 Months Before"),
            ("1_2", "1-2 Months Before"),
            ("2_4_weeks", "2-4 Weeks Before"),
            ("1_week", "Final Week"),
            ("day_of", "Wedding Day"),
            ("post", "After Wedding"),
        ]
        
        result = []
        for position, label in timeline_order:
            if position in grouped:
                result.append({
                    "position": position,
                    "label": label,
                    "templates": grouped[position],
                })
        
        return Response(result)
