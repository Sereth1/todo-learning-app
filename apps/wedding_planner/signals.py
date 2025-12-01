"""
Wedding Planner signals - Automatically create notifications on model changes.
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from apps.wedding_planner.models import Guest
from apps.wedding_planner.models.guest_model import AttendanceStatus
from apps.wedding_planner.services.notification_service import NotificationService


# Track previous attendance status
_guest_previous_status = {}


@receiver(pre_save, sender=Guest)
def track_guest_attendance_change(sender, instance, **kwargs):
    """
    Track attendance status before save to detect changes.
    """
    if instance.pk:
        try:
            old_instance = Guest.objects.get(pk=instance.pk)
            _guest_previous_status[instance.pk] = old_instance.attendance_status
        except Guest.DoesNotExist:
            pass


@receiver(post_save, sender=Guest)
def create_rsvp_notification(sender, instance, created, **kwargs):
    """
    Create notification when guest RSVP status changes.
    """
    if not instance.wedding:
        return
    
    wedding = instance.wedding
    user = wedding.owner
    
    if created:
        # New guest - no notification needed
        return
    
    # Check if attendance changed
    previous_status = _guest_previous_status.pop(instance.pk, None)
    current_status = instance.attendance_status
    
    if previous_status == current_status:
        return
    
    # Only notify on transitions TO accepted or declined
    if current_status == AttendanceStatus.YES:
        NotificationService.create_rsvp_accepted_notification(
            user=user,
            wedding=wedding,
            guest=instance,
        )
    elif current_status == AttendanceStatus.NO:
        NotificationService.create_rsvp_declined_notification(
            user=user,
            wedding=wedding,
            guest=instance,
        )
