"""
TodoAttachment ViewSet for managing file attachments.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from apps.todo_list_wedding.models import TodoAttachment
from apps.todo_list_wedding.serializers import TodoAttachmentSerializer
from apps.todo_list_wedding.serializers.attachment_serializer import TodoAttachmentUploadSerializer


class TodoAttachmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing todo attachments.
    
    Endpoints:
        GET    /attachments/?todo=<id>     - List attachments for a todo
        POST   /attachments/               - Upload attachment
        GET    /attachments/<id>/          - Get attachment detail
        DELETE /attachments/<id>/          - Delete attachment
    """
    queryset = TodoAttachment.objects.all()
    serializer_class = TodoAttachmentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        """Filter by todo query parameter."""
        queryset = super().get_queryset()
        todo_id = self.request.query_params.get("todo")
        if todo_id:
            queryset = queryset.filter(todo_id=todo_id)
        
        # Filter by type
        attachment_type = self.request.query_params.get("type")
        if attachment_type:
            queryset = queryset.filter(attachment_type=attachment_type)
        
        return queryset.order_by("-created_at")

    def create(self, request, *args, **kwargs):
        """Handle file upload with todo association."""
        todo_id = request.data.get("todo")
        if not todo_id:
            return Response(
                {"error": "todo is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Validate file
        upload_serializer = TodoAttachmentUploadSerializer(data=request.data)
        upload_serializer.is_valid(raise_exception=True)
        
        # Create with full serializer
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="by-type")
    def by_type(self, request):
        """
        Get attachments grouped by type.
        
        Query params:
            todo: Required todo ID
        """
        todo_id = request.query_params.get("todo")
        if not todo_id:
            return Response(
                {"error": "todo is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        attachments = TodoAttachment.objects.filter(todo_id=todo_id)
        
        from collections import defaultdict
        grouped = defaultdict(list)
        
        for attachment in attachments:
            grouped[attachment.attachment_type].append(
                TodoAttachmentSerializer(attachment, context={"request": request}).data
            )
        
        return Response(dict(grouped))

    def perform_destroy(self, instance):
        """Delete file when attachment is deleted."""
        # Delete the physical file
        if instance.file:
            instance.file.delete(save=False)
        instance.delete()
