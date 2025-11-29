import uuid
from typing import Any

from django.db import models

from config.models import TimeStampedBaseModel


class AttendanceStatus(models.TextChoices):
    YES = "yes", "Yes"
    PENDING = "pending", "Pending"
    NO = "no", "No"


class Guest(TimeStampedBaseModel):
    
    # Link to specific wedding
    wedding = models.ForeignKey(
        "wedding_planner.Wedding",
        on_delete=models.CASCADE,
        related_name="guests",
        null=True,  # Temporarily nullable for migration
        blank=True
    )

    first_name: models.CharField = models.CharField(
        max_length=100, blank=False, verbose_name=("first name")
    )
    last_name: models.CharField = models.CharField(
        max_length=100, blank=False, verbose_name=("last name")
    )
    email: models.EmailField = models.EmailField(
        max_length=254, db_index=True, verbose_name=("email")
    )  # Removed unique=True - now unique per wedding
    is_plus_one_coming: models.BooleanField = models.BooleanField(
        default=False, verbose_name=("is plus one coming")
    )
    has_children: models.BooleanField = models.BooleanField(
        default=False, verbose_name=("has children")
    )
    attendance_status: models.CharField = models.CharField(
        max_length=10,
        choices=AttendanceStatus.choices,
        default=AttendanceStatus.PENDING,
        verbose_name=("attendance status"),
    )
    user_code: models.UUIDField = models.UUIDField(
        default=uuid.uuid4, editable=False, unique=True, verbose_name=("user code")
    )

    class Meta:
        verbose_name = "guest"
        verbose_name_plural = "guests"
        indexes = [models.Index(fields=["email"]), models.Index(fields=["last_name"])]
        # Unique email per wedding, not globally
        constraints = [
            models.UniqueConstraint(
                fields=["wedding", "email"],
                name="unique_email_per_wedding"
            )
        ]

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name} <{self.email}>"

    def save(self, *args: Any, **kwargs: Any) -> None:
        if self.email:
            self.email = self.email.strip().lower()
        super().save(*args, **kwargs)
