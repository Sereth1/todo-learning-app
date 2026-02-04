"""
TodoChecklist ViewSet for managing checklist items.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.todo_list_wedding.models import TodoChecklist
from apps.todo_list_wedding.serializers import TodoChecklistSerializer
from apps.todo_list_wedding.serializers.checklist_serializer import (
    TodoChecklistBulkSerializer,
    TodoChecklistReorderSerializer,
)


class TodoChecklistViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing todo checklist items.
    
    Endpoints:
        GET    /checklists/?todo=<id>       - List checklist items
        POST   /checklists/                 - Create checklist item
        GET    /checklists/<id>/            - Get checklist item
        PUT    /checklists/<id>/            - Update checklist item
        DELETE /checklists/<id>/            - Delete checklist item
        POST   /checklists/<id>/toggle/     - Toggle completion
        POST   /checklists/bulk-create/     - Create multiple items
        POST   /checklists/reorder/         - Reorder items
    """
    queryset = TodoChecklist.objects.all()
    serializer_class = TodoChecklistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter by todo query parameter."""
        queryset = super().get_queryset()
        todo_id = self.request.query_params.get("todo")
        if todo_id:
            queryset = queryset.filter(todo_id=todo_id)
        return queryset.order_by("order", "created_at")

    @action(detail=True, methods=["post"], url_path="toggle")
    def toggle(self, request, pk=None):
        """Toggle the completion status of a checklist item."""
        item = self.get_object()
        item.is_completed = not item.is_completed
        
        # The model's save method handles completed_at timestamp
        item.save()
        
        # Update parent todo's progress (handled in serializer logic)
        from apps.todo_list_wedding.serializers import TodoChecklistSerializer
        serializer = TodoChecklistSerializer()
        serializer._update_parent_progress(item.todo)
        
        return Response(TodoChecklistSerializer(item).data)

    @action(detail=False, methods=["post"], url_path="bulk-create")
    def bulk_create(self, request):
        """
        Create multiple checklist items at once.
        
        Request body:
            {
                "todo": 1,
                "items": [
                    {"title": "Item 1"},
                    {"title": "Item 2", "order": 5}
                ]
            }
        """
        todo_id = request.data.get("todo")
        if not todo_id:
            return Response(
                {"error": "todo is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        from apps.todo_list_wedding.models import Todo
        try:
            todo = Todo.objects.get(id=todo_id)
        except Todo.DoesNotExist:
            return Response(
                {"error": "Todo not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        serializer = TodoChecklistBulkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        created = serializer.create_bulk(todo)
        
        return Response({
            "created": len(created),
            "items": TodoChecklistSerializer(created, many=True).data,
        })

    @action(detail=False, methods=["post"], url_path="reorder")
    def reorder(self, request):
        """
        Reorder checklist items.
        
        Request body:
            {
                "todo": 1,
                "item_ids": [3, 1, 2, 4]
            }
        """
        todo_id = request.data.get("todo")
        if not todo_id:
            return Response(
                {"error": "todo is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        from apps.todo_list_wedding.models import Todo
        try:
            todo = Todo.objects.get(id=todo_id)
        except Todo.DoesNotExist:
            return Response(
                {"error": "Todo not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        serializer = TodoChecklistReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        items = serializer.reorder(todo)
        
        return Response({
            "reordered": True,
            "items": TodoChecklistSerializer(items, many=True).data,
        })

    @action(detail=False, methods=["post"], url_path="complete-all")
    def complete_all(self, request):
        """
        Mark all checklist items for a todo as completed.
        
        Request body:
            {"todo": 1}
        """
        todo_id = request.data.get("todo")
        if not todo_id:
            return Response(
                {"error": "todo is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        from django.utils import timezone
        count = TodoChecklist.objects.filter(
            todo_id=todo_id,
            is_completed=False,
        ).update(
            is_completed=True,
            completed_at=timezone.now(),
        )
        
        # Update parent todo's progress
        from apps.todo_list_wedding.models import Todo
        try:
            todo = Todo.objects.get(id=todo_id)
            from apps.todo_list_wedding.serializers import TodoChecklistSerializer
            serializer = TodoChecklistSerializer()
            serializer._update_parent_progress(todo)
        except Todo.DoesNotExist:
            pass
        
        return Response({"completed": count})

    @action(detail=False, methods=["post"], url_path="clear-completed")
    def clear_completed(self, request):
        """
        Delete all completed checklist items for a todo.
        
        Request body:
            {"todo": 1}
        """
        todo_id = request.data.get("todo")
        if not todo_id:
            return Response(
                {"error": "todo is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        deleted_count, _ = TodoChecklist.objects.filter(
            todo_id=todo_id,
            is_completed=True,
        ).delete()
        
        return Response({"deleted": deleted_count})
