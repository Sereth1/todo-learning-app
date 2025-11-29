from django.db import models
from django.conf import settings
from config.models import TimeStampedBaseModel


class ExportJob(TimeStampedBaseModel):
    """Track export jobs"""
    
    class ExportType(models.TextChoices):
        GUEST_LIST = "guest_list", "Guest List"
        SEATING_CHART = "seating_chart", "Seating Chart"
        BUDGET = "budget", "Budget Report"
        CHECKLIST = "checklist", "Checklist"
        TIMELINE = "timeline", "Timeline"
        VENDOR_LIST = "vendor_list", "Vendor List"
        FULL_REPORT = "full_report", "Full Wedding Report"
        RSVP_SUMMARY = "rsvp_summary", "RSVP Summary"
        MEAL_COUNTS = "meal_counts", "Meal Counts"
    
    class ExportFormat(models.TextChoices):
        PDF = "pdf", "PDF"
        EXCEL = "excel", "Excel"
        CSV = "csv", "CSV"
        JSON = "json", "JSON"
    
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="export_jobs"
    )
    
    event = models.ForeignKey(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="exports"
    )
    
    export_type = models.CharField(
        max_length=20,
        choices=ExportType.choices
    )
    
    export_format = models.CharField(
        max_length=10,
        choices=ExportFormat.choices,
        default=ExportFormat.PDF
    )
    
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    
    # Options
    options = models.JSONField(default=dict, blank=True)
    
    # Result
    file = models.FileField(upload_to="exports/", blank=True)
    file_name = models.CharField(max_length=300, blank=True)
    
    error_message = models.TextField(blank=True)
    
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Auto-delete after (days)
    expires_in_days = models.PositiveIntegerField(default=7)
    
    class Meta:
        verbose_name = "Export Job"
        verbose_name_plural = "Export Jobs"
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"{self.get_export_type_display()} - {self.get_status_display()}"


class ReportTemplate(TimeStampedBaseModel):
    """Custom report templates"""
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Template configuration
    template_config = models.JSONField(default=dict)
    
    # Which sections to include
    include_guests = models.BooleanField(default=True)
    include_rsvp_summary = models.BooleanField(default=True)
    include_meal_counts = models.BooleanField(default=True)
    include_seating = models.BooleanField(default=True)
    include_budget = models.BooleanField(default=True)
    include_timeline = models.BooleanField(default=True)
    include_vendors = models.BooleanField(default=True)
    include_checklist = models.BooleanField(default=True)
    
    # Branding
    logo = models.ImageField(upload_to="report_logos/", blank=True)
    header_text = models.CharField(max_length=300, blank=True)
    footer_text = models.CharField(max_length=300, blank=True)
    
    is_default = models.BooleanField(default=False)
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    
    class Meta:
        verbose_name = "Report Template"
        verbose_name_plural = "Report Templates"
    
    def __str__(self):
        return self.name
