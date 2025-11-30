"""
Todo List models for Wedding Planner.
Provides comprehensive task management for wedding planning timeline.
"""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from config.models import TimeStampedBaseModel


class TodoCategory(TimeStampedBaseModel):
    """
    Categories for organizing wedding todos.
    Examples: Venue, Catering, Photography, Attire, Decorations, etc.
    """
    class Meta:
        verbose_name = "Todo Category"
        verbose_name_plural = "Todo Categories"
        ordering = ["order", "name"]
        unique_together = ["wedding", "name"]

    wedding = models.ForeignKey(
        "wedding_planner.Wedding",
        on_delete=models.CASCADE,
        related_name="todo_categories",
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    color = models.CharField(
        max_length=7,
        default="#3B82F6",
        help_text="Hex color code for the category",
    )
    icon = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Icon identifier (e.g., 'camera', 'utensils', 'music')",
    )
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.wedding})"


class Todo(TimeStampedBaseModel):
    """
    Main Todo/Task model for wedding planning.
    Supports hierarchy (subtasks), assignments, budget tracking, and vendor linking.
    """
    class Status(models.TextChoices):
        NOT_STARTED = "not_started", "Not Started"
        IN_PROGRESS = "in_progress", "In Progress"
        WAITING = "waiting", "Waiting/Blocked"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"

    class Meta:
        verbose_name = "Todo"
        verbose_name_plural = "Todos"
        ordering = ["-priority_order", "due_date", "created_at"]

    # Core relationships
    wedding = models.ForeignKey(
        "wedding_planner.Wedding",
        on_delete=models.CASCADE,
        related_name="todos",
    )
    category = models.ForeignKey(
        TodoCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="todos",
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="subtasks",
        help_text="Parent task if this is a subtask",
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_todos",
        help_text="User responsible for this task",
    )

    # Task details
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Additional notes or details",
    )

    # Status and priority
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NOT_STARTED,
    )
    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )
    priority_order = models.PositiveIntegerField(
        default=50,
        help_text="Numeric priority for ordering (higher = more important)",
    )

    # Dates
    due_date = models.DateField(null=True, blank=True)
    due_time = models.TimeField(null=True, blank=True)
    reminder_date = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Budget tracking
    estimated_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )
    actual_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    # Vendor information (optional link)
    vendor_name = models.CharField(max_length=255, blank=True, null=True)
    vendor_contact = models.CharField(max_length=255, blank=True, null=True)
    vendor_email = models.EmailField(blank=True, null=True)
    vendor_phone = models.CharField(max_length=50, blank=True, null=True)
    vendor_notes = models.TextField(blank=True, null=True)

    # Location
    location = models.CharField(max_length=255, blank=True, null=True)
    location_url = models.URLField(blank=True, null=True)

    # Progress (for tasks with subtasks or checklists)
    progress_percent = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )

    # Flags
    is_milestone = models.BooleanField(
        default=False,
        help_text="Mark as a major milestone in wedding planning",
    )
    is_pinned = models.BooleanField(
        default=False,
        help_text="Pin to top of list",
    )

    # External reference
    external_url = models.URLField(
        blank=True,
        null=True,
        help_text="Link to external resource (Pinterest, vendor site, etc.)",
    )

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"

    def save(self, *args, **kwargs):
        """Update priority_order based on priority choice."""
        priority_map = {
            self.Priority.LOW: 25,
            self.Priority.MEDIUM: 50,
            self.Priority.HIGH: 75,
            self.Priority.URGENT: 100,
        }
        self.priority_order = priority_map.get(self.priority, 50)
        super().save(*args, **kwargs)


class TodoChecklist(TimeStampedBaseModel):
    """
    Checklist items within a Todo.
    For breaking down a task into smaller checkable items.
    """
    class Meta:
        verbose_name = "Todo Checklist Item"
        verbose_name_plural = "Todo Checklist Items"
        ordering = ["order", "created_at"]

    todo = models.ForeignKey(
        Todo,
        on_delete=models.CASCADE,
        related_name="checklist_items",
    )
    title = models.CharField(max_length=255)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    order = models.PositiveIntegerField(default=0)

    def __str__(self):
        status = "✓" if self.is_completed else "○"
        return f"{status} {self.title}"

    def save(self, *args, **kwargs):
        """Track completion time."""
        if self.is_completed and not self.completed_at:
            self.completed_at = timezone.now()
        elif not self.is_completed:
            self.completed_at = None
        super().save(*args, **kwargs)


