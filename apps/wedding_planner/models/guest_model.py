import uuid
from typing import Any

from django.db import models

from config.models import TimeStampedBaseModel


class AttendanceStatus(models.TextChoices):
    YES = "yes", "Yes"
    PENDING = "pending", "Pending"
    NO = "no", "No"


class GuestType(models.TextChoices):
    FAMILY = "family", "Family"
    FRIEND = "friend", "Friend"
    COWORKER = "coworker", "Coworker"
    NEIGHBOR = "neighbor", "Neighbor"
    OTHER = "other", "Other"


class FamilyRelationship(models.TextChoices):
    """Family relationship tiers"""
    # First degree - immediate family
    MOTHER = "mother", "Mother"
    FATHER = "father", "Father"
    SISTER = "sister", "Sister"
    BROTHER = "brother", "Brother"
    DAUGHTER = "daughter", "Daughter"
    SON = "son", "Son"
    GRANDMOTHER = "grandmother", "Grandmother"
    GRANDFATHER = "grandfather", "Grandfather"
    # Second degree - close extended family
    AUNT = "aunt", "Aunt"
    UNCLE = "uncle", "Uncle"
    COUSIN = "cousin", "Cousin"
    NIECE = "niece", "Niece"
    NEPHEW = "nephew", "Nephew"
    # Third degree - distant relatives
    GREAT_AUNT = "great_aunt", "Great Aunt"
    GREAT_UNCLE = "great_uncle", "Great Uncle"
    SECOND_COUSIN = "second_cousin", "Second Cousin"
    COUSIN_ONCE_REMOVED = "cousin_once_removed", "Cousin Once Removed"
    DISTANT_RELATIVE = "distant_relative", "Distant Relative"


class RelationshipTier(models.TextChoices):
    """Relationship closeness tier"""
    FIRST = "first", "1st Tier (Immediate Family)"
    SECOND = "second", "2nd Tier (Close Extended)"
    THIRD = "third", "3rd Tier (Distant Relatives)"


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
    
    # Guest categorization
    guest_type = models.CharField(
        max_length=20,
        choices=GuestType.choices,
        default=GuestType.FRIEND,
        verbose_name="Guest Type"
    )
    family_relationship = models.CharField(
        max_length=30,
        choices=FamilyRelationship.choices,
        blank=True,
        null=True,
        verbose_name="Family Relationship",
        help_text="Only applicable if guest type is Family"
    )
    relationship_tier = models.CharField(
        max_length=10,
        choices=RelationshipTier.choices,
        blank=True,
        null=True,
        verbose_name="Relationship Tier",
        help_text="Closeness tier for family members"
    )
    
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
