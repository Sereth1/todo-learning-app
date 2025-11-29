from django.db import models
from django.conf import settings
from config.models import TimeStampedBaseModel


class WeddingTeam(TimeStampedBaseModel):
    """Multi-user collaboration team for a wedding"""
    
    # Link to wedding instead of event
    wedding = models.OneToOneField(
        "wedding_planner.Wedding",
        on_delete=models.CASCADE,
        related_name="team",
        null=True,  # Temporarily nullable for migration
        blank=True
    )
    
    # Keep for backwards compatibility during migration
    event = models.OneToOneField(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="old_team",
        null=True,
        blank=True
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_teams"
    )
    
    class Meta:
        verbose_name = "Wedding Team"
        verbose_name_plural = "Wedding Teams"
    
    def __str__(self):
        if self.wedding:
            return f"Team for {self.wedding}"
        return f"Team {self.id}"


class TeamMember(TimeStampedBaseModel):
    """Team member with role-based permissions"""
    
    class Role(models.TextChoices):
        OWNER = "owner", "Owner"
        PARTNER = "partner", "Partner (Full Access)"
        PLANNER = "planner", "Wedding Planner"
        EDITOR = "editor", "Editor"
        VIEWER = "viewer", "Viewer"
    
    team = models.ForeignKey(
        WeddingTeam,
        on_delete=models.CASCADE,
        related_name="members"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="team_memberships"
    )
    
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.VIEWER
    )
    
    # Granular permissions
    can_edit_guests = models.BooleanField(default=False)
    can_edit_budget = models.BooleanField(default=False)
    can_edit_vendors = models.BooleanField(default=False)
    can_edit_seating = models.BooleanField(default=False)
    can_send_emails = models.BooleanField(default=False)
    can_manage_team = models.BooleanField(default=False)
    
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="sent_invitations"
    )
    invited_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = "Team Member"
        verbose_name_plural = "Team Members"
        unique_together = ["team", "user"]
    
    def __str__(self):
        return f"{self.user} - {self.get_role_display()}"
    
    def save(self, *args, **kwargs):
        # Set permissions based on role
        if self.role == self.Role.OWNER or self.role == self.Role.PARTNER:
            self.can_edit_guests = True
            self.can_edit_budget = True
            self.can_edit_vendors = True
            self.can_edit_seating = True
            self.can_send_emails = True
            self.can_manage_team = self.role == self.Role.OWNER
        elif self.role == self.Role.PLANNER:
            self.can_edit_guests = True
            self.can_edit_budget = True
            self.can_edit_vendors = True
            self.can_edit_seating = True
            self.can_send_emails = True
        elif self.role == self.Role.EDITOR:
            self.can_edit_guests = True
            self.can_edit_seating = True
        super().save(*args, **kwargs)


class TeamInvitation(TimeStampedBaseModel):
    """Pending invitations to join a team"""
    
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACCEPTED = "accepted", "Accepted"
        DECLINED = "declined", "Declined"
        EXPIRED = "expired", "Expired"
    
    team = models.ForeignKey(
        WeddingTeam,
        on_delete=models.CASCADE,
        related_name="invitations"
    )
    email = models.EmailField()
    role = models.CharField(
        max_length=20,
        choices=TeamMember.Role.choices,
        default=TeamMember.Role.VIEWER
    )
    
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    
    token = models.CharField(max_length=100, unique=True)
    expires_at = models.DateTimeField()
    
    message = models.TextField(blank=True, help_text="Personal message to include in invitation")
    
    class Meta:
        verbose_name = "Team Invitation"
        verbose_name_plural = "Team Invitations"
    
    def __str__(self):
        return f"Invitation to {self.email} for {self.team}"


class ActivityLog(TimeStampedBaseModel):
    """Audit log of team activities"""
    
    class ActionType(models.TextChoices):
        CREATE = "create", "Created"
        UPDATE = "update", "Updated"
        DELETE = "delete", "Deleted"
        INVITE = "invite", "Invited"
        JOIN = "join", "Joined"
        LEAVE = "leave", "Left"
        EMAIL_SENT = "email_sent", "Email Sent"
        RSVP_RECEIVED = "rsvp_received", "RSVP Received"
    
    team = models.ForeignKey(
        WeddingTeam,
        on_delete=models.CASCADE,
        related_name="activity_logs"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    
    action = models.CharField(max_length=20, choices=ActionType.choices)
    entity_type = models.CharField(max_length=50, help_text="Model name affected")
    entity_id = models.PositiveIntegerField(null=True, blank=True)
    description = models.TextField()
    
    # Store old/new values for auditing
    old_values = models.JSONField(null=True, blank=True)
    new_values = models.JSONField(null=True, blank=True)
    
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Activity Log"
        verbose_name_plural = "Activity Logs"
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"{self.user} {self.action} {self.entity_type}"
