from django.urls import path
from . import views

urlpatterns = [
    path("send/rsvp-confirmation/", views.send_rsvp_confirmation_email, name="send-rsvp-confirmation"),
    path("send/reminder/", views.send_reminder_email, name="send-reminder"),
    path("send/bulk-reminders/", views.send_bulk_reminders, name="send-bulk-reminders"),
    path("send/event-details/", views.send_event_details_email, name="send-event-details"),
    path("send/event-details/bulk/", views.send_bulk_event_details, name="send-bulk-event-details"),
    path("send/seating/", views.send_seating_assignment_email, name="send-seating-assignment"),
    path("send/seating/bulk/", views.send_bulk_seating_assignments, name="send-bulk-seating-assignments"),
    path("send/test/", views.test_email, name="test-email"),
]
from django.urls import path
from . import views

app_name = "email_services"

urlpatterns = [
    # RSVP Emails
    path(
        "send-rsvp-confirmation/",
        views.send_rsvp_confirmation_email,
        name="send-rsvp-confirmation",
    ),
    path(
        "send-reminder/",
        views.send_reminder_email,
        name="send-reminder",
    ),
    path(
        "send-bulk-reminders/",
        views.send_bulk_reminders,
        name="send-bulk-reminders",
    ),
    
    # Event Details Emails
    path(
        "send-event-details/",
        views.send_event_details_email,
        name="send-event-details",
    ),
    path(
        "send-bulk-event-details/",
        views.send_bulk_event_details,
        name="send-bulk-event-details",
    ),
    
    # Seating Assignment Emails
    path(
        "send-seating-assignment/",
        views.send_seating_assignment_email,
        name="send-seating-assignment",
    ),
    path(
        "send-bulk-seating-assignments/",
        views.send_bulk_seating_assignments,
        name="send-bulk-seating-assignments",
    ),
    
    # Testing
    path(
        "test/",
        views.test_email,
        name="test-email",
    ),
]
