from django.db import models
from django.conf import settings
from config.models import TimeStampedBaseModel


class DocumentFolder(TimeStampedBaseModel):
    """Folders to organize wedding documents"""
    
    event = models.ForeignKey(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="document_folders"
    )
    
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="subfolders"
    )
    
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        verbose_name = "Document Folder"
        verbose_name_plural = "Document Folders"
        ordering = ["order", "name"]
    
    def __str__(self):
        return self.name


class Document(TimeStampedBaseModel):
    """Wedding documents and files"""
    
    class DocumentType(models.TextChoices):
        CONTRACT = "contract", "Contract"
        INVOICE = "invoice", "Invoice"
        RECEIPT = "receipt", "Receipt"
        INSURANCE = "insurance", "Insurance"
        PERMIT = "permit", "Permit"
        FLOOR_PLAN = "floor_plan", "Floor Plan"
        MENU = "menu", "Menu"
        TIMELINE = "timeline", "Timeline"
        GUEST_LIST = "guest_list", "Guest List"
        PHOTO = "photo", "Photo"
        INSPIRATION = "inspiration", "Inspiration"
        OTHER = "other", "Other"
    
    event = models.ForeignKey(
        "wedding_planner.WeddingEvent",
        on_delete=models.CASCADE,
        related_name="documents"
    )
    
    folder = models.ForeignKey(
        DocumentFolder,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documents"
    )
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    document_type = models.CharField(
        max_length=20,
        choices=DocumentType.choices,
        default=DocumentType.OTHER
    )
    
    file = models.FileField(upload_to="wedding_documents/")
    file_size = models.PositiveIntegerField(default=0)
    mime_type = models.CharField(max_length=100, blank=True)
    
    # Related entities
    vendor = models.ForeignKey(
        "wedding_planner.Vendor",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documents"
    )
    
    # Metadata
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    
    # For contracts
    is_signed = models.BooleanField(default=False)
    signed_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    
    tags = models.CharField(max_length=500, blank=True)
    
    class Meta:
        verbose_name = "Document"
        verbose_name_plural = "Documents"
        ordering = ["-created_at"]
    
    def __str__(self):
        return self.name


class DocumentVersion(TimeStampedBaseModel):
    """Version history for documents"""
    
    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name="versions"
    )
    
    file = models.FileField(upload_to="wedding_documents/versions/")
    version_number = models.PositiveIntegerField()
    
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    
    notes = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "Document Version"
        verbose_name_plural = "Document Versions"
        ordering = ["-version_number"]
        unique_together = ["document", "version_number"]
    
    def __str__(self):
        return f"{self.document.name} v{self.version_number}"
