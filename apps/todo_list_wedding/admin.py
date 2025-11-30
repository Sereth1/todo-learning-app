"""
Admin configuration for todo_list_wedding app.
"""
from django.contrib import admin

from .models import (
    TodoCategory,
    Todo,
    TodoChecklist,
    TodoTemplate,
    TodoComment,
    TodoAttachment,
)


class TodoChecklistInline(admin.TabularInline):
    """Inline for checklist items in Todo admin."""
    model = TodoChecklist
    extra = 0
    fields = ["title", "is_completed", "order"]


class TodoCommentInline(admin.TabularInline):
    """Inline for comments in Todo admin."""
    model = TodoComment
    extra = 0
    fields = ["author", "content", "created_at"]
    readonly_fields = ["created_at"]


class TodoAttachmentInline(admin.TabularInline):
    """Inline for attachments in Todo admin."""
    model = TodoAttachment
    extra = 0
    fields = ["filename", "attachment_type", "file_size", "uploaded_by"]
    readonly_fields = ["filename", "file_size"]


@admin.register(TodoCategory)
class TodoCategoryAdmin(admin.ModelAdmin):
    """Admin for TodoCategory."""
    list_display = ["name", "wedding", "color", "order", "is_active", "created_at"]
    list_filter = ["wedding", "is_active"]
    search_fields = ["name", "description"]
    ordering = ["wedding", "order", "name"]


@admin.register(Todo)
class TodoAdmin(admin.ModelAdmin):
    """Admin for Todo."""
    list_display = [
        "title",
        "wedding",
        "category",
        "status",
        "priority",
        "due_date",
        "assigned_to",
        "is_milestone",
        "progress_percent",
    ]
    list_filter = [
        "wedding",
        "status",
        "priority",
        "category",
        "is_milestone",
        "is_pinned",
    ]
    search_fields = ["title", "description", "notes", "vendor_name"]
    ordering = ["-priority_order", "due_date", "created_at"]
    date_hierarchy = "due_date"
    
    readonly_fields = ["created_at", "updated_at", "started_at", "completed_at"]
    
    inlines = [TodoChecklistInline, TodoCommentInline, TodoAttachmentInline]
    
    fieldsets = (
        (None, {
            "fields": ("wedding", "category", "parent", "title", "description", "notes")
        }),
        ("Status & Priority", {
            "fields": ("status", "priority", "progress_percent", "is_milestone", "is_pinned")
        }),
        ("Dates", {
            "fields": ("due_date", "due_time", "reminder_date", "started_at", "completed_at")
        }),
        ("Assignment", {
            "fields": ("assigned_to",)
        }),
        ("Budget", {
            "fields": ("estimated_cost", "actual_cost"),
            "classes": ("collapse",)
        }),
        ("Vendor", {
            "fields": ("vendor_name", "vendor_contact", "vendor_email", "vendor_phone", "vendor_notes"),
            "classes": ("collapse",)
        }),
        ("Location", {
            "fields": ("location", "location_url", "external_url"),
            "classes": ("collapse",)
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )


@admin.register(TodoChecklist)
class TodoChecklistAdmin(admin.ModelAdmin):
    """Admin for TodoChecklist."""
    list_display = ["title", "todo", "is_completed", "order", "completed_at"]
    list_filter = ["is_completed", "todo__wedding"]
    search_fields = ["title", "todo__title"]
    ordering = ["todo", "order"]


@admin.register(TodoTemplate)
class TodoTemplateAdmin(admin.ModelAdmin):
    """Admin for TodoTemplate."""
    list_display = [
        "title",
        "wedding",
        "category_name",
        "timeline_position",
        "priority",
        "is_milestone",
        "is_active",
    ]
    list_filter = ["wedding", "timeline_position", "priority", "is_milestone", "is_active"]
    search_fields = ["title", "description", "category_name"]
    ordering = ["timeline_position", "order"]


@admin.register(TodoComment)
class TodoCommentAdmin(admin.ModelAdmin):
    """Admin for TodoComment."""
    list_display = ["todo", "author", "content_preview", "is_edited", "created_at"]
    list_filter = ["is_edited", "author"]
    search_fields = ["content", "todo__title"]
    ordering = ["-created_at"]
    
    def content_preview(self, obj):
        """Show truncated content."""
        return obj.content[:50] + "..." if len(obj.content) > 50 else obj.content
    content_preview.short_description = "Content"


@admin.register(TodoAttachment)
class TodoAttachmentAdmin(admin.ModelAdmin):
    """Admin for TodoAttachment."""
    list_display = ["filename", "todo", "attachment_type", "file_size", "uploaded_by", "created_at"]
    list_filter = ["attachment_type", "uploaded_by"]
    search_fields = ["filename", "description", "todo__title"]
    ordering = ["-created_at"]
