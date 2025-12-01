"""
Notification Serializers - All business logic in serializers per best practices.
"""
from rest_framework import serializers
from django.utils import timezone
from django.db.models import Count

from apps.wedding_planner.models.notifications_model import (
    Notification,
    NotificationPreference,
)
from apps.wedding_planner.services.notification_service import NotificationService


class RelatedTodoSerializer(serializers.Serializer):
    """Minimal todo info for notifications"""
    id = serializers.IntegerField()
    title = serializers.CharField()
    status = serializers.CharField()
    priority = serializers.CharField()
    due_date = serializers.DateField(allow_null=True)


class RelatedGuestSerializer(serializers.Serializer):
    """Minimal guest info for notifications"""
    id = serializers.IntegerField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    attendance_status = serializers.CharField()
    is_plus_one_coming = serializers.BooleanField()
    plus_one_name = serializers.CharField(allow_null=True)


class NotificationSerializer(serializers.ModelSerializer):
    """
    Full notification serializer with related data.
    """
    related_todo = RelatedTodoSerializer(read_only=True)
    related_guest = RelatedGuestSerializer(read_only=True)
    notification_type_display = serializers.CharField(
        source="get_notification_type_display",
        read_only=True,
    )
    priority_display = serializers.CharField(
        source="get_priority_display",
        read_only=True,
    )
    time_ago = serializers.SerializerMethodField()
    icon = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            "id",
            "uid",
            "notification_type",
            "notification_type_display",
            "title",
            "message",
            "priority",
            "priority_display",
            "is_read",
            "read_at",
            "link_url",
            "related_todo",
            "related_guest",
            "icon",
            "time_ago",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "uid",
            "notification_type",
            "title",
            "message",
            "priority",
            "link_url",
            "related_todo",
            "related_guest",
            "created_at",
            "updated_at",
        ]
    
    def get_time_ago(self, obj) -> str:
        """Get human-readable time ago string."""
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff.days > 30:
            months = diff.days // 30
            return f"{months} month{'s' if months > 1 else ''} ago"
        elif diff.days > 0:
            return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        else:
            return "Just now"
    
    def get_icon(self, obj) -> str:
        """Get icon identifier for notification type."""
        icon_map = {
            Notification.NotificationType.TODO_DUE_SOON: "clock",
            Notification.NotificationType.TODO_DUE_NOW: "bell",
            Notification.NotificationType.TODO_OVERDUE: "alert-triangle",
            Notification.NotificationType.TODO_REMINDER: "calendar",
            Notification.NotificationType.RSVP_ACCEPTED: "user-check",
            Notification.NotificationType.RSVP_DECLINED: "user-x",
            Notification.NotificationType.RSVP_PENDING: "user-clock",
            Notification.NotificationType.RSVP: "users",
            Notification.NotificationType.PAYMENT: "credit-card",
            Notification.NotificationType.TASK: "check-square",
            Notification.NotificationType.VENDOR: "store",
            Notification.NotificationType.TEAM: "users",
            Notification.NotificationType.GUEST: "user",
            Notification.NotificationType.SYSTEM: "info",
            Notification.NotificationType.REMINDER: "bell",
        }
        return icon_map.get(obj.notification_type, "bell")
    
    def update(self, instance, validated_data):
        """Handle marking as read/unread."""
        is_read = validated_data.get("is_read")
        
        if is_read is not None:
            if is_read and not instance.is_read:
                instance.mark_read()
            elif not is_read and instance.is_read:
                instance.mark_unread()
        
        return instance


