from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from typing import Optional, Dict, Any, List
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """
    Centralized email service for sending templated emails.
    Usage:
        EmailService.send_rsvp_confirmation(guest, confirmed=True)
        EmailService.send_rsvp_reminder(guest)
    """

    @staticmethod
    def send_email(
        subject: str,
        to_email: str | List[str],
        template_name: str,
        context: Dict[str, Any],
        from_email: Optional[str] = None,
    ) -> bool:
        """
        Send an email using HTML template with plain text fallback.
        
        Args:
            subject: Email subject line
            to_email: Recipient email(s)
            template_name: Template name without extension (e.g., 'rsvp_confirmation')
            context: Template context variables
            from_email: Sender email (defaults to settings.DEFAULT_FROM_EMAIL)
        
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        if isinstance(to_email, str):
            to_email = [to_email]

        from_email = from_email or settings.DEFAULT_FROM_EMAIL
        
        # Add common context
        context.update({
            "site_name": getattr(settings, "SITE_NAME", "Wedding Planner"),
            "site_domain": getattr(settings, "SITE_DOMAIN", "localhost:8000"),
            "frontend_url": getattr(settings, "FRONTEND_URL", "http://localhost:3000"),
        })

        try:
            # Render templates
            html_content = render_to_string(
                f"email_services/{template_name}.html", context
            )
            text_content = render_to_string(
                f"email_services/{template_name}.txt", context
            )

            # Create email
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=from_email,
                to=to_email,
            )
            email.attach_alternative(html_content, "text/html")
            email.send(fail_silently=False)
            
            logger.info(f"Email sent successfully to {to_email}: {subject}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False

    @classmethod
    def send_rsvp_confirmation(cls, guest, confirmed: bool) -> bool:
        """
        Send RSVP confirmation email to guest.
        
        Args:
            guest: Guest model instance
            confirmed: True if attending, False if declining
        """
        template = "rsvp_confirmed" if confirmed else "rsvp_declined"
        subject = (
            "🎉 We're excited to see you!" if confirmed 
            else "We'll miss you at our wedding"
        )
        
        context = {
            "guest": guest,
            "first_name": guest.first_name,
            "last_name": guest.last_name,
            "is_confirmed": confirmed,
            "is_plus_one_coming": guest.is_plus_one_coming,
            "has_children": guest.has_children,
        }
        
        return cls.send_email(
            subject=subject,
            to_email=guest.email,
            template_name=template,
            context=context,
        )

    @classmethod
    def send_rsvp_reminder(cls, guest, deadline_date: str) -> bool:
        """
        Send RSVP reminder email to guest.
        
        Args:
            guest: Guest model instance
            deadline_date: RSVP deadline as string
        """
        return cls.send_email(
            subject="📅 RSVP Reminder - Please respond!",
            to_email=guest.email,
            template_name="rsvp_reminder",
            context={
                "guest": guest,
                "first_name": guest.first_name,
                "deadline_date": deadline_date,
            },
        )

    @classmethod
    def send_event_details(cls, guest, event) -> bool:
        """
        Send event details email to confirmed guests.
        
        Args:
            guest: Guest model instance
            event: WeddingEvent model instance
        """
        return cls.send_email(
            subject="💒 Your Wedding Details",
            to_email=guest.email,
            template_name="event_details",
            context={
                "guest": guest,
                "first_name": guest.first_name,
                "event": event,
            },
        )

    @classmethod
    def send_seating_assignment(cls, guest, table_assignment) -> bool:
        """
        Send table/seating assignment to guest.
        
        Args:
            guest: Guest model instance
            table_assignment: TableAssignment model instance
        """
        return cls.send_email(
            subject="🪑 Your Seating Assignment",
            to_email=guest.email,
            template_name="seating_assignment",
            context={
                "guest": guest,
                "first_name": guest.first_name,
                "table": table_assignment,
            },
        )
