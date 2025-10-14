from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from apps.commons.models.todo_model import Todo
from apps.commons.serializers.todo_serializers import TodoSerializer

class TodoViews(viewsets.ModelViewSet):
    queryset = Todo.objects.all()
    serializer_class=TodoSerializer
    permission_classes=[IsAuthenticated]
    
    @action(detail=False, methods=['get'], url_path='server-time')
    def get_server_time(self, request):
        """Get current server time"""
        from django.utils import timezone
        now = timezone.now()
        return Response({
            'server_time_utc': now.isoformat(),
            'timestamp': now.timestamp(),
            'timezone': 'UTC'
        })
    
 
    @action(detail=False, methods=['get'], url_path='active')
    def get_active_todos(self, request):
        todos = Todo.objects.filter(user=request.user)
        active_todos = [todo for todo in todos if todo.is_active == 'active']
        serializer = self.get_serializer(active_todos, many=True)
        return Response(serializer.data)
    
    