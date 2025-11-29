from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .services import EmailService


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_rsvp_confirmation_email(request):
    """
    Send RSVP confirmation email to a guest.
    
    Request body:
    {
        "guest_id": 1,
        "confirmed": true  // true = attending, false = declining
    }
    """
    from apps.wedding_planner.models import Guest
    
    guest_id = request.data.get("guest_id")
    confirmed = request.data.get("confirmed")
    
    if guest_id is None or confirmed is None:
        return Response(
            {"error": "guest_id and confirmed fields are required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        guest = Guest.objects.get(pk=guest_id)
    except Guest.DoesNotExist:
        return Response(
            {"error": "Guest not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    email_sent = EmailService.send_rsvp_confirmation(guest, confirmed=confirmed)
    
    return Response({
        "success": email_sent,
        "message": f"RSVP confirmation email {'sent' if email_sent else 'failed'} to {guest.email}",
        "guest": {
            "id": guest.id,
            "name": f"{guest.first_name} {guest.last_name}",
            "email": guest.email,
        }
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_reminder_email(request):
    """
    Send RSVP reminder email to a pending guest.
    
    Request body:
    {
        "guest_id": 1,
        "deadline": "December 15, 2025"
    }
    """
    from apps.wedding_planner.models import Guest, AttendanceStatus
    
    guest_id = request.data.get("guest_id")
    deadline = request.data.get("deadline", "Please respond as soon as possible")
    
    if guest_id is None:
        return Response(
            {"error": "guest_id is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        guest = Guest.objects.get(pk=guest_id)
    except Guest.DoesNotExist:
        return Response(
            {"error": "Guest not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if guest.attendance_status != AttendanceStatus.PENDING:
        return Response(
            {"error": "Guest has already responded to RSVP"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    email_sent = EmailService.send_rsvp_reminder(guest, deadline)
    
    return Response({
        "success": email_sent,
        "message": f"Reminder email {'sent' if email_sent else 'failed'} to {guest.email}",
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_bulk_reminders(request):
    """
    Send reminder emails to all pending guests.
    
    Request body:
    {
        "deadline": "December 15, 2025"
    }
    """
    from apps.wedding_planner.models import Guest, AttendanceStatus
    
    deadline = request.data.get("deadline", "Please respond as soon as possible")
    pending_guests = Guest.objects.filter(attendance_status=AttendanceStatus.PENDING)
    
    results = {
        "sent": [],
        "failed": [],
    }
    
    for guest in pending_guests:
        if EmailService.send_rsvp_reminder(guest, deadline):
            results["sent"].append({
                "id": guest.id,
                "name": f"{guest.first_name} {guest.last_name}",
                "email": guest.email,
            })
        else:
            results["failed"].append({
                "id": guest.id,
                "name": f"{guest.first_name} {guest.last_name}",
                "email": guest.email,
            })
    
    return Response({
        "total_pending": pending_guests.count(),
        "sent_count": len(results["sent"]),
        "failed_count": len(results["failed"]),
        "results": results,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_event_details_email(request):
    """
    Send event details email to a confirmed guest.
    
    Request body:
    {
        "guest_id": 1,
        "event_id": 1  // optional, uses current active event if not provided
    }
    """
    from apps.wedding_planner.models import Guest, WeddingEvent, AttendanceStatus
    
    guest_id = request.data.get("guest_id")
    event_id = request.data.get("event_id")
    
    if guest_id is None:
        return Response(
            {"error": "guest_id is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        guest = Guest.objects.get(pk=guest_id)
    except Guest.DoesNotExist:
        return Response(
            {"error": "Guest not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if guest.attendance_status != AttendanceStatus.YES:
        return Response(
            {"error": "Can only send event details to confirmed guests"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get event
    if event_id:
        try:
            event = WeddingEvent.objects.get(pk=event_id)
        except WeddingEvent.DoesNotExist:
            return Response(
                {"error": "Event not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    else:
        event = WeddingEvent.objects.filter(is_active=True).first()
        if not event:
            return Response(
                {"error": "No active wedding event found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    email_sent = EmailService.send_event_details(guest, event)
    
    return Response({
        "success": email_sent,
        "message": f"Event details email {'sent' if email_sent else 'failed'} to {guest.email}",
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_bulk_event_details(request):
    """
    Send event details email to all confirmed guests.
    
    Request body:
    {
        "event_id": 1  // optional, uses current active event if not provided
    }
    """
    from apps.wedding_planner.models import Guest, WeddingEvent, AttendanceStatus
    
    event_id = request.data.get("event_id")
    
    # Get event
    if event_id:
        try:
            event = WeddingEvent.objects.get(pk=event_id)
        except WeddingEvent.DoesNotExist:
            return Response(
                {"error": "Event not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    else:
        event = WeddingEvent.objects.filter(is_active=True).first()
        if not event:
            return Response(
                {"error": "No active wedding event found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    confirmed_guests = Guest.objects.filter(attendance_status=AttendanceStatus.YES)
    
    results = {"sent": [], "failed": []}
    
    for guest in confirmed_guests:
        if EmailService.send_event_details(guest, event):
            results["sent"].append({
                "id": guest.id,
                "name": f"{guest.first_name} {guest.last_name}",
                "email": guest.email,
            })
        else:
            results["failed"].append({
                "id": guest.id,
                "name": f"{guest.first_name} {guest.last_name}",
                "email": guest.email,
            })
    
    return Response({
        "event": event.name,
        "total_confirmed": confirmed_guests.count(),
        "sent_count": len(results["sent"]),
        "failed_count": len(results["failed"]),
        "results": results,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_seating_assignment_email(request):
    """
    Send seating assignment email to a guest.
    
    Request body:
    {
        "guest_id": 1
    }
    """
    from apps.wedding_planner.models import Guest, SeatingAssignment, AttendanceStatus
    
    guest_id = request.data.get("guest_id")
    
    if guest_id is None:
        return Response(
            {"error": "guest_id is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        guest = Guest.objects.get(pk=guest_id)
    except Guest.DoesNotExist:
        return Response(
            {"error": "Guest not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if guest.attendance_status != AttendanceStatus.YES:
        return Response(
            {"error": "Can only send seating to confirmed guests"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        seating = guest.seating_assignment
    except SeatingAssignment.DoesNotExist:
        return Response(
            {"error": "Guest has no seating assignment"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    email_sent = EmailService.send_seating_assignment(guest, seating)
    
    return Response({
        "success": email_sent,
        "message": f"Seating assignment email {'sent' if email_sent else 'failed'} to {guest.email}",
        "table": str(seating.table),
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_bulk_seating_assignments(request):
    """
    Send seating assignment emails to all guests with assignments.
    """
    from apps.wedding_planner.models import SeatingAssignment
    
    assignments = SeatingAssignment.objects.select_related("guest", "table").all()
    
    results = {"sent": [], "failed": []}
    
    for assignment in assignments:
        guest = assignment.guest
        if EmailService.send_seating_assignment(guest, assignment):
            results["sent"].append({
                "id": guest.id,
                "name": f"{guest.first_name} {guest.last_name}",
                "email": guest.email,
                "table": str(assignment.table),
            })
        else:
            results["failed"].append({
                "id": guest.id,
                "name": f"{guest.first_name} {guest.last_name}",
                "email": guest.email,
            })
    
    return Response({
        "total_assignments": assignments.count(),
        "sent_count": len(results["sent"]),
        "failed_count": len(results["failed"]),
        "results": results,
    })


@api_view(["POST"])
@permission_classes([AllowAny])  # For testing
def test_email(request):
    """
    Test email configuration by sending a test email.
    
    Request body:
    {
        "to_email": "test@example.com"
    }
    """
    from django.core.mail import send_mail
    from django.conf import settings
    
    to_email = request.data.get("to_email")
    
    if not to_email:
        return Response(
            {"error": "to_email is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        send_mail(
            subject="Test Email from Wedding Planner",
            message="This is a test email to verify your email configuration is working correctly.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to_email],
            fail_silently=False,
        )
        return Response({
            "success": True,
            "message": f"Test email sent to {to_email}",
            "from_email": settings.DEFAULT_FROM_EMAIL,
            "email_host": settings.EMAIL_HOST,
        })
    except Exception as e:
        return Response({
            "success": False,
            "error": str(e),
            "email_host": settings.EMAIL_HOST,
            "email_port": settings.EMAIL_PORT,
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
