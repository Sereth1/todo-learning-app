"""
Notification Views - Thin views, logic in serializers and services.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.wedding_planner.models.notifications_model import Notification, NotificationPreference
from apps.wedding_planner.models import Wedding
from apps.wedding_planner.serializers.notification_serializers import (
    NotificationSerializer,
    NotificationListSerializer,
    NotificationPreferenceSerializer,
    MarkNotificationsReadSerializer,
    CreateNotificationSerializer,
)
from apps.wedding_planner.services.notification_service import NotificationService


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for notifications.
    
    Endpoints:
    - GET /notifications/?wedding=<id> - List notifications
    - GET /notifications/<id>/ - Get notification detail
    - PATCH /notifications/<id>/ - Mark as read/unread
    - DELETE /notifications/<id>/ - Delete notification
    - GET /notifications/stats/ - Get notification statistics
    - GET /notifications/unread-count/ - Get unread count
    - POST /notifications/mark-read/ - Bulk mark as read
    - POST /notifications/check-todos/ - Check and create todo notifications
    """
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == "list":
            return NotificationListSerializer
        return NotificationSerializer
    
    def get_queryset(self):
        """Filter notifications by user and optional wedding."""
        queryset = Notification.objects.filter(user=self.request.user)
        
        wedding_id = self.request.query_params.get("wedding")
        if wedding_id:
            queryset = queryset.filter(wedding_id=wedding_id)
        
        # Optional type filter
        notification_type = self.request.query_params.get("type")
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        
        # Optional read filter
        is_read = self.request.query_params.get("is_read")
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == "true")
        
        # Optional priority filter
        priority = self.request.query_params.get("priority")
        if priority:
            queryset = queryset.filter(priority=priority)
        
        return queryset.select_related(
            "wedding",
            "related_todo",
            "related_guest",
        ).order_by("-created_at")
    
    @action(detail=False, methods=["get"])
    def stats(self, request):
        """
        Get notification statistics.
        GET /notifications/stats/?wedding=<id>
        """
        wedding_id = request.query_params.get("wedding")
        wedding = None
        
        if wedding_id:
            try:
                wedding = Wedding.objects.get(id=wedding_id, owner=request.user)
            except Wedding.DoesNotExist:
                return Response(
                    {"error": "Wedding not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        stats = NotificationService.get_stats(request.user, wedding)
        return Response(stats)
    
    @action(detail=False, methods=["get"], url_path="unread-count")
    def unread_count(self, request):
        """
        Get unread notification count.
        GET /notifications/unread-count/?wedding=<id>
        """
        wedding_id = request.query_params.get("wedding")
        wedding = None
        
        if wedding_id:
            try:
                wedding = Wedding.objects.get(id=wedding_id, owner=request.user)
            except Wedding.DoesNotExist:
                return Response(
                    {"error": "Wedding not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        count = NotificationService.get_unread_count(request.user, wedding)
        return Response({"unread_count": count})
    
    @action(detail=False, methods=["post"], url_path="mark-read")
    def mark_read(self, request):
        """
        Bulk mark notifications as read.
        POST /notifications/mark-read/
        Body: { "notification_ids": [1, 2, 3] } or { "mark_all": true }
        """
        wedding_id = request.query_params.get("wedding")
        wedding = None
        
        if wedding_id:
            try:
                wedding = Wedding.objects.get(id=wedding_id, owner=request.user)
            except Wedding.DoesNotExist:
                return Response(
                    {"error": "Wedding not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        serializer = MarkNotificationsReadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.save(request.user, wedding)
        
        return Response(result)
    
    @action(detail=False, methods=["post"], url_path="check-todos")
    def check_todos(self, request):
        """
        Check todos and create notifications for due/overdue items.
        POST /notifications/check-todos/?wedding=<id>
        
        This endpoint can be called by a cron job or manually.
        """
        wedding_id = request.query_params.get("wedding")
        
        if not wedding_id:
            return Response(
                {"error": "wedding query param required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            wedding = Wedding.objects.get(id=wedding_id, owner=request.user)
        except Wedding.DoesNotExist:
            return Response(
                {"error": "Wedding not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        counts = NotificationService.check_and_create_todo_notifications(wedding)
        
        return Response({
            "message": "Todo notifications checked",
            "notifications_created": counts,
        })
    
    @action(detail=False, methods=["post"])
    def create_notification(self, request):
        """
        Manually create a notification (for system/admin use).
        POST /notifications/create_notification/?wedding=<id>
        """
        wedding_id = request.query_params.get("wedding")
        
        if not wedding_id:
            return Response(
                {"error": "wedding query param required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            wedding = Wedding.objects.get(id=wedding_id, owner=request.user)
        except Wedding.DoesNotExist:
            return Response(
                {"error": "Wedding not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = CreateNotificationSerializer(
            data=request.data,
            context={"user": request.user, "wedding": wedding}
        )
        serializer.is_valid(raise_exception=True)
        notification = serializer.save()
        
        return Response(
            NotificationSerializer(notification).data,
            status=status.HTTP_201_CREATED
        )


class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for notification preferences.
    
    Endpoints:
    - GET /notification-preferences/?wedding=<id> - Get preferences
    - PATCH /notification-preferences/<id>/ - Update preferences
    """
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationPreferenceSerializer
    
    def get_queryset(self):
        return NotificationPreference.objects.filter(user=self.request.user)
    
    def list(self, request, *args, **kwargs):
        """
        Get preferences for a wedding, creating if not exists.
        GET /notification-preferences/?wedding=<id>
        """
        wedding_id = request.query_params.get("wedding")
        
        if not wedding_id:
            return Response(
                {"error": "wedding query param required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            wedding = Wedding.objects.get(id=wedding_id, owner=request.user)
        except Wedding.DoesNotExist:
            return Response(
                {"error": "Wedding not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get or create preferences
        prefs = NotificationService.get_or_create_preferences(request.user, wedding)
        serializer = self.get_serializer(prefs)
        
        return Response(serializer.data)
