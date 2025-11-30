from django.db import models
from config.models import TimeStampedBaseModel
from .guest_model import Guest


class Table(TimeStampedBaseModel):
    """
    Represents a table at the wedding reception.
    """
    
    # Table category choices for organizing guests
    class TableCategory(models.TextChoices):
        NONE = "", "No specific category"
        FAMILY = "family", "Family"
        FAMILY_TIER_FIRST = "family_tier_first", "Family - 1st Tier (Immediate)"
        FAMILY_TIER_SECOND = "family_tier_second", "Family - 2nd Tier (Close Extended)"
        FAMILY_TIER_THIRD = "family_tier_third", "Family - 3rd Tier (Distant)"
        FRIEND = "friend", "Friends"
        COWORKER = "coworker", "Coworkers"
        NEIGHBOR = "neighbor", "Neighbors"
        VIP = "vip", "VIP"
        KIDS = "kids", "Kids Table"
    
    # Link to specific wedding
    wedding = models.ForeignKey(
        "wedding_planner.Wedding",
        on_delete=models.CASCADE,
        related_name="tables",
        null=True,  # Temporarily nullable for migration
        blank=True
    )
    
    table_number = models.PositiveIntegerField(
        verbose_name="Table Number"
    )  # Removed unique=True - now unique per wedding
    name = models.CharField(
        max_length=100,
        blank=True,
        help_text="Optional table name (e.g., 'Rose Table', 'Family Table')"
    )
    capacity = models.PositiveIntegerField(
        default=10,
        verbose_name="Seating Capacity"
    )
    
    # Guest category for this table (for auto-assign)
    table_category = models.CharField(
        max_length=30,
        choices=TableCategory.choices,
        default=TableCategory.NONE,
        blank=True,
        verbose_name="Guest Category",
        help_text="Category of guests for this table (used for auto-assign)"
    )
    
    location = models.CharField(
        max_length=200,
        blank=True,
        help_text="Location description (e.g., 'Near dance floor', 'By the garden')"
    )
    notes = models.TextField(
        blank=True,
        help_text="Special notes about this table"
    )
    is_vip = models.BooleanField(
        default=False,
        verbose_name="VIP/Family Table"
    )
    
    class Meta:
        verbose_name = "Table"
        verbose_name_plural = "Tables"
        ordering = ["table_number"]
        # Unique table number per wedding
        constraints = [
            models.UniqueConstraint(
                fields=["wedding", "table_number"],
                name="unique_table_per_wedding"
            )
        ]
    
    def __str__(self):
        if self.name:
            return f"Table {self.table_number} ({self.name})"
        return f"Table {self.table_number}"
    
    @property
    def seats_taken(self):
        """Count of guests assigned to this table."""
        return self.seating_assignments.count()
    
    @property
    def seats_available(self):
        """Number of available seats at this table."""
        return self.capacity - self.seats_taken
    
    @property
    def is_full(self):
        """Check if table is at capacity."""
        return self.seats_taken >= self.capacity


class SeatingAssignment(TimeStampedBaseModel):
    """
    Assigns a guest (or their plus one/children) to a specific table.
    Multiple assignments can exist for one guest (guest + plus one + children).
    """
    
    guest = models.ForeignKey(
        Guest,
        on_delete=models.CASCADE,
        related_name="seating_assignments"
    )
    table = models.ForeignKey(
        Table,
        on_delete=models.CASCADE,
        related_name="seating_assignments"
    )
    
    # Type of attendee being seated
    class AttendeeType(models.TextChoices):
        GUEST = "guest", "Guest"
        PLUS_ONE = "plus_one", "Plus One"
        CHILD = "child", "Child"
    
    attendee_type = models.CharField(
        max_length=20,
        choices=AttendeeType.choices,
        default=AttendeeType.GUEST,
        verbose_name="Attendee Type"
    )
    
    # For children assignments
    child = models.ForeignKey(
        "wedding_planner.Child",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="seating_assignment",
        help_text="Link to child if this is a child assignment"
    )
    
    seat_number = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Optional specific seat number at the table"
    )
    notes = models.TextField(
        blank=True,
        help_text="Notes about seating (e.g., 'Needs accessible seating')"
    )
    
    class Meta:
        verbose_name = "Seating Assignment"
        verbose_name_plural = "Seating Assignments"
        ordering = ["table__table_number", "seat_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["table", "seat_number"],
                name="unique_seat_at_table",
                condition=models.Q(seat_number__isnull=False)
            ),
            # Ensure each guest can only be assigned once
            models.UniqueConstraint(
                fields=["guest", "attendee_type"],
                name="unique_guest_attendee_type"
            ),
            # Ensure each child can only be assigned once
            models.UniqueConstraint(
                fields=["child"],
                name="unique_child_assignment",
                condition=models.Q(child__isnull=False)
            )
        ]
    
    def __str__(self):
        seat_info = f" (Seat {self.seat_number})" if self.seat_number else ""
        if self.attendee_type == self.AttendeeType.CHILD and self.child:
            return f"{self.child.first_name} (child) → {self.table}{seat_info}"
        elif self.attendee_type == self.AttendeeType.PLUS_ONE:
            plus_one_name = self.guest.plus_one_name or "Plus One"
            return f"{plus_one_name} (+1 of {self.guest.first_name}) → {self.table}{seat_info}"
        return f"{self.guest} → {self.table}{seat_info}"
    
    def clean(self):
        """Validate seating assignment."""
        from django.core.exceptions import ValidationError
        
        if self.table.is_full and not self.pk:
            raise ValidationError(f"Table {self.table} is already at capacity.")
        
        if self.seat_number and self.seat_number > self.table.capacity:
            raise ValidationError(
                f"Seat number {self.seat_number} exceeds table capacity of {self.table.capacity}."
            )