class TodoTemplate(TimeStampedBaseModel):
    """
    Pre-defined todo templates for common wedding planning tasks.
    Can be wedding-specific or global templates.
    """
    class TimelinePosition(models.TextChoices):
        MONTHS_12_PLUS = "12_plus", "12+ Months Before"
        MONTHS_9_12 = "9_12", "9-12 Months Before"
        MONTHS_6_9 = "6_9", "6-9 Months Before"
        MONTHS_4_6 = "4_6", "4-6 Months Before"
        MONTHS_2_4 = "2_4", "2-4 Months Before"
        MONTHS_1_2 = "1_2", "1-2 Months Before"
        WEEKS_2_4 = "2_4_weeks", "2-4 Weeks Before"
        WEEK_1 = "1_week", "Final Week"
        DAY_OF = "day_of", "Wedding Day"
        POST_WEDDING = "post", "After Wedding"

    class Meta:
        verbose_name = "Todo Template"
        verbose_name_plural = "Todo Templates"
        ordering = ["timeline_position", "order"]

    # Optional wedding link (null = global template)
    wedding = models.ForeignKey(
        "wedding_planner.Wedding",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="todo_templates",
    )
    category_name = models.CharField(
        max_length=100,
        help_text="Category name to create/use when applying template",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    timeline_position = models.CharField(
        max_length=20,
        choices=TimelinePosition.choices,
        default=TimelinePosition.MONTHS_6_9,
    )
    days_before_wedding = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Exact days before wedding (overrides timeline_position for due date calc)",
    )
    priority = models.CharField(
        max_length=10,
        choices=Todo.Priority.choices,
        default=Todo.Priority.MEDIUM,
    )
    is_milestone = models.BooleanField(default=False)
    estimated_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    # Checklist items (stored as JSON for templates)
    checklist_items = models.JSONField(
        default=list,
        blank=True,
        help_text='List of checklist items: [{"title": "Item 1"}, {"title": "Item 2"}]',
    )

    def __str__(self):
        return f"[Template] {self.title}"


class TodoComment(TimeStampedBaseModel):
    """
    Comments/notes on todos for collaboration.
    """
    class Meta:
        verbose_name = "Todo Comment"
        verbose_name_plural = "Todo Comments"
        ordering = ["-created_at"]

    todo = models.ForeignKey(
        Todo,
        on_delete=models.CASCADE,
        related_name="comments",
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="todo_comments",
    )
    content = models.TextField()
    is_edited = models.BooleanField(default=False)

    def __str__(self):
        return f"Comment by {self.author} on {self.todo}"


class TodoAttachment(TimeStampedBaseModel):
    """
    File attachments for todos (contracts, inspiration images, etc.).
    """
    class AttachmentType(models.TextChoices):
        IMAGE = "image", "Image"
        DOCUMENT = "document", "Document"
        CONTRACT = "contract", "Contract"
        RECEIPT = "receipt", "Receipt"
        INSPIRATION = "inspiration", "Inspiration"
        OTHER = "other", "Other"

    class Meta:
        verbose_name = "Todo Attachment"
        verbose_name_plural = "Todo Attachments"
        ordering = ["-created_at"]

    todo = models.ForeignKey(
        Todo,
        on_delete=models.CASCADE,
        related_name="attachments",
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="todo_attachments",
    )
    file = models.FileField(upload_to="todo_attachments/%Y/%m/")
    filename = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField(
        help_text="File size in bytes",
    )
    file_type = models.CharField(max_length=100)
    attachment_type = models.CharField(
        max_length=20,
        choices=AttachmentType.choices,
        default=AttachmentType.OTHER,
    )
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.filename} ({self.attachment_type})"
