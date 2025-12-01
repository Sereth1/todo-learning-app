"""
Server-Sent Events (SSE) for real-time notifications.
Lightweight alternative to WebSockets - perfect for one-way server→client communication.
"""
import json
import time
from django.http import StreamingHttpResponse
from django.utils import timezone
from django.views import View
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError

from apps.commons.models import User
from apps.wedding_planner.models import Wedding
from apps.wedding_planner.models.notifications_model import Notification


class NotificationSSEView(View):
    """
    SSE endpoint for real-time notifications.
    
    Usage: GET /api/wedding_planner/notifications/stream/?token=<jwt>&wedding=<id>
    
    Note: SSE doesn't support custom headers, so we use a query param for auth.
    The client connects and receives notifications as they happen.
    Uses polling on the database but streams to client instantly.
    """
    
    def get(self, request):
        # Authenticate via query param token (SSE doesn't support headers)
        token = request.GET.get("token")
        if not token:
            return StreamingHttpResponse(
                self._error_event("Authentication token required"),
                content_type="text/event-stream",
            )
        
        try:
            # Validate JWT token
            access_token = AccessToken(token)
            user_id = access_token["user_id"]
            user = User.objects.get(id=user_id)
        except (TokenError, User.DoesNotExist) as e:
            return StreamingHttpResponse(
                self._error_event("Invalid or expired token"),
                content_type="text/event-stream",
            )
        
        wedding_id = request.GET.get("wedding")
        wedding = None
        
        if wedding_id:
            try:
                wedding = Wedding.objects.get(id=wedding_id, owner=user)
            except Wedding.DoesNotExist:
                return StreamingHttpResponse(
                    self._error_event("Wedding not found"),
                    content_type="text/event-stream",
                )
        
        response = StreamingHttpResponse(
            self._event_stream(user, wedding),
            content_type="text/event-stream",
        )
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"  # Disable nginx buffering
        return response
    
    def _event_stream(self, user, wedding):
        """
        Generator that yields SSE events.
        Checks for new notifications every 2 seconds.
        
        If wedding is None, streams notifications for all user's weddings.
        """
        last_check = timezone.now()
        last_notification_id = self._get_latest_notification_id(user, wedding)
        
        # Send initial connection event
        yield self._format_event("connected", {
            "message": "Connected to notification stream",
            "wedding_id": wedding.id if wedding else None,
            "timestamp": timezone.now().isoformat(),
        })
        
        # Build base query
        base_filter = {"user": user}
        if wedding:
            base_filter["wedding"] = wedding
        
        # Send unread count on connect
        unread_count = Notification.objects.filter(**base_filter, is_read=False).count()
        yield self._format_event("unread_count", {"count": unread_count})
        
        # Keep connection alive and check for new notifications
        while True:
            try:
                # Check for new notifications
                new_notifications = Notification.objects.filter(
                    **base_filter,
                    id__gt=last_notification_id,
                ).order_by("id").select_related("related_todo", "related_guest")
                
                for notification in new_notifications:
                    yield self._format_event("notification", {
                        "id": notification.id,
                        "type": notification.notification_type,
                        "title": notification.title,
                        "message": notification.message,
                        "priority": notification.priority,
                        "is_read": notification.is_read,
                        "action_url": notification.action_url,
                        "created_at": notification.created_at.isoformat(),
                        "time_ago": self._time_ago(notification.created_at),
                        "related_todo_id": notification.related_todo_id,
                        "related_guest_id": notification.related_guest_id,
                    })
                    last_notification_id = notification.id
                
                # Update unread count if there were new notifications
                if new_notifications.exists():
                    unread_count = Notification.objects.filter(
                        **base_filter,
                        is_read=False,
                    ).count()
                    yield self._format_event("unread_count", {"count": unread_count})
                
                # Send heartbeat every 30 seconds to keep connection alive
                if (timezone.now() - last_check).seconds >= 30:
                    yield self._format_event("heartbeat", {
                        "timestamp": timezone.now().isoformat()
                    })
                    last_check = timezone.now()
                
                # Sleep before next check (2 seconds)
                time.sleep(2)
                
            except GeneratorExit:
                # Client disconnected
                break
            except Exception as e:
                yield self._format_event("error", {"message": str(e)})
                break
    
    def _get_latest_notification_id(self, user, wedding) -> int:
        """Get the ID of the latest notification."""
        base_filter = {"user": user}
        if wedding:
            base_filter["wedding"] = wedding
            
        latest = Notification.objects.filter(**base_filter).order_by("-id").first()
        return latest.id if latest else 0
    
    def _format_event(self, event_type: str, data: dict) -> str:
        """Format data as SSE event."""
        return f"event: {event_type}\ndata: {json.dumps(data)}\n\n"
    
    def _error_event(self, message: str):
        """Generate a single error event."""
        yield self._format_event("error", {"message": message})
    
    def _time_ago(self, dt) -> str:
        """Convert datetime to human-readable time ago string."""
        now = timezone.now()
        diff = now - dt
        
        seconds = diff.total_seconds()
        if seconds < 60:
            return "just now"
        elif seconds < 3600:
            minutes = int(seconds / 60)
            return f"{minutes}m ago"
        elif seconds < 86400:
            hours = int(seconds / 3600)
            return f"{hours}h ago"
        elif seconds < 604800:
            days = int(seconds / 86400)
            return f"{days}d ago"
        else:
            return dt.strftime("%b %d")
