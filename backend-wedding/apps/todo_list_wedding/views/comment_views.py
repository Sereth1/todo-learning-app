"""
TodoComment ViewSet for managing comments.
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.todo_list_wedding.models import TodoComment
from apps.todo_list_wedding.serializers import TodoCommentSerializer


class TodoCommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing todo comments.
    
    Endpoints:
        GET    /comments/?todo=<id>     - List comments for a todo
        POST   /comments/               - Create comment
        GET    /comments/<id>/          - Get comment
        PUT    /comments/<id>/          - Update comment
        DELETE /comments/<id>/          - Delete comment
    """
    queryset = TodoComment.objects.all()
    serializer_class = TodoCommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter by todo query parameter."""
        queryset = super().get_queryset()
        todo_id = self.request.query_params.get("todo")
        if todo_id:
            queryset = queryset.filter(todo_id=todo_id)
        return queryset.order_by("-created_at")

    def perform_destroy(self, instance):
        """Only allow author to delete their own comments."""
        if instance.author != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only delete your own comments.")
        instance.delete()

    def perform_update(self, serializer):
        """Only allow author to edit their own comments."""
        if serializer.instance.author != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only edit your own comments.")
        serializer.save()
