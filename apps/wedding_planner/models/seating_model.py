from django.db import models
from config.models import TimeStampedBaseModel
from .guest_model import Guest


class Table(TimeStampedBaseModel):
    """
    Represents a table at the wedding reception.
    """
    
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
    Assigns a guest to a specific table with optional seat number.
    """
    
    guest = models.OneToOneField(
        Guest,
        on_delete=models.CASCADE,
        related_name="seating_assignment"
    )
    table = models.ForeignKey(
        Table,
        on_delete=models.CASCADE,
        related_name="seating_assignments"
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
            )
        ]
    
    def __str__(self):
        seat_info = f" (Seat {self.seat_number})" if self.seat_number else ""
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
