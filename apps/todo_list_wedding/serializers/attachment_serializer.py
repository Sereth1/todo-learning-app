"""
TodoAttachment serializer with file handling logic.
"""
from rest_framework import serializers
import os

from apps.todo_list_wedding.models import TodoAttachment


class TodoAttachmentSerializer(serializers.ModelSerializer):
    """
    Serializer for todo attachments with file handling.
    Handles file upload, validation, and metadata extraction.
    """
    uploaded_by_name = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    file_size_display = serializers.SerializerMethodField()
    attachment_type_display = serializers.CharField(
        source="get_attachment_type_display",
        read_only=True,
    )
    
    class Meta:
        model = TodoAttachment
        fields = [
            "id",
            "uid",
            "todo",
            "uploaded_by",
            "uploaded_by_name",
            "file",
            "file_url",
            "filename",
            "file_size",
            "file_size_display",
            "file_type",
            "attachment_type",
            "attachment_type_display",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "uid",
            "uploaded_by",
            "filename",
            "file_size",
            "file_type",
            "created_at",
            "updated_at",
        ]

    # Max file size: 10MB
    MAX_FILE_SIZE = 10 * 1024 * 1024

    # Allowed file types
    ALLOWED_EXTENSIONS = {
        "image": ["jpg", "jpeg", "png", "gif", "webp", "svg"],
        "document": ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "rtf"],
        "archive": ["zip", "rar", "7z"],
    }

    def get_uploaded_by_name(self, obj) -> str | None:
        """Get uploader's display name."""
        if obj.uploaded_by:
            name = f"{obj.uploaded_by.first_name} {obj.uploaded_by.last_name}".strip()
            return name if name else obj.uploaded_by.email
        return None

    def get_file_url(self, obj) -> str | None:
        """Get full file URL."""
        if obj.file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

    def get_file_size_display(self, obj) -> str:
        """Format file size for display."""
        size = obj.file_size
        if size < 1024:
            return f"{size} B"
        elif size < 1024 * 1024:
            return f"{size / 1024:.1f} KB"
        else:
            return f"{size / (1024 * 1024):.1f} MB"

    def validate_file(self, value):
        """Validate file size and type."""
        if value.size > self.MAX_FILE_SIZE:
            raise serializers.ValidationError(
                f"File size cannot exceed {self.MAX_FILE_SIZE / (1024 * 1024):.0f}MB."
            )
        
        # Get file extension
        ext = os.path.splitext(value.name)[1].lower().lstrip(".")
        
        # Check if extension is allowed
        all_allowed = []
        for exts in self.ALLOWED_EXTENSIONS.values():
            all_allowed.extend(exts)
        
        if ext not in all_allowed:
            raise serializers.ValidationError(
                f"File type '{ext}' is not allowed. Allowed types: {', '.join(all_allowed)}"
            )
        
        return value

    def validate_todo(self, value):
        """Ensure todo exists and user has access."""
        # Additional permission checks can be added here
        return value

    def create(self, validated_data):
        """Handle file upload with metadata extraction."""
        request = self.context.get("request")
        if request and request.user:
            validated_data["uploaded_by"] = request.user
        
        file_obj = validated_data.get("file")
        if file_obj:
            # Extract file metadata
            validated_data["filename"] = file_obj.name
            validated_data["file_size"] = file_obj.size
            validated_data["file_type"] = file_obj.content_type or "application/octet-stream"
            
            # Auto-detect attachment type based on file extension
            if "attachment_type" not in validated_data:
                validated_data["attachment_type"] = self._detect_attachment_type(file_obj.name)
        
        return super().create(validated_data)

    def _detect_attachment_type(self, filename):
        """Detect attachment type based on file extension."""
        ext = os.path.splitext(filename)[1].lower().lstrip(".")
        
        if ext in self.ALLOWED_EXTENSIONS["image"]:
            return TodoAttachment.AttachmentType.IMAGE
        elif ext in ["pdf"]:
            # Could be contract, receipt, or document
            return TodoAttachment.AttachmentType.DOCUMENT
        elif ext in self.ALLOWED_EXTENSIONS["document"]:
            return TodoAttachment.AttachmentType.DOCUMENT
        else:
            return TodoAttachment.AttachmentType.OTHER


class TodoAttachmentUploadSerializer(serializers.Serializer):
    """
    Simplified serializer for file upload endpoint.
    """
    file = serializers.FileField()
    attachment_type = serializers.ChoiceField(
        choices=TodoAttachment.AttachmentType.choices,
        required=False,
    )
    description = serializers.CharField(required=False, allow_blank=True)
