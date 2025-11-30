"""
Todo serializers with comprehensive business logic.
All validation, status transitions, and progress calculations are handled here.
"""
from rest_framework import serializers
from django.utils import timezone
from django.db import models

from apps.todo_list_wedding.models import Todo, TodoCategory, TodoChecklist
from .category_serializer import TodoCategorySummarySerializer


class TodoChecklistInlineSerializer(serializers.ModelSerializer):
    """Inline serializer for checklist items within Todo."""
    
    class Meta:
        model = TodoChecklist
        fields = ["id", "uid", "title", "is_completed", "completed_at", "order"]
        read_only_fields = ["id", "uid", "completed_at"]


class TodoListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for todo lists.
    Includes essential fields and computed stats.
    """
    category_name = serializers.CharField(source="category.name", read_only=True, allow_null=True)
    category_color = serializers.CharField(source="category.color", read_only=True, allow_null=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    priority_display = serializers.CharField(source="get_priority_display", read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    days_until_due = serializers.SerializerMethodField()
    subtask_count = serializers.SerializerMethodField()
    checklist_progress = serializers.SerializerMethodField()
    
    class Meta:
        model = Todo
        fields = [
            "id",
            "uid",
            "title",
            "status",
            "status_display",
            "priority",
            "priority_display",
            "due_date",
            "due_time",
            "category",
            "category_name",
            "category_color",
            "assigned_to",
            "assigned_to_name",
            "is_milestone",
            "is_pinned",
            "progress_percent",
            "is_overdue",
            "days_until_due",
            "subtask_count",
            "checklist_progress",
            "estimated_cost",
            "created_at",
        ]
        read_only_fields = ["id", "uid", "created_at"]

    def get_assigned_to_name(self, obj) -> str | None:
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip() or obj.assigned_to.email
        return None

    def get_is_overdue(self, obj) -> bool:
        """Check if todo is overdue."""
        if not obj.due_date:
            return False
        if obj.status in [Todo.Status.COMPLETED, Todo.Status.CANCELLED]:
            return False
        return obj.due_date < timezone.now().date()

    def get_days_until_due(self, obj) -> int | None:
        """Calculate days until due date (negative if overdue)."""
        if not obj.due_date:
            return None
        today = timezone.now().date()
        delta = obj.due_date - today
        return delta.days

    def get_subtask_count(self, obj) -> dict:
        """Count subtasks by status."""
        subtasks = obj.subtasks.all()
        total = subtasks.count()
        completed = subtasks.filter(status=Todo.Status.COMPLETED).count()
        return {"total": total, "completed": completed}

    def get_checklist_progress(self, obj) -> dict:
        """Calculate checklist completion progress."""
        items = obj.checklist_items.all()
        total = items.count()
        completed = items.filter(is_completed=True).count()
        percent = round((completed / total) * 100) if total > 0 else 0
        return {"total": total, "completed": completed, "percent": percent}


class TodoDetailSerializer(TodoListSerializer):
    """
    Full detail serializer for single todo view.
    Includes all fields, nested data, and computed values.
    """
    category = TodoCategorySummarySerializer(read_only=True)
    checklist_items = TodoChecklistInlineSerializer(many=True, read_only=True)
    parent_title = serializers.CharField(source="parent.title", read_only=True, allow_null=True)
    subtasks = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    attachment_count = serializers.SerializerMethodField()
    
    class Meta(TodoListSerializer.Meta):
        fields = TodoListSerializer.Meta.fields + [
            "description",
            "notes",
            "parent",
            "parent_title",
            "reminder_date",
            "started_at",
            "completed_at",
            "actual_cost",
            "vendor_name",
            "vendor_contact",
            "vendor_email",
            "vendor_phone",
            "vendor_notes",
            "location",
            "location_url",
            "external_url",
            "checklist_items",
            "subtasks",
            "comment_count",
            "attachment_count",
            "updated_at",
        ]

    def get_subtasks(self, obj):
        """Get subtasks using list serializer."""
        subtasks = obj.subtasks.all()
        return TodoListSerializer(subtasks, many=True).data

    def get_comment_count(self, obj) -> int:
        return obj.comments.count()

    def get_attachment_count(self, obj) -> int:
        return obj.attachments.count()


class TodoCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating todos with full validation logic.
    Handles nested checklist creation and status transitions.
    """
    checklist_items = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        write_only=True,
        help_text='List of checklist items: [{"title": "Item 1"}, {"title": "Item 2"}]',
    )
    
    class Meta:
        model = Todo
        fields = [
            "wedding",
            "category",
            "parent",
            "assigned_to",
            "title",
            "description",
            "notes",
            "status",
            "priority",
            "due_date",
            "due_time",
            "reminder_date",
            "estimated_cost",
            "actual_cost",
            "vendor_name",
            "vendor_contact",
            "vendor_email",
            "vendor_phone",
            "vendor_notes",
            "location",
            "location_url",
            "is_milestone",
            "is_pinned",
            "external_url",
            "checklist_items",
        ]

    def validate_title(self, value):
        """Ensure title is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("Title cannot be empty.")
        return value.strip()

    def validate_parent(self, value):
        """Validate parent todo belongs to same wedding."""
        if value:
            wedding = self.initial_data.get("wedding")
            if wedding and value.wedding_id != wedding:
                raise serializers.ValidationError(
                    "Parent todo must belong to the same wedding."
                )
            # Prevent deep nesting (max 2 levels)
            if value.parent:
                raise serializers.ValidationError(
                    "Cannot create subtasks of subtasks. Maximum depth is 2 levels."
                )
        return value

    def validate_category(self, value):
        """Validate category belongs to same wedding."""
        if value:
            wedding = self.initial_data.get("wedding")
            if wedding and value.wedding_id != wedding:
                raise serializers.ValidationError(
                    "Category must belong to the same wedding."
                )
        return value

    def validate_due_date(self, value):
        """Warn if due date is in the past."""
        if value and value < timezone.now().date():
            # Allow past dates but could add a warning in response
            pass
        return value

    def validate_estimated_cost(self, value):
        """Ensure positive cost."""
        if value is not None and value < 0:
            raise serializers.ValidationError("Estimated cost cannot be negative.")
        return value

    def validate_actual_cost(self, value):
        """Ensure positive cost."""
        if value is not None and value < 0:
            raise serializers.ValidationError("Actual cost cannot be negative.")
        return value

    def validate(self, attrs):
        """Cross-field validation."""
        # If status is being set to completed, set completed_at
        if attrs.get("status") == Todo.Status.COMPLETED:
            attrs["completed_at"] = timezone.now()
        
        # If status is in_progress and started_at not set, set it
        if attrs.get("status") == Todo.Status.IN_PROGRESS:
            if "started_at" not in attrs or attrs.get("started_at") is None:
                attrs["started_at"] = timezone.now()
        
        return attrs

    def create(self, validated_data):
        """Create todo with nested checklist items."""
        checklist_items_data = validated_data.pop("checklist_items", [])
        
        todo = Todo.objects.create(**validated_data)
        
        # Create checklist items
        for idx, item_data in enumerate(checklist_items_data):
            TodoChecklist.objects.create(
                todo=todo,
                title=item_data.get("title", ""),
                order=item_data.get("order", idx),
            )
        
        return todo


class TodoSerializer(TodoCreateSerializer):
    """
    Full serializer for updating todos with status transition logic.
    """
    class Meta(TodoCreateSerializer.Meta):
        fields = TodoCreateSerializer.Meta.fields + [
            "id",
            "uid",
            "started_at",
            "completed_at",
            "progress_percent",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "uid", "created_at", "updated_at"]

    def validate_status(self, value):
        """Validate status transitions."""
        if not self.instance:
            return value
        
        current_status = self.instance.status
        
        # Define valid transitions
        valid_transitions = {
            Todo.Status.NOT_STARTED: [
                Todo.Status.IN_PROGRESS,
                Todo.Status.WAITING,
                Todo.Status.CANCELLED,
            ],
            Todo.Status.IN_PROGRESS: [
                Todo.Status.WAITING,
                Todo.Status.COMPLETED,
                Todo.Status.CANCELLED,
                Todo.Status.NOT_STARTED,  # Allow going back
            ],
            Todo.Status.WAITING: [
                Todo.Status.IN_PROGRESS,
                Todo.Status.COMPLETED,
                Todo.Status.CANCELLED,
                Todo.Status.NOT_STARTED,
            ],
            Todo.Status.COMPLETED: [
                Todo.Status.IN_PROGRESS,  # Reopen
                Todo.Status.NOT_STARTED,
            ],
            Todo.Status.CANCELLED: [
                Todo.Status.NOT_STARTED,  # Restore
            ],
        }
        
        if value != current_status and value not in valid_transitions.get(current_status, []):
            raise serializers.ValidationError(
                f"Cannot transition from '{current_status}' to '{value}'."
            )
        
        return value

    def update(self, instance, validated_data):
        """Update todo with status transition side effects."""
        checklist_items_data = validated_data.pop("checklist_items", None)
        
        old_status = instance.status
        new_status = validated_data.get("status", old_status)
        
        # Handle status transition side effects
        if new_status != old_status:
            if new_status == Todo.Status.COMPLETED:
                validated_data["completed_at"] = timezone.now()
                validated_data["progress_percent"] = 100
            elif new_status == Todo.Status.IN_PROGRESS:
                if not instance.started_at:
                    validated_data["started_at"] = timezone.now()
            elif new_status == Todo.Status.NOT_STARTED:
                # Reset progress if going back to not started
                validated_data["progress_percent"] = 0
                validated_data["completed_at"] = None
        
        # Update the instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update checklist items if provided
        if checklist_items_data is not None:
            # Delete existing and recreate (simple approach)
            instance.checklist_items.all().delete()
            for idx, item_data in enumerate(checklist_items_data):
                TodoChecklist.objects.create(
                    todo=instance,
                    title=item_data.get("title", ""),
                    is_completed=item_data.get("is_completed", False),
                    order=item_data.get("order", idx),
                )
        
        # Recalculate progress based on checklist
        self._update_progress(instance)
        
        return instance

    def _update_progress(self, todo):
        """Recalculate progress based on subtasks and checklist."""
        total_items = 0
        completed_items = 0
        
        # Count subtasks
        subtasks = todo.subtasks.exclude(status=Todo.Status.CANCELLED)
        total_items += subtasks.count()
        completed_items += subtasks.filter(status=Todo.Status.COMPLETED).count()
        
        # Count checklist items
        checklist = todo.checklist_items.all()
        total_items += checklist.count()
        completed_items += checklist.filter(is_completed=True).count()
        
        if total_items > 0:
            progress = round((completed_items / total_items) * 100)
            if progress != todo.progress_percent:
                todo.progress_percent = progress
                todo.save(update_fields=["progress_percent"])


class TodoBulkUpdateSerializer(serializers.Serializer):
    """
    Serializer for bulk operations on todos.
    """
    todo_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        help_text="List of todo IDs to update",
    )
    action = serializers.ChoiceField(
        choices=[
            ("complete", "Mark as Completed"),
            ("cancel", "Cancel"),
            ("restart", "Restart (Not Started)"),
            ("set_priority", "Set Priority"),
            ("set_category", "Set Category"),
            ("assign", "Assign to User"),
            ("delete", "Delete"),
        ],
    )
    priority = serializers.ChoiceField(
        choices=Todo.Priority.choices,
        required=False,
    )
    category_id = serializers.IntegerField(required=False)
    assigned_to_id = serializers.IntegerField(required=False, allow_null=True)

    def validate(self, attrs):
        """Validate bulk action parameters."""
        action = attrs.get("action")
        
        if action == "set_priority" and "priority" not in attrs:
            raise serializers.ValidationError(
                {"priority": "Priority is required for set_priority action."}
            )
        
        if action == "set_category" and "category_id" not in attrs:
            raise serializers.ValidationError(
                {"category_id": "Category ID is required for set_category action."}
            )
        
        return attrs

    def save(self, wedding):
        """Execute bulk action."""
        action = self.validated_data["action"]
        todo_ids = self.validated_data["todo_ids"]
        
        todos = Todo.objects.filter(
            id__in=todo_ids,
            wedding=wedding,
        )
        
        if action == "complete":
            todos.update(
                status=Todo.Status.COMPLETED,
                completed_at=timezone.now(),
                progress_percent=100,
            )
        elif action == "cancel":
            todos.update(status=Todo.Status.CANCELLED)
        elif action == "restart":
            todos.update(
                status=Todo.Status.NOT_STARTED,
                completed_at=None,
                progress_percent=0,
            )
        elif action == "set_priority":
            todos.update(priority=self.validated_data["priority"])
        elif action == "set_category":
            todos.update(category_id=self.validated_data["category_id"])
        elif action == "assign":
            todos.update(assigned_to_id=self.validated_data.get("assigned_to_id"))
        elif action == "delete":
            count = todos.count()
            todos.delete()
            return {"deleted": count}
        
        return {"updated": todos.count()}
