"""
Notification Service - Business logic for creating and managing notifications.
All notification creation logic is centralized here for maintainability.
"""
from datetime import timedelta
from typing import Optional, List
from django.utils import timezone
from django.db.models import Q, Count

from apps.wedding_planner.models.notifications_model import (
    Notification,
    NotificationPreference,
)


class NotificationService:
    """
    Service class for notification management.
    Handles creation, retrieval, and management of notifications.
    """
    
    # ==================
    # TODO NOTIFICATIONS
    # ==================
    
    @classmethod
    def create_todo_due_soon_notification(
        cls,
        user,
        wedding,
        todo,
    ) -> Optional[Notification]:
        """
        Create notification for todo due in 30 minutes.
        Checks user preferences before creating.
        """
        # Check if user has this notification type enabled
        if not cls._is_notification_enabled(user, wedding, "todo_due_soon_enabled"):
            return None
        
        # Check if notification already exists for this todo and type
        existing = Notification.objects.filter(
            user=user,
            related_todo=todo,
            notification_type=Notification.NotificationType.TODO_DUE_SOON,
        ).exists()
        
        if existing:
            return None
        
        return Notification.objects.create(
            user=user,
            wedding=wedding,
            notification_type=Notification.NotificationType.TODO_DUE_SOON,
            title=f"⏰ Task due in 30 minutes: {todo.title}",
            message=f"Your task '{todo.title}' is due in 30 minutes. Make sure to complete it on time!",
            priority=Notification.Priority.HIGH,
            related_todo=todo,
            link_url=f"/dashboard/todos/{todo.id}",
        )
    
    @classmethod
    def create_todo_due_now_notification(
        cls,
        user,
        wedding,
        todo,
    ) -> Optional[Notification]:
        """
        Create notification for todo that is due now.
        """
        if not cls._is_notification_enabled(user, wedding, "todo_due_now_enabled"):
            return None
        
        # Avoid duplicate notifications
        existing = Notification.objects.filter(
            user=user,
            related_todo=todo,
            notification_type=Notification.NotificationType.TODO_DUE_NOW,
        ).exists()
        
        if existing:
            return None
        
        return Notification.objects.create(
            user=user,
            wedding=wedding,
            notification_type=Notification.NotificationType.TODO_DUE_NOW,
            title=f"🔔 Task due now: {todo.title}",
            message=f"Your task '{todo.title}' is due right now!",
            priority=Notification.Priority.URGENT,
            related_todo=todo,
            link_url=f"/dashboard/todos/{todo.id}",
        )
    
    @classmethod
    def create_todo_overdue_notification(
        cls,
        user,
        wedding,
        todo,
    ) -> Optional[Notification]:
        """
        Create notification for overdue todo.
        """
        if not cls._is_notification_enabled(user, wedding, "todo_overdue_enabled"):
            return None
        
        # Avoid duplicate notifications
        existing = Notification.objects.filter(
            user=user,
            related_todo=todo,
            notification_type=Notification.NotificationType.TODO_OVERDUE,
        ).exists()
        
        if existing:
            return None
        
        return Notification.objects.create(
            user=user,
            wedding=wedding,
            notification_type=Notification.NotificationType.TODO_OVERDUE,
            title=f"🚨 Task overdue: {todo.title}",
            message=f"Your task '{todo.title}' is now overdue. Please complete it as soon as possible.",
            priority=Notification.Priority.URGENT,
            related_todo=todo,
            link_url=f"/dashboard/todos/{todo.id}",
        )
    
    # ==================
    # RSVP NOTIFICATIONS
    # ==================
    
    @classmethod
    def create_rsvp_accepted_notification(
        cls,
        user,
        wedding,
        guest,
    ) -> Optional[Notification]:
        """
        Create notification when a guest accepts the wedding invitation.
        """
        if not cls._is_notification_enabled(user, wedding, "rsvp_accepted_enabled"):
            return None
        
        guest_name = f"{guest.first_name} {guest.last_name}"
        plus_one_text = ""
        if guest.is_plus_one_coming and guest.plus_one_name:
            plus_one_text = f" (with {guest.plus_one_name})"
        
        return Notification.objects.create(
            user=user,
            wedding=wedding,
            notification_type=Notification.NotificationType.RSVP_ACCEPTED,
            title=f"🎉 {guest_name} accepted your invitation!",
            message=f"{guest_name}{plus_one_text} has confirmed they will attend your wedding.",
            priority=Notification.Priority.NORMAL,
            related_guest=guest,
            link_url=f"/dashboard/guests/{guest.id}",
        )
    
    @classmethod
    def create_rsvp_declined_notification(
        cls,
        user,
        wedding,
        guest,
    ) -> Optional[Notification]:
        """
        Create notification when a guest declines the wedding invitation.
        """
        if not cls._is_notification_enabled(user, wedding, "rsvp_declined_enabled"):
            return None
        
        guest_name = f"{guest.first_name} {guest.last_name}"
        
        return Notification.objects.create(
            user=user,
            wedding=wedding,
            notification_type=Notification.NotificationType.RSVP_DECLINED,
            title=f"😔 {guest_name} declined your invitation",
            message=f"{guest_name} has indicated they cannot attend your wedding.",
            priority=Notification.Priority.LOW,
            related_guest=guest,
            link_url=f"/dashboard/guests/{guest.id}",
        )
    
    # ======================
    # GIFT REGISTRY NOTIFICATIONS
    # ======================
    
    @classmethod
    def create_gift_claimed_notification(
        cls,
        user,
        wedding,
        guest,
        item,
    ) -> Optional[Notification]:
        """
        Create notification when a guest claims a gift from the registry.
        """
        if not cls._is_notification_enabled(user, wedding, "gift_claimed_enabled"):
            return None
        
        guest_name = f"{guest.first_name} {guest.last_name}"
        item_name = item.name
        price_text = f" (${item.price})" if item.price else ""
        
        return Notification.objects.create(
            user=user,
            wedding=wedding,
            notification_type=Notification.NotificationType.GIFT_CLAIMED,
            title=f"🎁 {guest_name} will bring a gift!",
            message=f"{guest_name} has claimed \"{item_name}\"{price_text} from your gift registry.",
            priority=Notification.Priority.NORMAL,
            related_guest=guest,
            link_url="/dashboard/registry",
        )
    
    @classmethod
    def create_gift_unclaimed_notification(
        cls,
        user,
        wedding,
        guest,
        item,
    ) -> Optional[Notification]:
        """
        Create notification when a guest unclaims a gift from the registry.
        """
        if not cls._is_notification_enabled(user, wedding, "gift_claimed_enabled"):
            return None
        
        guest_name = f"{guest.first_name} {guest.last_name}"
        item_name = item.name
        
        return Notification.objects.create(
            user=user,
            wedding=wedding,
            notification_type=Notification.NotificationType.GIFT_UNCLAIMED,
            title=f"↩️ {guest_name} unclaimed a gift",
            message=f"{guest_name} has unclaimed \"{item_name}\" from your gift registry. It's available again.",
            priority=Notification.Priority.LOW,
            related_guest=guest,
            link_url="/dashboard/registry",
        )
    
    # ==================
    # BATCH OPERATIONS
    # ==================
    
    @classmethod
    def check_and_create_todo_notifications(cls, wedding) -> dict:
        """
        Check all todos for a wedding and create appropriate notifications.
        This should be called by a background task/cron job.
        
        Returns dict with counts of notifications created.
        """
        from apps.todo_list_wedding.models import Todo
        
        now = timezone.now()
        thirty_minutes_from_now = now + timedelta(minutes=30)
        
        # Get wedding owner
        user = wedding.owner
        
        counts = {
            "due_soon": 0,
            "due_now": 0,
            "overdue": 0,
        }
        
        # Get active todos (not completed or cancelled)
        active_todos = Todo.objects.filter(
            wedding=wedding,
        ).exclude(
            status__in=[Todo.Status.COMPLETED, Todo.Status.CANCELLED]
        )
        
        for todo in active_todos:
            if not todo.due_date:
                continue
            
            # Convert due_date to datetime if it's a date
            if hasattr(todo, 'due_time') and todo.due_time:
                from datetime import datetime
                due_datetime = datetime.combine(todo.due_date, todo.due_time)
                due_datetime = timezone.make_aware(due_datetime)
            else:
                # If no time, assume end of day
                from datetime import datetime, time
                due_datetime = datetime.combine(todo.due_date, time(23, 59, 59))
                due_datetime = timezone.make_aware(due_datetime)
            
            # Check if overdue
            if due_datetime < now:
                notification = cls.create_todo_overdue_notification(user, wedding, todo)
                if notification:
                    counts["overdue"] += 1
            
            # Check if due now (within 5 minutes)
            elif abs((due_datetime - now).total_seconds()) <= 300:
                notification = cls.create_todo_due_now_notification(user, wedding, todo)
                if notification:
                    counts["due_now"] += 1
            
            # Check if due soon (within 30 minutes)
            elif now <= due_datetime <= thirty_minutes_from_now:
                notification = cls.create_todo_due_soon_notification(user, wedding, todo)
                if notification:
                    counts["due_soon"] += 1
        
        return counts
    
    # ==================
    # QUERY METHODS
    # ==================
    
    @classmethod
    def get_unread_count(cls, user, wedding=None) -> int:
        """Get count of unread notifications for user."""
        queryset = Notification.objects.filter(user=user, is_read=False)
        if wedding:
            queryset = queryset.filter(wedding=wedding)
        return queryset.count()
    
    @classmethod
    def get_notifications(
        cls,
        user,
        wedding=None,
        notification_type: str = None,
        is_read: bool = None,
        limit: int = None,
    ) -> List[Notification]:
        """
        Get notifications for a user with optional filters.
        """
        queryset = Notification.objects.filter(user=user)
        
        if wedding:
            queryset = queryset.filter(wedding=wedding)
        
        if notification_type:
            queryset = queryset.filter(notification_type=notification_type)
        
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read)
        
        queryset = queryset.select_related(
            "wedding",
            "related_todo",
            "related_guest",
        ).order_by("-created_at")
        
        if limit:
            queryset = queryset[:limit]
        
        return list(queryset)
    
    @classmethod
    def mark_all_as_read(cls, user, wedding=None) -> int:
        """Mark all notifications as read. Returns count updated."""
        queryset = Notification.objects.filter(user=user, is_read=False)
        if wedding:
            queryset = queryset.filter(wedding=wedding)
        
        count = queryset.count()
        queryset.update(is_read=True, read_at=timezone.now())
        return count
    
    @classmethod
    def delete_old_notifications(cls, days: int = 30) -> int:
        """Delete notifications older than specified days. Returns count deleted."""
        cutoff_date = timezone.now() - timedelta(days=days)
        deleted, _ = Notification.objects.filter(
            created_at__lt=cutoff_date,
            is_read=True,
        ).delete()
        return deleted
    
    @classmethod
    def get_stats(cls, user, wedding=None) -> dict:
        """Get notification statistics."""
        queryset = Notification.objects.filter(user=user)
        if wedding:
            queryset = queryset.filter(wedding=wedding)
        
        total = queryset.count()
        unread = queryset.filter(is_read=False).count()
        
        # By type
        type_counts = queryset.values("notification_type").annotate(
            count=Count("id")
        ).order_by()
        by_type = {item["notification_type"]: item["count"] for item in type_counts}
        
        # By priority
        priority_counts = queryset.values("priority").annotate(
            count=Count("id")
        ).order_by()
        by_priority = {item["priority"]: item["count"] for item in priority_counts}
        
        # Recent (last 24 hours)
        yesterday = timezone.now() - timedelta(days=1)
        recent_count = queryset.filter(created_at__gte=yesterday).count()
        
        return {
            "total": total,
            "unread": unread,
            "read": total - unread,
            "by_type": by_type,
            "by_priority": by_priority,
            "recent_count": recent_count,
        }
    
    # ==================
    # HELPER METHODS
    # ==================
    
    @classmethod
    def _is_notification_enabled(cls, user, wedding, preference_field: str) -> bool:
        """
        Check if a specific notification type is enabled for user.
        Defaults to True if no preferences exist.
        """
        try:
            prefs = NotificationPreference.objects.get(user=user, wedding=wedding)
            return getattr(prefs, preference_field, True)
        except NotificationPreference.DoesNotExist:
            return True  # Default to enabled
    
    @classmethod
    def get_or_create_preferences(cls, user, wedding) -> NotificationPreference:
        """Get or create notification preferences for user/wedding."""
        prefs, created = NotificationPreference.objects.get_or_create(
            user=user,
            wedding=wedding,
        )
        return prefs
