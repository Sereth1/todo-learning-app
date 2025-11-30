"""
TodoChecklist serializer with completion logic.
"""
from rest_framework import serializers
from django.utils import timezone
from django.db.models import Max

from apps.todo_list_wedding.models import TodoChecklist, Todo


class TodoChecklistSerializer(serializers.ModelSerializer):
    """
    Serializer for checklist items with completion tracking.
    Handles automatic timestamp updates and parent todo progress.
    """
    todo_title = serializers.CharField(source="todo.title", read_only=True)
    
    class Meta:
        model = TodoChecklist
        fields = [
            "id",
            "uid",
            "todo",
            "todo_title",
            "title",
            "is_completed",
            "completed_at",
            "order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "uid", "completed_at", "created_at", "updated_at"]

    def validate_title(self, value):
        """Ensure title is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("Checklist item title cannot be empty.")
        return value.strip()

    def validate_todo(self, value):
        """Ensure todo exists and user has access."""
        # Additional permission checks can be added here
        return value

    def create(self, validated_data):
        """Create checklist item with auto-ordering."""
        if "order" not in validated_data:
            todo = validated_data.get("todo")
            max_order = TodoChecklist.objects.filter(todo=todo).aggregate(
                max_order=Max("order")
            )["max_order"] or 0
            validated_data["order"] = max_order + 1
        
        instance = super().create(validated_data)
        self._update_parent_progress(instance.todo)
        return instance

    def update(self, instance, validated_data):
        """Update checklist item and handle completion tracking."""
        old_completed = instance.is_completed
        new_completed = validated_data.get("is_completed", old_completed)
        
        # Handle completion timestamp
        if new_completed and not old_completed:
            validated_data["completed_at"] = timezone.now()
        elif not new_completed and old_completed:
            validated_data["completed_at"] = None
        
        instance = super().update(instance, validated_data)
        self._update_parent_progress(instance.todo)
        return instance

    def _update_parent_progress(self, todo):
        """
        Update parent todo's progress based on checklist completion.
        This is business logic that lives in the serializer, not the view.
        """
        checklist_items = todo.checklist_items.all()
        total = checklist_items.count()
        
        if total == 0:
            return
        
        completed = checklist_items.filter(is_completed=True).count()
        
        # Also count subtasks if any
        subtasks = todo.subtasks.exclude(status=Todo.Status.CANCELLED)
        subtask_total = subtasks.count()
        subtask_completed = subtasks.filter(status=Todo.Status.COMPLETED).count()
        
        total_items = total + subtask_total
        completed_items = completed + subtask_completed
        
        new_progress = round((completed_items / total_items) * 100) if total_items > 0 else 0
        
        if new_progress != todo.progress_percent:
            todo.progress_percent = new_progress
            
            # Auto-complete todo if all items are done
            if new_progress == 100 and todo.status != Todo.Status.COMPLETED:
                todo.status = Todo.Status.COMPLETED
                todo.completed_at = timezone.now()
            
            todo.save(update_fields=["progress_percent", "status", "completed_at"])


class TodoChecklistBulkSerializer(serializers.Serializer):
    """
    Serializer for bulk checklist operations.
    """
    items = serializers.ListField(
        child=serializers.DictField(),
        help_text='List of items: [{"title": "Item 1"}, {"title": "Item 2"}]',
    )
    
    def create_bulk(self, todo):
        """Create multiple checklist items for a todo."""
        items_data = self.validated_data.get("items", [])
        created = []
        
        for idx, item_data in enumerate(items_data):
            checklist_item = TodoChecklist.objects.create(
                todo=todo,
                title=item_data.get("title", ""),
                order=item_data.get("order", idx),
            )
            created.append(checklist_item)
        
        return created


class TodoChecklistReorderSerializer(serializers.Serializer):
    """
    Serializer for reordering checklist items.
    """
    item_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of checklist item IDs in the new order",
    )
    
    def reorder(self, todo):
        """Reorder checklist items based on the provided order."""
        item_ids = self.validated_data.get("item_ids", [])
        
        for order, item_id in enumerate(item_ids):
            TodoChecklist.objects.filter(
                id=item_id,
                todo=todo,
            ).update(order=order)
        
        return TodoChecklist.objects.filter(todo=todo).order_by("order")
