from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.commons.models.todo_model import Todo
from apps.commons.serializers.todo_serializers import TodoSerializer


class TodoViews(viewsets.ModelViewSet):
    """Legacy todo ViewSet from commons app."""

    serializer_class = TodoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Scope todos to the authenticated user."""
        return Todo.objects.filter(user=self.request.user)

    @action(detail=False, methods=["get"], url_path="server-time")
    def get_server_time(self, request):
        """Get current server time."""
        now = timezone.now()
        return Response(
            {
                "server_time_utc": now.isoformat(),
                "timestamp": now.timestamp(),
                "timezone": str(now.tzinfo),
            }
        )

    @action(detail=False, methods=["get"], url_path="active")
    def get_active_todos(self, request):
        """Return only currently active todos for the user."""
        todos = self.get_queryset()
        active_todos = [todo for todo in todos if todo.is_active == "active"]
        serializer = self.get_serializer(active_todos, many=True)
        return Response(serializer.data)
