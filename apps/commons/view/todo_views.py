from apps.commons.models.todo_model import Todo
from apps.commons.serializers.todo_serializers import TodoSerializer
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

class TodoViews(viewsets.ModelViewSet):
    queryset = Todo.objects.all()
    serializer_class=TodoSerializer
    permission_classes=[IsAuthenticated]