class NotificationListSerializer(serializers.ModelSerializer):
    """
    Lighter serializer for list views.
    """
    notification_type_display = serializers.CharField(
        source="get_notification_type_display",
        read_only=True,
    )
    time_ago = serializers.SerializerMethodField()
    icon = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            "id",
            "uid",
            "notification_type",
            "notification_type_display",
            "title",
            "message",
            "priority",
            "is_read",
            "link_url",
            "icon",
            "time_ago",
            "created_at",
        ]
    
    def get_time_ago(self, obj) -> str:
        """Get human-readable time ago string."""
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff.days > 30:
            months = diff.days // 30
            return f"{months}mo ago"
        elif diff.days > 0:
            return f"{diff.days}d ago"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours}h ago"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes}m ago"
        else:
            return "Now"
    
    def get_icon(self, obj) -> str:
        """Get icon identifier for notification type."""
        icon_map = {
            Notification.NotificationType.TODO_DUE_SOON: "clock",
            Notification.NotificationType.TODO_DUE_NOW: "bell",
            Notification.NotificationType.TODO_OVERDUE: "alert-triangle",
            Notification.NotificationType.TODO_REMINDER: "calendar",
            Notification.NotificationType.RSVP_ACCEPTED: "user-check",
            Notification.NotificationType.RSVP_DECLINED: "user-x",
            Notification.NotificationType.RSVP_PENDING: "user-clock",
            Notification.NotificationType.RSVP: "users",
            Notification.NotificationType.PAYMENT: "credit-card",
            Notification.NotificationType.TASK: "check-square",
            Notification.NotificationType.VENDOR: "store",
            Notification.NotificationType.TEAM: "users",
            Notification.NotificationType.GUEST: "user",
            Notification.NotificationType.SYSTEM: "info",
            Notification.NotificationType.REMINDER: "bell",
        }
        return icon_map.get(obj.notification_type, "bell")


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """
    Serializer for notification preferences.
    Includes validation logic for quiet hours.
    """
    
    class Meta:
        model = NotificationPreference
        fields = [
            "id",
            "uid",
            "todo_due_soon_enabled",
            "todo_due_now_enabled",
            "todo_overdue_enabled",
            "rsvp_accepted_enabled",
            "rsvp_declined_enabled",
            "email_rsvp_received",
            "email_payment_reminder",
            "email_task_due",
            "email_vendor_message",
            "email_team_activity",
            "email_guest_message",
            "email_weekly_summary",
            "push_enabled",
            "push_rsvp_received",
            "push_check_in",
            "push_urgent_only",
            "quiet_hours_enabled",
            "quiet_start_time",
            "quiet_end_time",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "uid", "created_at", "updated_at"]
    
    def validate(self, attrs):
        """Validate quiet hours configuration."""
        quiet_enabled = attrs.get(
            "quiet_hours_enabled",
            self.instance.quiet_hours_enabled if self.instance else False
        )
        quiet_start = attrs.get(
            "quiet_start_time",
            self.instance.quiet_start_time if self.instance else None
        )
        quiet_end = attrs.get(
            "quiet_end_time",
            self.instance.quiet_end_time if self.instance else None
        )
        
        if quiet_enabled:
            if not quiet_start or not quiet_end:
                raise serializers.ValidationError({
                    "quiet_start_time": "Start and end times required when quiet hours enabled.",
                    "quiet_end_time": "Start and end times required when quiet hours enabled.",
                })
        
        return attrs


class MarkNotificationsReadSerializer(serializers.Serializer):
    """
    Serializer for bulk marking notifications as read.
    All logic in serializer.
    """
    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="List of notification IDs to mark as read. If empty, marks all as read.",
    )
    mark_all = serializers.BooleanField(
        default=False,
        help_text="If true, mark all notifications as read.",
    )
    
    def validate(self, attrs):
        """Ensure either notification_ids or mark_all is provided."""
        notification_ids = attrs.get("notification_ids", [])
        mark_all = attrs.get("mark_all", False)
        
        if not notification_ids and not mark_all:
            raise serializers.ValidationError(
                "Either provide notification_ids or set mark_all to true."
            )
        
        return attrs
    
    def save(self, user, wedding=None):
        """
        Perform the mark as read operation.
        Returns count of notifications marked.
        """
        mark_all = self.validated_data.get("mark_all", False)
        notification_ids = self.validated_data.get("notification_ids", [])
        
        if mark_all:
            count = NotificationService.mark_all_as_read(user, wedding)
        else:
            queryset = Notification.objects.filter(
                user=user,
                id__in=notification_ids,
                is_read=False,
            )
            if wedding:
                queryset = queryset.filter(wedding=wedding)
            
            count = queryset.count()
            queryset.update(is_read=True, read_at=timezone.now())
        
        return {"marked_count": count}


class CreateNotificationSerializer(serializers.Serializer):
    """
    Serializer for manually creating notifications (admin/system use).
    All validation and creation logic in serializer.
    """
    notification_type = serializers.ChoiceField(
        choices=Notification.NotificationType.choices,
        default=Notification.NotificationType.SYSTEM,
    )
    title = serializers.CharField(max_length=300)
    message = serializers.CharField()
    priority = serializers.ChoiceField(
        choices=Notification.Priority.choices,
        default=Notification.Priority.NORMAL,
    )
    link_url = serializers.CharField(max_length=500, required=False, allow_blank=True)
    related_todo_id = serializers.IntegerField(required=False, allow_null=True)
    related_guest_id = serializers.IntegerField(required=False, allow_null=True)
    
    def validate_related_todo_id(self, value):
        """Validate todo exists if provided."""
        if value:
            from apps.todo_list_wedding.models import Todo
            if not Todo.objects.filter(id=value).exists():
                raise serializers.ValidationError("Todo not found.")
        return value
    
    def validate_related_guest_id(self, value):
        """Validate guest exists if provided."""
        if value:
            from apps.wedding_planner.models import Guest
            if not Guest.objects.filter(id=value).exists():
                raise serializers.ValidationError("Guest not found.")
        return value
    
    def create(self, validated_data):
        """Create the notification."""
        user = self.context["user"]
        wedding = self.context["wedding"]
        
        related_todo_id = validated_data.pop("related_todo_id", None)
        related_guest_id = validated_data.pop("related_guest_id", None)
        
        notification = Notification.objects.create(
            user=user,
            wedding=wedding,
            related_todo_id=related_todo_id,
            related_guest_id=related_guest_id,
            **validated_data,
        )
        
        return notification
