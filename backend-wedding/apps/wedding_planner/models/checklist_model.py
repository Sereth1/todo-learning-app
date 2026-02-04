from django.db import models
from django.conf import settings
from config.models import TimeStampedBaseModel
from datetime import timedelta


class ChecklistTemplate(TimeStampedBaseModel):
    """Pre-built checklist templates"""
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_default = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = "Checklist Template"
        verbose_name_plural = "Checklist Templates"
    
    def __str__(self):
        return self.name


class ChecklistTemplateItem(TimeStampedBaseModel):
    """Items in a checklist template with relative timing"""
    
    template = models.ForeignKey(
        ChecklistTemplate,
        on_delete=models.CASCADE,
        related_name="items"
    )
    
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100, blank=True)
    
    # Relative timing (days before wedding)
    days_before_wedding = models.IntegerField(
        help_text="Days before wedding (negative = after)"
    )
    
    order = models.PositiveIntegerField(default=0)
    is_essential = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = "Checklist Template Item"
        verbose_name_plural = "Checklist Template Items"
        ordering = ["-days_before_wedding", "order"]
    
    def __str__(self):
        return f"{self.title} ({self.days_before_wedding} days before)"


class Checklist(TimeStampedBaseModel):
    """User's wedding checklist"""
    
    # Link to wedding instead of user + event
    wedding = models.OneToOneField(
        "wedding_planner.Wedding",
        on_delete=models.CASCADE,
        related_name="checklist",
        null=True,  # Temporarily nullable for migration
        blank=True
    )
    
    # Keep for backwards compatibility during migration
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="checklists",
        null=True,
        blank=True
    )
    event = models.OneToOneField(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="old_checklist",
        null=True,
        blank=True
    )
    
    name = models.CharField(max_length=200, default="My Wedding Checklist")
    
    class Meta:
        verbose_name = "Checklist"
        verbose_name_plural = "Checklists"
    
    def __str__(self):
        return f"Checklist for {self.event.name}"
    
    @property
    def total_tasks(self):
        return self.tasks.count()
    
    @property
    def completed_tasks(self):
        return self.tasks.filter(is_completed=True).count()
    
    @property
    def progress_percentage(self):
        total = self.total_tasks
        if total > 0:
            return round((self.completed_tasks / total) * 100, 1)
        return 0
    
    def generate_from_template(self, template):
        """Generate tasks from a template based on wedding date"""
        wedding_date = self.event.event_date
        
        for item in template.items.all():
            due_date = wedding_date - timedelta(days=item.days_before_wedding)
            
            ChecklistTask.objects.create(
                checklist=self,
                title=item.title,
                description=item.description,
                category=item.category,
                due_date=due_date,
                is_essential=item.is_essential,
                order=item.order
            )


class ChecklistTask(TimeStampedBaseModel):
    """Individual tasks in a checklist"""
    
    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"
    
    checklist = models.ForeignKey(
        Checklist,
        on_delete=models.CASCADE,
        related_name="tasks"
    )
    
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100, blank=True)
    
    due_date = models.DateField(null=True, blank=True)
    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.MEDIUM
    )
    
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    completed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="completed_tasks"
    )
    
    # Assignment
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tasks"
    )
    
    # Linked entities
    vendor = models.ForeignKey(
        "wedding_planner.Vendor",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    budget_item = models.ForeignKey(
        "wedding_planner.BudgetItem",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    order = models.PositiveIntegerField(default=0)
    is_essential = models.BooleanField(default=False)
    
    notes = models.TextField(blank=True)
    
    # Reminders
    reminder_date = models.DateField(null=True, blank=True)
    reminder_sent = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = "Checklist Task"
        verbose_name_plural = "Checklist Tasks"
        ordering = ["due_date", "order"]
    
    def __str__(self):
        status = "✓" if self.is_completed else "○"
        return f"{status} {self.title}"
    
    @property
    def is_overdue(self):
        from django.utils import timezone
        if self.due_date and not self.is_completed:
            return self.due_date < timezone.now().date()
        return False
